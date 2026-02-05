import { chromium } from 'playwright';
import fs from 'fs';

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

// 네트워크 요청 캡처
const requests = [];
page.on('request', request => {
  if (request.url().includes('graphql') || request.url().includes('ads/library')) {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      postData: request.postData()
    });
  }
});

page.on('response', async response => {
  if (response.url().includes('graphql')) {
    try {
      const data = await response.json();
      console.log('\n🎯 GraphQL Response found!');
      console.log('URL:', response.url());
      console.log('Status:', response.status());

      // 응답 저장
      fs.writeFileSync('graphql-response.json', JSON.stringify(data, null, 2));
      console.log('✅ Saved to graphql-response.json\n');
    } catch (e) {
      // ignore
    }
  }
});

console.log('📍 Navigating to Meta Ad Library...');
await page.goto('https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=nike');

console.log('\n⏳ Waiting 10 seconds for GraphQL requests...\n');
await page.waitForTimeout(10000);

// 캡처된 요청 저장
if (requests.length > 0) {
  fs.writeFileSync('graphql-requests.json', JSON.stringify(requests, null, 2));
  console.log(`✅ Captured ${requests.length} requests → graphql-requests.json\n`);

  // GraphQL 요청 출력
  const graphqlReqs = requests.filter(r => r.url.includes('graphql'));
  if (graphqlReqs.length > 0) {
    console.log('🎯 GraphQL Request:');
    console.log(JSON.stringify(graphqlReqs[0], null, 2));
  }
} else {
  console.log('❌ No GraphQL requests captured');
}

console.log('\n⏸️  Browser will stay open for 30 seconds...');
await page.waitForTimeout(30000);

await browser.close();
console.log('Done!');
