import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAds() {
  const { count } = await supabase
    .from('ad_archives')
    .select('*', { count: 'exact', head: true })
    .eq('search_query', '시원스쿨');

  console.log('\n"시원스쿨" 광고 수:', count);

  if (count > 0) {
    const { data } = await supabase
      .from('ad_archives')
      .select('advertiser_name, ad_creative_body')
      .eq('search_query', '시원스쿨')
      .limit(3);

    console.log('\n최근 3개 광고:');
    data.forEach((ad, i) => {
      console.log(`\n[${i + 1}] ${ad.advertiser_name}`);
      console.log(`   ${ad.ad_creative_body?.substring(0, 100)}...`);
    });
  }
}

checkAds();
