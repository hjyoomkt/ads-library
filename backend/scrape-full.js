import { chromium } from 'playwright';
import fs from 'fs';

const KEYWORD = '나이키';
const SCROLL_COUNT = 50; // 스크롤 횟수
const SCROLL_DELAY = 2000; // 스크롤 간격 (ms)

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

const graphqlResponses = [];
let responseCount = 0;

// GraphQL 응답 캡처
page.on('response', async res => {
  if (res.url().includes('graphql')) {
    try {
      const json = await res.json();
      const friendlyName = res.request().headers()['x-fb-friendly-name'];

      responseCount++;

      const str = JSON.stringify(json);
      if (friendlyName === 'AdLibrarySearchPaginationQuery') {
        console.log(`[GraphQL ${graphqlResponses.length + 1}] AdLibrarySearchPaginationQuery - ${Math.floor(str.length / 1024)}KB`);

        graphqlResponses.push(json);
        fs.writeFileSync(`graphql-${graphqlResponses.length}.json`, JSON.stringify(json, null, 2));
      }
    } catch (e) {
      // ignore
    }
  }
});

console.log(`\n🔍 Starting scraper for keyword: ${KEYWORD}\n`);

// 페이지 열기
const encodedKeyword = encodeURIComponent(KEYWORD);
await page.goto(`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=KR&q=${encodedKeyword}&search_type=keyword_unordered&media_type=all`);

console.log('⏳ Waiting 3 seconds...');
await page.waitForTimeout(3000);

console.log('🔄 Refreshing page...');
await page.reload();

console.log('⏳ Waiting 5 seconds after refresh...');
await page.waitForTimeout(5000);

// 1. HTML에서 초기 데이터 추출
console.log('\n📦 Extracting initial ads from HTML...');
const htmlData = await page.evaluate(() => {
  const script = Array.from(document.querySelectorAll('script'))
    .find(s => s.textContent.includes('ad_archive_id'));
  return script ? script.textContent : null;
});

let initialAds = [];
if (htmlData) {
  try {
    const data = JSON.parse(htmlData);
    const adLibraryData = data.require[0][3][0].__bbox.require[0][3][1].__bbox.result.data.ad_library_main;
    const edges = adLibraryData.search_results_connection.edges;

    edges.forEach(edge => {
      const collatedResults = edge.node.collated_results;
      collatedResults.forEach(ad => {
        initialAds.push({
          ad_archive_id: ad.ad_archive_id,
          page_name: ad.snapshot.page_name,
          source: 'HTML'
        });
      });
    });

    console.log(`✅ Found ${initialAds.length} initial ads in HTML`);
    fs.writeFileSync('initial-html-ads.json', JSON.stringify(initialAds, null, 2));
  } catch (e) {
    console.log('❌ Failed to parse HTML ads:', e.message);
  }
} else {
  console.log('❌ No ads data found in HTML');
}

// 2. 무한 스크롤 시작
console.log(`\n📜 Starting infinite scroll (${SCROLL_COUNT} times)...\n`);

for (let i = 0; i < SCROLL_COUNT; i++) {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  console.log(`  Scroll ${i + 1}/${SCROLL_COUNT} - GraphQL responses: ${graphqlResponses.length}`);

  await page.waitForTimeout(SCROLL_DELAY);
}

console.log(`\n✅ Scrolling complete!`);
console.log(`📊 Total GraphQL responses: ${graphqlResponses.length}`);

// 3. GraphQL에서 광고 추출
console.log('\n📦 Extracting ads from GraphQL responses...');
let graphqlAds = [];

graphqlResponses.forEach((response, idx) => {
  try {
    const edges = response.data?.ad_library_main?.search_results_connection?.edges || [];
    edges.forEach(edge => {
      const collatedResults = edge.node?.collated_results || [];
      collatedResults.forEach(ad => {
        graphqlAds.push({
          ad_archive_id: ad.ad_archive_id,
          page_name: ad.snapshot?.page_name,
          source: 'GraphQL',
          response_index: idx + 1
        });
      });
    });
  } catch (e) {
    console.log(`  Error parsing GraphQL response ${idx + 1}:`, e.message);
  }
});

console.log(`✅ Found ${graphqlAds.length} ads in GraphQL responses`);

// 4. 중복 제거 및 합치기
const allAds = [...initialAds, ...graphqlAds];
const uniqueAds = Array.from(
  new Map(allAds.map(ad => [ad.ad_archive_id, ad])).values()
);

console.log(`\n📊 Final Summary:`);
console.log(`   Initial (HTML): ${initialAds.length} ads`);
console.log(`   GraphQL: ${graphqlAds.length} ads`);
console.log(`   Total: ${allAds.length} ads`);
console.log(`   Unique: ${uniqueAds.length} ads`);

fs.writeFileSync('all-ads-summary.json', JSON.stringify({
  keyword: KEYWORD,
  initial_count: initialAds.length,
  graphql_count: graphqlAds.length,
  total_count: allAds.length,
  unique_count: uniqueAds.length,
  ads: uniqueAds
}, null, 2));

console.log(`\n💾 Saved to all-ads-summary.json`);

await browser.close();
console.log('\n✅ Done!\n');
