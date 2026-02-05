import { chromium } from 'playwright';
import fs from 'fs';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

const allResponses = [];

page.on('response', async res => {
  if (res.url().includes('graphql')) {
    try {
      const json = await res.json();
      const friendlyName = res.request().headers()['x-fb-friendly-name'];

      // 광고 데이터가 있는지 확인
      const str = JSON.stringify(json);
      if (str.includes('ad_archive') || str.includes('ad_library') || str.includes('snapshot')) {
        console.log(`\n✅ Found GraphQL response: ${friendlyName}`);
        console.log(`   Data size: ${str.length} characters`);

        allResponses.push({
          friendlyName,
          url: res.url(),
          data: json
        });

        // 저장
        fs.writeFileSync(`korea-response-${allResponses.length}.json`, JSON.stringify(json, null, 2));
        console.log(`   Saved to korea-response-${allResponses.length}.json`);
      }
    } catch (e) {
      // ignore
    }
  }
});

console.log('🇰🇷 Opening Meta Ad Library with Korean keyword...\n');
await page.goto('https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=KR&q=%EC%9E%85%EC%8B%9C%EC%9D%98%EA%B8%B0%EC%84%B8&search_type=keyword_unordered&media_type=all');

console.log('⏳ Waiting 3 seconds...');
await page.waitForTimeout(3000);

console.log('🔄 Refreshing page...');
await page.reload();

console.log('⏳ Waiting 8 seconds after refresh...');
await page.waitForTimeout(8000);

console.log('📦 Extracting initial ads from HTML...');
const htmlAdsData = await page.evaluate(() => {
  const script = Array.from(document.querySelectorAll('script'))
    .find(s => s.textContent.includes('ad_archive_id'));
  return script ? script.textContent : null;
});

if (htmlAdsData) {
  console.log(`✅ Found ads data in HTML (${Math.floor(htmlAdsData.length / 1024)}KB)`);
  fs.writeFileSync('html-ads-data.txt', htmlAdsData);
  console.log('   Saved to html-ads-data.txt');
} else {
  console.log('❌ No ads data found in HTML');
}

console.log('📜 Scrolling to load more ads...');
for (let i = 0; i < 5; i++) {
  await page.evaluate(() => window.scrollBy(0, 1000));
  await page.waitForTimeout(3000);
  console.log(`  Scroll ${i + 1}/5 - Captured ${allResponses.length} responses`);
}

console.log(`\n📊 Total GraphQL responses captured: ${allResponses.length}\n`);

if (allResponses.length > 0) {
  console.log('✅ GraphQL responses saved to korea-response-*.json files');
  console.log('Response names:');
  allResponses.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.friendlyName}`);
  });
} else {
  console.log('❌ No GraphQL responses with ad data found');
  console.log('💡 This might mean:');
  console.log('   1. No ads exist for this keyword in Korea');
  console.log('   2. Facebook is blocking the requests');
  console.log('   3. Login might be required');
}

console.log('\n⏸️  Browser stays open 5 minutes for manual inspection...');
await page.waitForTimeout(300000);

await browser.close();
