import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { scrapeMetaAds } from './src/scrapers/metaAdLibrary.js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const TEST_USER_ID = 'df757234-1cec-4ade-bbd4-5422477c2d21';

/**
 * 1단계: Cloudinary 전체 파일 삭제
 */
async function deleteAllCloudinaryFiles() {
  console.log('\n🗑️  Step 1: Cloudinary 전체 파일 삭제 중...\n');

  try {
    // ads-library 폴더의 모든 리소스 삭제
    const resources = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'ads-library/',
      max_results: 500
    });

    if (resources.resources.length === 0) {
      console.log('   ℹ️  삭제할 파일 없음\n');
      return;
    }

    console.log(`   찾은 파일: ${resources.resources.length}개`);

    // 이미지 삭제
    const imageIds = resources.resources
      .filter(r => r.resource_type === 'image')
      .map(r => r.public_id);

    if (imageIds.length > 0) {
      await cloudinary.api.delete_resources(imageIds);
      console.log(`   ✅ 이미지 삭제: ${imageIds.length}개`);
    }

    // 동영상 삭제
    const videoResources = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'ads-library/',
      resource_type: 'video',
      max_results: 500
    });

    const videoIds = videoResources.resources.map(r => r.public_id);

    if (videoIds.length > 0) {
      await cloudinary.api.delete_resources(videoIds, { resource_type: 'video' });
      console.log(`   ✅ 동영상 삭제: ${videoIds.length}개`);
    }

    console.log(`\n✅ Cloudinary 삭제 완료!\n`);
  } catch (error) {
    console.log(`   ⚠️  Cloudinary 삭제 실패:`, error.message);
  }
}

/**
 * 2단계: Supabase 테이블 데이터 삭제
 */
async function deleteAllSupabaseData() {
  console.log('🗑️  Step 2: Supabase 데이터 삭제 중...\n');

  // ad_media 먼저 삭제 (외래 키 제약)
  const { error: mediaError, count: mediaCount } = await supabase
    .from('ad_media')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 레코드

  if (mediaError) {
    console.log('   ❌ ad_media 삭제 실패:', mediaError.message);
  } else {
    console.log(`   ✅ ad_media 삭제 완료`);
  }

  // ad_archives 삭제
  const { error: adError, count: adCount } = await supabase
    .from('ad_archives')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (adError) {
    console.log('   ❌ ad_archives 삭제 실패:', adError.message);
  } else {
    console.log(`   ✅ ad_archives 삭제 완료`);
  }

  // scrape_jobs 삭제
  const { error: jobError, count: jobCount } = await supabase
    .from('scrape_jobs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (jobError) {
    console.log('   ❌ scrape_jobs 삭제 실패:', jobError.message);
  } else {
    console.log(`   ✅ scrape_jobs 삭제 완료`);
  }

  console.log(`\n✅ Supabase 삭제 완료!\n`);
}

/**
 * 3단계: 시원스쿨 키워드로 전체 스크래핑 테스트
 */
async function testFullScraping() {
  console.log('🚀 Step 3: 시원스쿨 키워드로 전체 스크래핑 시작...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const onProgress = (progress) => {
    process.stdout.write(`\r📊 진행률: ${Math.floor(progress)}%`);
  };

  try {
    const result = await scrapeMetaAds({
      searchType: 'keyword',
      searchQuery: '시원스쿨',
      maxAds: 100,
      country: 'KR',
      userId: TEST_USER_ID,
      onProgress,
      uploadToCloudinary: true,  // Cloudinary 업로드 활성화
      headless: true              // 헤드리스 모드
    });

    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ 스크래핑 완료!\n');
    console.log(`📊 결과:`);
    console.log(`   - 수집된 광고: ${result.totalCollected}개`);
    console.log(`   - Supabase 저장: ${result.savedAds}개`);
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  } catch (error) {
    console.error('\n❌ 스크래핑 실패:', error.message);
    throw error;
  }
}

/**
 * 전체 실행
 */
async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   전체 초기화 및 테스트 시작');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. Cloudinary 삭제
    await deleteAllCloudinaryFiles();

    // 2. Supabase 삭제
    await deleteAllSupabaseData();

    // 3. 전체 스크래핑 테스트
    await testFullScraping();

    console.log('🎉 전체 테스트 완료!\n');

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  }
}

// 실행
main();
