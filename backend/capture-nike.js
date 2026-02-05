import { chromium } from 'playwright';
import fs from 'fs';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

const allResponses = [];
let responseCount = 0;

page.on('response', async res => {
  if (res.url().includes('graphql')) {
    try {
      const json = await res.json();
      const friendlyName = res.request().headers()['x-fb-friendly-name'];

      responseCount++;
      console.log(`\n[${responseCount}] GraphQL: ${friendlyName}`);

      // 광고 데이터가 있는지 확인
      const str = JSON.stringify(json);
      if (str.includes('ad_archive') || str.includes('search_results_connection')) {
        console.log(`   ✅ HAS AD DATA - Size: ${Math.floor(str.length / 1024)}KB`);

        allResponses.push({
          friendlyName,
          url: res.url(),
          data: json
        });

        // 저장
        fs.writeFileSync(`nike-response-${allResponses.length}.json`, JSON.stringify(json, null, 2));
        console.log(`   💾 Saved to nike-response-${allResponses.length}.json`);
      } else {
        console.log(`   ⚪ No ad data`);
      }
    } catch (e) {
      // ignore
    }
  }
});

console.log('🏃 Opening Meta Ad Library with Nike keyword...\n');
await page.goto('https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=KR&q=%EB%82%98%EC%9D%B4%ED%82%A4&search_type=keyword_unordered&media_type=all');

console.log('⏳ Waiting 3 seconds...\n');
await page.waitForTimeout(3000);

console.log('🔄 Refreshing page...\n');
await page.reload();

console.log('⏳ Waiting 5 seconds after refresh...\n');
await page.waitForTimeout(5000);

console.log('👀 Ready for manual interaction. Browser will stay open until you close it.\n');
console.log('📊 GraphQL responses will be captured automatically.\n');

// 무한 대기 - 사용자가 브라우저를 닫을 때까지
await page.waitForEvent('close').catch(() => {});

console.log(`\n✅ Page closed. Total ad responses captured: ${allResponses.length}`);
