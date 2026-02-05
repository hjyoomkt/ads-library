import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { uploadMedia } from '../services/cloudinaryService.js';
import { extractTextFromImage } from '../services/ocrService.js';

// 환경 변수 로드
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Meta Ad Library 스크래퍼 (HTML + GraphQL 하이브리드)
 * 검증 완료: 2026-02-03
 */
export async function scrapeMetaAds({
  searchType,
  searchQuery,
  maxAds = 500,
  country = 'KR',
  onProgress = null,
  uploadToCloudinary = false,  // Cloudinary 업로드 활성화 (기본: false, 빠른 스크래핑)
  headless = false  // 헤드리스 모드 (기본: false, Bull Queue에서는 true 권장)
}) {
  const browser = await chromium.launch({
    headless: headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    const page = await context.newPage();

    const graphqlResponses = [];
    let initialAds = [];
    let totalProgress = 0;

    // GraphQL 응답 캡처 (AdLibrarySearchPaginationQuery만)
    page.on('response', async res => {
      if (res.url().includes('graphql')) {
        try {
          const json = await res.json();
          const friendlyName = res.request().headers()['x-fb-friendly-name'];

          if (friendlyName === 'AdLibrarySearchPaginationQuery') {
            graphqlResponses.push(json);
            console.log(`  [GraphQL ${graphqlResponses.length}] ${Math.floor(JSON.stringify(json).length / 1024)}KB`);

            if (onProgress) {
              totalProgress = initialAds.length + graphqlResponses.length * 10;
              const progressPercent = Math.min((totalProgress / maxAds) * 100, 100);
              onProgress(progressPercent);
            }
          }
        } catch (e) {
          // JSON 파싱 실패 무시
        }
      }
    });

    // 1. 페이지 열기
    const encodedKeyword = encodeURIComponent(searchQuery);
    const searchUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${country}&q=${encodedKeyword}&search_type=keyword_unordered&media_type=all`;

    console.log(`\n🔍 Scraping: "${searchQuery}"`);
    console.log(`📍 URL: ${searchUrl}\n`);

    await page.goto(searchUrl);
    await page.waitForTimeout(3000);

    // 2. 새로고침 (중요!)
    console.log('🔄 Refreshing...');
    await page.reload();
    await page.waitForTimeout(5000);

    // 3. HTML에서 초기 광고 추출
    console.log('📦 Extracting initial ads from HTML...');
    const htmlData = await page.evaluate(() => {
      const script = Array.from(document.querySelectorAll('script'))
        .find(s => s.textContent.includes('ad_archive_id'));
      return script ? script.textContent : null;
    });

    if (htmlData) {
      try {
        const data = JSON.parse(htmlData);
        const adLibraryData = data.require[0][3][0].__bbox.require[0][3][1].__bbox.result.data.ad_library_main;
        const edges = adLibraryData.search_results_connection.edges;

        edges.forEach(edge => {
          const collatedResults = edge.node.collated_results;
          collatedResults.forEach(ad => {
            initialAds.push(ad);
          });
        });

        console.log(`✅ Found ${initialAds.length} initial ads in HTML\n`);
      } catch (e) {
        console.log('❌ Failed to parse HTML ads:', e.message);
      }
    }

    // 4. 무한 스크롤 (GraphQL 캡처) - 자동 종료 기능
    const maxScrollCount = Math.min(50, Math.ceil(maxAds / 10));
    const noNewDataThreshold = 5; // 5회 연속 새 데이터 없으면 종료
    let scrollsWithoutNewData = 0;
    let lastResponseCount = graphqlResponses.length;

    console.log(`📜 Scrolling (최대 ${maxScrollCount}회, 자동 감지 종료)...\n`);

    for (let i = 0; i < maxScrollCount; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);

      // 새로운 GraphQL 응답이 있는지 확인
      if (graphqlResponses.length > lastResponseCount) {
        scrollsWithoutNewData = 0;
        lastResponseCount = graphqlResponses.length;
      } else {
        scrollsWithoutNewData++;
      }

      if (onProgress && i % 5 === 0) {
        console.log(`  Scroll ${i + 1}/${maxScrollCount} - GraphQL: ${graphqlResponses.length}`);
      }

      // 연속으로 새 데이터가 없으면 조기 종료
      if (scrollsWithoutNewData >= noNewDataThreshold) {
        console.log(`\n⚠️  ${noNewDataThreshold}회 연속 새 데이터 없음 - 스크롤 종료 (${i + 1}/${maxScrollCount})`);
        break;
      }
    }

    console.log(`\n✅ Scrolling complete!`);
    console.log(`📊 GraphQL responses: ${graphqlResponses.length}\n`);

    // 5. GraphQL에서 광고 추출
    console.log('📦 Parsing GraphQL responses...');
    let graphqlAds = [];

    graphqlResponses.forEach((response, idx) => {
      try {
        const edges = response.data?.ad_library_main?.search_results_connection?.edges || [];
        edges.forEach(edge => {
          const collatedResults = edge.node?.collated_results || [];
          collatedResults.forEach(ad => {
            graphqlAds.push(ad);
          });
        });
      } catch (e) {
        console.log(`  Error parsing GraphQL response ${idx + 1}`);
      }
    });

    console.log(`✅ Found ${graphqlAds.length} ads in GraphQL\n`);

    // 6. 중복 제거 및 병합
    const allRawAds = [...initialAds, ...graphqlAds];
    const uniqueAdsMap = new Map();

    allRawAds.forEach(ad => {
      if (!uniqueAdsMap.has(ad.ad_archive_id)) {
        uniqueAdsMap.set(ad.ad_archive_id, ad);
      }
    });

    const uniqueAds = Array.from(uniqueAdsMap.values()).slice(0, maxAds);

    console.log(`📊 Summary:`);
    console.log(`   HTML: ${initialAds.length}`);
    console.log(`   GraphQL: ${graphqlAds.length}`);
    console.log(`   Total: ${allRawAds.length}`);
    console.log(`   Unique: ${uniqueAds.length}\n`);

    // 7. Supabase에 저장
    let newCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    const failedAds = [];

    console.log('💾 Saving to Supabase...');

    for (const ad of uniqueAds) {
      let retries = 3;
      let saved = false;

      while (retries > 0 && !saved) {
        try {
          const result = await saveAdToSupabase(ad, searchType, searchQuery, uploadToCloudinary);

          if (result.isNew) {
            newCount++;
          } else {
            updatedCount++;
          }
          saved = true;

          if (onProgress && (newCount + updatedCount) % 10 === 0) {
            const progressPercent = Math.min(((newCount + updatedCount) / uniqueAds.length) * 100, 100);
            onProgress(progressPercent);
          }
        } catch (e) {
          retries--;
          if (retries > 0) {
            console.log(`  ⚠️  Retry ${3 - retries}/3 for ad ${ad.ad_archive_id}: ${e.message}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
          } else {
            console.log(`  ❌ Failed to save ad ${ad.ad_archive_id} after 3 attempts: ${e.message}`);
            failedCount++;
            failedAds.push({
              ad_archive_id: ad.ad_archive_id,
              advertiser: ad.snapshot?.page_name,
              error: e.message
            });
          }
        }
      }
    }

    console.log(`\n✅ Save Results:`);
    console.log(`   New: ${newCount}`);
    console.log(`   Updated: ${updatedCount}`);
    if (failedCount > 0) {
      console.log(`   Failed: ${failedCount}`);
      failedAds.forEach(fail => {
        console.log(`     - ${fail.advertiser || 'Unknown'} (${fail.ad_archive_id}): ${fail.error}`);
      });
    }
    console.log('');

    // 8. 반환 형식 변환
    const formattedAds = uniqueAds.map(ad => formatAdData(ad, searchType, searchQuery));

    return {
      ads: formattedAds,
      savedAds: newCount + updatedCount,
      newAds: newCount,
      updatedAds: updatedCount,
      failedAds: failedCount,
      totalCollected: uniqueAds.length
    };

  } catch (error) {
    console.error('❌ Scraping error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * 광고 데이터 포맷팅
 */
function formatAdData(ad, searchType, searchQuery) {
  const snapshot = ad.snapshot;

  // 이미지 수집
  const images = [];
  if (snapshot.cards) {
    snapshot.cards.forEach(card => {
      if (card.original_image_url) images.push(card.original_image_url);
    });
  }
  if (snapshot.images) {
    snapshot.images.forEach(img => {
      if (img.original_image_url) images.push(img.original_image_url);
    });
  }

  // 동영상 수집
  const videos = [];
  if (snapshot.videos) {
    snapshot.videos.forEach(video => {
      if (video.video_hd_url) {
        videos.push(video.video_hd_url);
      } else if (video.video_sd_url) {
        videos.push(video.video_sd_url);
      }
    });
  }

  // 광고 텍스트
  let adText = '';
  if (snapshot.cards?.[0]?.body) {
    adText = snapshot.cards[0].body;
  } else if (snapshot.body?.text) {
    adText = snapshot.body.text;
  } else if (snapshot.title) {
    adText = snapshot.title;
  }

  // 링크 정보
  const linkUrl = snapshot.cards?.[0]?.link_url || snapshot.link_url || '';
  const linkTitle = snapshot.cards?.[0]?.title || snapshot.title || '';

  return {
    ad_archive_id: ad.ad_archive_id,
    advertiserName: snapshot.page_name || 'Unknown',
    adText: adText,
    linkTitle: linkTitle,
    linkUrl: linkUrl,
    startedRunningDate: ad.start_date
      ? new Date(ad.start_date * 1000).toISOString().split('T')[0]
      : null,
    endDate: ad.end_date
      ? new Date(ad.end_date * 1000).toISOString().split('T')[0]
      : null,
    platforms: ad.publisher_platform || [],
    imageUrls: [...new Set(images)].slice(0, 5),
    videoUrls: [...new Set(videos)].slice(0, 3),
    isActive: ad.is_active || false,
    impressions: ad.impressions_with_index?.impressions_text || null
  };
}

/**
 * Supabase에 광고 저장
 * @returns {Promise<{isNew: boolean}>} 새로운 광고면 isNew: true, 업데이트면 isNew: false
 */
async function saveAdToSupabase(ad, searchType, searchQuery, uploadToCloudinary = false) {
  const snapshot = ad.snapshot;

  // 광고 텍스트
  let adText = '';
  if (snapshot.cards?.[0]?.body) {
    adText = snapshot.cards[0].body;
  } else if (snapshot.body?.text) {
    adText = snapshot.body.text;
  }

  // 실제 링크 URL 추출
  const actualLinkUrl = snapshot.link_url || snapshot.cards?.[0]?.link_url || '';

  // 시작 날짜
  const startedRunningDate = ad.start_date
    ? new Date(ad.start_date * 1000).toISOString().split('T')[0]
    : null;

  // 1. 먼저 기존 광고가 있는지 확인 (ad_archive_id 기반 중복 체크)
  const { data: existingAd } = await supabase
    .from('ad_archives')
    .select('id')
    .eq('platform', 'meta')
    .eq('ad_archive_id', ad.ad_archive_id)
    .maybeSingle();

  const isNew = !existingAd;

  // 2. ad_archives 테이블에 광고 저장 (upsert)
  const { data: adData, error: adError } = await supabase
    .from('ad_archives')
    .upsert({
      platform: 'meta',
      search_type: searchType,
      search_query: searchQuery,
      ad_archive_id: ad.ad_archive_id,  // Meta 고유 ID를 별도 컬럼으로 저장
      advertiser_name: snapshot.page_name,
      ad_creative_body: adText,
      ad_creative_link_title: snapshot.cards?.[0]?.title || snapshot.title,
      ad_creative_link_description: snapshot.cards?.[0]?.link_description,
      ad_creative_link_url: actualLinkUrl,  // 실제 링크 URL
      started_running_date: ad.start_date
        ? new Date(ad.start_date * 1000).toISOString().split('T')[0]
        : null,
      last_shown_date: ad.end_date
        ? new Date(ad.end_date * 1000).toISOString().split('T')[0]
        : null,
      platform_specific_data: {
        ad_archive_id: ad.ad_archive_id,  // JSONB에도 유지 (하위 호환성)
        publisher_platform: ad.publisher_platform,
        is_active: ad.is_active,
        impressions: ad.impressions_with_index?.impressions_text,
        page_profile_uri: snapshot.page_profile_uri,
        cta_text: snapshot.cta_text,
        caption: snapshot.caption  // 보여지는 링크 (예: "nike.com")
      }
    }, {
      onConflict: 'platform,ad_archive_id'  // ad_archive_id 기반 중복 체크 (user_id 제거)
    })
    .select()
    .single();

  if (adError) {
    console.log(`  Supabase error (ad_archives):`, adError.message);
    throw new Error(`Failed to save ad: ${adError.message}`);
  }

  // 2. ad_media 테이블에 미디어 저장 (이미지 + 동영상 + Cloudinary + OCR)
  const mediaItems = [];
  let position = 0;

  // 이미지 수집 및 처리
  const imageUrls = [];
  if (snapshot.cards) {
    snapshot.cards.forEach(card => {
      if (card.original_image_url) imageUrls.push(card.original_image_url);
    });
  }
  if (snapshot.images) {
    snapshot.images.forEach(img => {
      if (img.original_image_url) imageUrls.push(img.original_image_url);
    });
  }

  // 동영상 수집
  const videoUrls = [];
  if (snapshot.videos) {
    snapshot.videos.forEach(video => {
      const videoUrl = video.video_hd_url || video.video_sd_url;
      if (videoUrl) videoUrls.push(videoUrl);
    });
  }

  // 이미지 처리 (Cloudinary 업로드는 선택적)
  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];

    if (uploadToCloudinary) {
      // 1. 먼저 기존에 업로드된 이미지가 있는지 확인
      const { data: existingMedia } = await supabase
        .from('ad_media')
        .select('cloudinary_public_id, media_url, ocr_text, ocr_confidence, metadata')
        .eq('ad_id', adData.id)
        .eq('position', position)
        .eq('original_url', imageUrl)
        .single();

      if (existingMedia?.cloudinary_public_id) {
        // 이미 업로드됨 - 기존 데이터 재사용
        console.log(`  ♻️  Reusing existing image ${i + 1} (${existingMedia.cloudinary_public_id})`);
        mediaItems.push({
          ad_id: adData.id,
          media_type: 'image',
          media_url: existingMedia.media_url,
          original_url: imageUrl,
          cloudinary_public_id: existingMedia.cloudinary_public_id,
          ocr_text: existingMedia.ocr_text,
          ocr_confidence: existingMedia.ocr_confidence,
          position: position,
          metadata: existingMedia.metadata
        });
      } else {
        // 새로 업로드
        try {
          const cloudinaryResult = await uploadMedia(imageUrl, 'image', {
            adId: adData.id,
            position: position
          });

          // OCR 비활성화 (속도 개선)
          // const ocrResult = await extractTextFromImage(cloudinaryResult.url);

          mediaItems.push({
            ad_id: adData.id,
            media_type: 'image',
            media_url: cloudinaryResult.url,
            original_url: imageUrl,
            cloudinary_public_id: cloudinaryResult.publicId,
            ocr_text: null, // ocrResult.text,
            ocr_confidence: null, // ocrResult.confidence,
            position: position,
            metadata: {
              width: cloudinaryResult.width,
              height: cloudinaryResult.height,
              format: cloudinaryResult.format,
              bytes: cloudinaryResult.bytes
            }
          });
        } catch (error) {
          console.log(`  ⚠️  Failed to upload image ${i + 1}:`, error.message);
          // 실패 시 원본 URL로 저장
          mediaItems.push({
            ad_id: adData.id,
            media_type: 'image',
            media_url: imageUrl,
            original_url: imageUrl,
            position: position,
            metadata: { upload_error: error.message }
          });
        }
      }
    } else {
      // Cloudinary 없이 원본 URL만 저장
      mediaItems.push({
        ad_id: adData.id,
        media_type: 'image',
        media_url: imageUrl,
        original_url: imageUrl,
        position: position
      });
    }

    position++;
  }

  // 동영상 처리 (Cloudinary 업로드는 선택적)
  for (let i = 0; i < videoUrls.length; i++) {
    const videoUrl = videoUrls[i];

    if (uploadToCloudinary) {
      // 1. 먼저 기존에 업로드된 동영상이 있는지 확인
      const { data: existingMedia } = await supabase
        .from('ad_media')
        .select('cloudinary_public_id, media_url, metadata')
        .eq('ad_id', adData.id)
        .eq('position', position)
        .eq('original_url', videoUrl)
        .single();

      if (existingMedia?.cloudinary_public_id) {
        // 이미 업로드됨 - 기존 데이터 재사용
        console.log(`  ♻️  Reusing existing video ${i + 1} (${existingMedia.cloudinary_public_id})`);
        mediaItems.push({
          ad_id: adData.id,
          media_type: 'video',
          media_url: existingMedia.media_url,
          original_url: videoUrl,
          cloudinary_public_id: existingMedia.cloudinary_public_id,
          position: position,
          metadata: existingMedia.metadata
        });
      } else {
        // 새로 업로드
        try {
          const cloudinaryResult = await uploadMedia(videoUrl, 'video', {
            adId: adData.id,
            position: position
          });

          mediaItems.push({
            ad_id: adData.id,
            media_type: 'video',
            media_url: cloudinaryResult.url,
            original_url: videoUrl,
            cloudinary_public_id: cloudinaryResult.publicId,
            position: position,
            metadata: {
              width: cloudinaryResult.width,
              height: cloudinaryResult.height,
              duration: cloudinaryResult.duration,
              format: cloudinaryResult.format,
              bytes: cloudinaryResult.bytes
            }
          });
        } catch (error) {
          console.log(`  ⚠️  Failed to upload video ${i + 1}:`, error.message);
          // 실패 시 원본 URL로 저장
          mediaItems.push({
            ad_id: adData.id,
            media_type: 'video',
            media_url: videoUrl,
            original_url: videoUrl,
            position: position,
            metadata: { upload_error: error.message }
          });
        }
      }
    } else {
      // Cloudinary 없이 원본 URL만 저장
      mediaItems.push({
        ad_id: adData.id,
        media_type: 'video',
        media_url: videoUrl,
        original_url: videoUrl,
        position: position
      });
    }

    position++;
  }

  // Supabase에 미디어 저장
  if (mediaItems.length > 0) {
    const { error: mediaError } = await supabase
      .from('ad_media')
      .upsert(mediaItems, {
        onConflict: 'ad_id,position'
      });

    if (mediaError) {
      console.log(`  Supabase error (ad_media):`, mediaError.message);
      throw new Error(`Failed to save media: ${mediaError.message}`);
    } else {
      console.log(`  ✅ Saved ${mediaItems.length} media items (${imageUrls.length} images, ${videoUrls.length} videos)`);
    }
  }

  return { isNew };
}
