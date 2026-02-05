import { chromium } from 'playwright';
import fs from 'fs';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

const allGraphQLResponses = [];
const adsFound = [];

// GraphQL 응답 캡처
page.on('response', async (response) => {
  if (response.url().includes('graphql')) {
    try {
      const json = await response.json();
      const friendlyName = response.request().headers()['x-fb-friendly-name'];

      console.log(`\n🔍 GraphQL: ${friendlyName}`);

      // 모든 응답 저장
      allGraphQLResponses.push({
        friendlyName,
        data: json
      });

      // 광고 데이터 확인
      const results = json?.data?.ad_library_main?.search_results_connection;
      if (results) {
        const edges = results.edges || [];
        console.log(`  ✅ Found ${edges.length} ad edges!`);

        for (const edge of edges) {
          const collated = edge.node?.collated_results || [];
          for (const ad of collated) {
            adsFound.push({
              id: ad.ad_archive_id,
              advertiser: ad.snapshot?.page_name,
              text: ad.snapshot?.cards?.[0]?.body || ad.snapshot?.body?.text
            });
          }
        }

        console.log(`  📊 Total ads collected: ${adsFound.length}`);
      }
    } catch (e) {
      // ignore
    }
  }
});

console.log('📍 Opening Facebook Ad Library...\n');
await page.goto('https://www.facebook.com/ads/library/');

console.log('⏸️  브라우저가 열렸습니다!');
console.log('👉 이제 직접 다음 작업을 해주세요:');
console.log('   1. 국가를 대한민국(KR)으로 선택');
console.log('   2. 광고 카테고리를 "모든 광고"로 변경');
console.log('   3. "입시의기세" 검색');
console.log('   4. 광고가 로드되는 것 확인\n');
console.log('⏰ 120초 대기 중... GraphQL 응답을 자동으로 캡처합니다.\n');

try {
  await page.waitForTimeout(120000);
} catch (e) {
  console.log('\n⚠️  브라우저가 닫혔습니다.');
}

console.log('\n✅ 캡처 완료!');
console.log(`📊 총 ${allGraphQLResponses.length}개의 GraphQL 응답 캡처됨`);
console.log(`📢 총 ${adsFound.length}개의 광고 발견됨\n`);

// 결과 저장
if (allGraphQLResponses.length > 0) {
  fs.writeFileSync('captured-graphql-responses.json', JSON.stringify(allGraphQLResponses, null, 2));
  console.log('💾 Saved to captured-graphql-responses.json');
}

if (adsFound.length > 0) {
  fs.writeFileSync('captured-ads.json', JSON.stringify(adsFound, null, 2));
  console.log('💾 Saved to captured-ads.json');

  console.log('\n📋 발견된 광고 목록:');
  adsFound.slice(0, 5).forEach((ad, i) => {
    console.log(`  ${i + 1}. ${ad.advertiser}`);
    console.log(`     ${ad.text?.substring(0, 50)}...`);
  });
}

await browser.close();
console.log('\n✅ Done!');
