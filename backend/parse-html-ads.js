import fs from 'fs';

// HTML에서 추출한 데이터 읽기
const rawData = fs.readFileSync('html-ads-data.txt', 'utf-8');

// JSON 파싱
const data = JSON.parse(rawData);

// 광고 데이터 추출
const adLibraryData = data.require[0][3][0].__bbox.require[0][3][1].__bbox.result.data.ad_library_main;

const searchResults = adLibraryData.search_results_connection;
const totalCount = searchResults.count;
const edges = searchResults.edges;

console.log(`\n📊 Total ads found: ${totalCount}`);
console.log(`📦 Edges count: ${edges.length}\n`);

// 모든 광고 추출
const allAds = [];

edges.forEach((edge, edgeIndex) => {
  const collatedResults = edge.node.collated_results;

  collatedResults.forEach((ad, adIndex) => {
    const adData = {
      ad_archive_id: ad.ad_archive_id,
      collation_count: ad.collation_count,
      page_id: ad.page_id,
      page_name: ad.snapshot.page_name,
      page_profile_uri: ad.snapshot.page_profile_uri,
      caption: ad.snapshot.caption,
      cta_text: ad.snapshot.cta_text,
      link_url: ad.snapshot.link_url,
      display_format: ad.snapshot.display_format,
      body_text: ad.snapshot.body?.text || ad.snapshot.title,
      cards: ad.snapshot.cards || [],
      images: ad.snapshot.images || [],
      videos: ad.snapshot.videos || [],
      page_categories: ad.snapshot.page_categories || [],
    };

    allAds.push(adData);

    console.log(`[${allAds.length}] ${adData.page_name}`);
    console.log(`    ID: ${adData.ad_archive_id}`);
    console.log(`    Format: ${adData.display_format}`);
    console.log(`    CTA: ${adData.cta_text}`);
    if (adData.body_text) {
      const preview = adData.body_text.substring(0, 100).replace(/\n/g, ' ');
      console.log(`    Text: ${preview}...`);
    }
    console.log('');
  });
});

// 결과 저장
fs.writeFileSync('extracted-ads.json', JSON.stringify(allAds, null, 2));
console.log(`\n✅ Extracted ${allAds.length} ads`);
console.log(`💾 Saved to extracted-ads.json\n`);

// 통계
const formats = {};
allAds.forEach(ad => {
  formats[ad.display_format] = (formats[ad.display_format] || 0) + 1;
});

console.log('📈 Ad formats:');
Object.entries(formats).forEach(([format, count]) => {
  console.log(`   ${format}: ${count}`);
});
