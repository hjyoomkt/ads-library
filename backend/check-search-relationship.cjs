require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRelationship() {
  console.log('=== ad_archives 샘플 데이터 ===\n');
  const { data: ads } = await supabase
    .from('ad_archives')
    .select('search_query, advertiser_name, created_at')
    .limit(5);

  ads?.forEach(ad => {
    console.log(`검색어: "${ad.search_query}", 광고주: ${ad.advertiser_name}`);
  });

  console.log('\n=== "차맵" 검색어로 저장된 광고 수 ===\n');
  const { count } = await supabase
    .from('ad_archives')
    .select('*', { count: 'exact', head: true })
    .eq('search_query', '차맵');

  console.log(`총 ${count}개 광고`);

  console.log('\n=== user_search_history와 ad_archives 관계 ===\n');
  const { data: history } = await supabase
    .from('user_search_history')
    .select('*')
    .limit(3);

  for (const h of history || []) {
    const { count: adCount } = await supabase
      .from('ad_archives')
      .select('*', { count: 'exact', head: true })
      .eq('search_query', h.search_query);

    const brandShort = h.advertiser_id ? h.advertiser_id.slice(0, 8) : 'null';
    console.log(`히스토리: "${h.search_query}" (advertiser_id: ${brandShort}...)`);
    console.log(`  → ad_archives에 ${adCount}개 광고 (서버 귀속, 모든 브랜드 공유)`);
  }

  console.log('\n=== 시나리오: 타 브랜드가 같은 키워드 검색 ===\n');

  // 브랜드별 검색 히스토리 확인
  const { data: brands } = await supabase
    .from('advertisers')
    .select('id, name')
    .limit(5);

  console.log('브랜드 목록:');
  brands?.forEach(b => console.log(`  - ${b.name} (${b.id.slice(0, 8)}...)`));

  console.log('\n각 브랜드의 검색 히스토리:');
  for (const brand of brands || []) {
    const { data: searches } = await supabase
      .from('user_search_history')
      .select('search_query')
      .eq('advertiser_id', brand.id);

    console.log(`  ${brand.name}: ${searches?.length || 0}개 검색`);
    searches?.forEach(s => console.log(`    - "${s.search_query}"`));
  }
}

checkRelationship().then(() => process.exit(0));
