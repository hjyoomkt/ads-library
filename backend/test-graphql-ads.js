import { chromium } from 'playwright';
import fs from 'fs';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

const allRequests = [];
const allResponses = [];

page.on('request', req => {
  if (req.url().includes('graphql')) {
    const postData = req.postData();
    if (postData && (postData.includes('AdLibrary') || postData.includes('Search'))) {
      allRequests.push({
        url: req.url(),
        postData: postData.substring(0, 2000),  // 처음 2000자만
        friendlyName: req.headers()['x-fb-friendly-name']
      });
    }
  }
});

page.on('response', async res => {
  if (res.url().includes('graphql')) {
    try {
      const json = await res.json();
      const friendlyName = res.request().headers()['x-fb-friendly-name'];

      // 광고 데이터가 있는지 확인
      const str = JSON.stringify(json);
      if (str.includes('ad_archive') || str.includes('snapshot') || str.includes('advertiser')) {
        console.log(`\n✅ Found ads in: ${friendlyName}`);
        allResponses.push({
          friendlyName,
          data: json
        });

        // 저장
        fs.writeFileSync(`response-${allResponses.length}.json`, JSON.stringify(json, null, 2));
      }
    } catch (e) {
      // ignore
    }
  }
});

await page.goto('https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=nike');

console.log('⏳ Waiting 8 seconds...');
await page.waitForTimeout(8000);

console.log('📜 Scrolling to load more ads...');
for (let i = 0; i < 3; i++) {
  await page.evaluate(() => window.scrollBy(0, 1000));
  await page.waitForTimeout(3000);
  console.log(`  Scroll ${i + 1}/3`);
}

console.log(`\n📊 Captured:`);
console.log(`  - ${allRequests.length} GraphQL requests`);
console.log(`  - ${allResponses.length} responses with ad data\n`);

if (allRequests.length > 0) {
  fs.writeFileSync('all-graphql-requests.json', JSON.stringify(allRequests, null, 2));
  console.log('✅ Saved → all-graphql-requests.json\n');
}

console.log('⏸️  Browser stays open 20 seconds...');
await page.waitForTimeout(20000);

await browser.close();
