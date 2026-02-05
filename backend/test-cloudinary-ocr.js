import dotenv from 'dotenv';
import { scrapeMetaAds } from './src/scrapers/metaAdLibrary.js';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCloudinaryOCR() {
  console.log('\n🧪 Testing Cloudinary + OCR Integration\n');
  console.log('─'.repeat(60));

  try {
    const testUserId = 'df757234-1cec-4ade-bbd4-5422477c2d21';

    // 적은 수의 광고만 테스트 (5개)
    console.log('📦 Scraping 5 ads for testing...\n');

    const results = await scrapeMetaAds({
      searchType: 'keyword',
      searchQuery: '나이키',
      maxAds: 5,
      country: 'KR',
      userId: testUserId,
      onProgress: (progress) => {
        console.log(`  Progress: ${progress.progress}/${progress.total}`);
      }
    });

    console.log(`\n✅ Scraping completed! Collected ${results.length} ads\n`);

    // Supabase에서 저장된 미디어 확인
    console.log('🔍 Checking media in Supabase...\n');

    const { data: mediaData, error } = await supabase
      .from('ad_media')
      .select('id, ad_id, media_type, media_url, original_url, cloudinary_public_id, ocr_text, ocr_confidence, metadata')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching media:', error);
      return;
    }

    console.log(`✅ Found ${mediaData.length} media items\n`);

    mediaData.forEach((media, idx) => {
      console.log(`${idx + 1}. ${media.media_type.toUpperCase()}`);
      console.log(`   Cloudinary ID: ${media.cloudinary_public_id || '(none)'}`);
      console.log(`   Cloudinary URL: ${media.media_url?.substring(0, 60)}...`);
      console.log(`   Original URL: ${media.original_url?.substring(0, 60)}...`);

      if (media.media_type === 'image') {
        console.log(`   OCR Confidence: ${media.ocr_confidence?.toFixed(1)}%`);
        console.log(`   OCR Text: ${media.ocr_text?.substring(0, 100)}...`);
      }

      if (media.metadata) {
        console.log(`   Metadata: ${JSON.stringify(media.metadata).substring(0, 80)}...`);
      }

      console.log('');
    });

    // 통계
    const imageCount = mediaData.filter(m => m.media_type === 'image').length;
    const videoCount = mediaData.filter(m => m.media_type === 'video').length;
    const withCloudinary = mediaData.filter(m => m.cloudinary_public_id).length;
    const withOCR = mediaData.filter(m => m.ocr_text && m.ocr_text.length > 0).length;

    console.log('📊 Statistics:');
    console.log(`   Images: ${imageCount}`);
    console.log(`   Videos: ${videoCount}`);
    console.log(`   Uploaded to Cloudinary: ${withCloudinary}/${mediaData.length}`);
    console.log(`   With OCR text: ${withOCR}/${imageCount} images`);

    if (withCloudinary === mediaData.length) {
      console.log('\n✅ All media uploaded to Cloudinary successfully!');
    } else {
      console.log(`\n⚠️  ${mediaData.length - withCloudinary} media items not uploaded to Cloudinary`);
    }

    if (imageCount > 0 && withOCR === imageCount) {
      console.log('✅ OCR completed for all images!');
    } else if (imageCount > 0) {
      console.log(`⚠️  ${imageCount - withOCR} images missing OCR text`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  }

  console.log('\n─'.repeat(60));
  console.log('✅ Test completed!\n');
}

testCloudinaryOCR();
