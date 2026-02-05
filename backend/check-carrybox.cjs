require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCarryBox() {
  console.log('=== 캐리박스 검색 히스토리 확인 ===\n');

  const { data: searches } = await supabase
    .from('user_search_history')
    .select('search_query, advertiser_id, created_at')
    .eq('search_query', '캐리박스')
    .order('created_at', { ascending: false });

  console.log(`총 ${searches?.length || 0}개 레코드:`);

  for (const item of searches || []) {
    const { data: brand } = await supabase
      .from('advertisers')
      .select('name')
      .eq('id', item.advertiser_id)
      .single();

    const brandShort = item.advertiser_id ? item.advertiser_id.slice(0, 8) : 'null';
    console.log(`  - advertiser_id: ${brandShort}... (${brand?.name || 'Unknown'})`);
    console.log(`    created_at: ${item.created_at}`);
  }

  console.log('\n=== 모든 브랜드의 검색 히스토리 ===\n');

  const { data: brands } = await supabase
    .from('advertisers')
    .select('id, name');

  for (const brand of brands || []) {
    const { data: brandSearches } = await supabase
      .from('user_search_history')
      .select('search_query')
      .eq('advertiser_id', brand.id);

    console.log(`${brand.name}: ${brandSearches?.length || 0}개`);
    if (brandSearches?.length > 0) {
      const recent = brandSearches.slice(0, 3);
      recent.forEach(s => console.log(`  - "${s.search_query}"`));
      if (brandSearches.length > 3) {
        console.log(`  ... ${brandSearches.length - 3}개 더`);
      }
    }
  }
}

checkCarryBox().then(() => process.exit(0));
