import { scrapeMetaAds } from './src/scrapers/metaAdLibrary.js';

console.log('🚀 시원스쿨 스크래핑 시작...\n');

const result = await scrapeMetaAds({
  searchType: 'keyword',
  searchQuery: '시원스쿨',
  maxAds: 50,
  country: 'KR',
  userId: 'df757234-1cec-4ade-bbd4-5422477c2d21',
  uploadToCloudinary: true,
  headless: true,
  onProgress: (p) => process.stdout.write(`\r진행률: ${Math.floor(p)}%`)
});

console.log('\n\n✅ 완료!');
console.log(`수집: ${result.totalCollected}개`);
console.log(`저장: ${result.savedAds}개`);
