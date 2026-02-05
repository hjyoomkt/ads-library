import { scrapeMetaAds } from './src/scrapers/metaAdLibrary.js';

console.log('🚀 Starting Playwright test...\n');

try {
  const ads = await scrapeMetaAds({
    searchType: 'keyword',
    searchQuery: 'nike',
    maxAds: 5  // 테스트용 - 5개만
  });

  console.log(`\n✅ Success! Scraped ${ads.length} ads`);
  console.log('\nFirst ad:');
  console.log(JSON.stringify(ads[0], null, 2));

} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error('\nStack:', error.stack);
}

process.exit(0);
