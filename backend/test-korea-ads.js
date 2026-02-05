import { scrapeMetaAds } from './src/scrapers/metaAdLibrary.js';

console.log('🇰🇷 Testing Meta Ad Library scraper with Korean keyword and country filter...\n');

const result = await scrapeMetaAds({
  searchType: 'keyword',
  searchQuery: '입시의기세',
  maxAds: 10,
  country: 'KR'  // 대한민국
});

console.log(`\n✅ Total: ${result.length} ads scraped\n`);

if (result.length > 0) {
  console.log('📊 First ad:');
  console.log(JSON.stringify(result[0], null, 2));
  console.log('\n📊 All advertiser names:');
  result.forEach((ad, i) => {
    console.log(`  ${i + 1}. ${ad.advertiserName}`);
  });
} else {
  console.log('❌ No ads found');
}
