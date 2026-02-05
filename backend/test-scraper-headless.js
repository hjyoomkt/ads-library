import { scrapeMetaAds } from './src/scrapers/metaAdLibrary.js';

/**
 * 헤드리스 모드 테스트 (Redis 없이 직접 실행)
 * Bull Queue 통합 전에 스크래퍼 기능 검증용
 */

const testUserId = 'df757234-1cec-4ade-bbd4-5422477c2d21';

console.log('🚀 Starting headless scraper test...\n');
console.log('⚙️  Settings:');
console.log('   - Headless: true');
console.log('   - Upload to Cloudinary: false');
console.log('   - Max Ads: 50');
console.log('   - Keyword: 시원스쿨\n');

try {
  const result = await scrapeMetaAds({
    searchType: 'keyword',
    searchQuery: '시원스쿨',
    maxAds: 50,
    country: 'KR',
    userId: testUserId,
    headless: true,  // 헤드리스 모드 테스트
    uploadToCloudinary: false,  // 빠른 모드
    onProgress: (progress) => {
      console.log(`📊 Progress: ${Math.round(progress)}%`);
    }
  });

  console.log('\n✅ Test completed!');
  console.log(`📝 Saved ${result.savedAds} ads`);
  console.log(`🎯 Total collected: ${result.totalCollected || 'N/A'}`);

} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
