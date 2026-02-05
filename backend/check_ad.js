import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAd() {
  // 해당 광고 확인
  const { data: ad, error: adError } = await supabase
    .from('ad_archives')
    .select('*')
    .eq('id', '0574db7f-50eb-4336-bd7a-68cb3dece156')
    .single();

  if (adError) {
    console.error('Error fetching ad:', adError);
    return;
  }

  console.log('\n=== 광고 정보 ===');
  console.log('검색어:', ad.search_query);
  console.log('광고주:', ad.advertiser_name);
  console.log('광고 텍스트:', ad.ad_creative_body?.substring(0, 200));
  console.log('\n플랫폼 데이터:', JSON.stringify(ad.platform_specific_data, null, 2).substring(0, 1000));

  // 해당 광고의 미디어 확인
  const { data: media, error: mediaError } = await supabase
    .from('ad_media')
    .select('*')
    .eq('ad_id', '0574db7f-50eb-4336-bd7a-68cb3dece156');

  if (mediaError) {
    console.error('Error fetching media:', mediaError);
    return;
  }

  console.log('\n=== 미디어 정보 ===');
  console.log('총 미디어 수:', media.length);
  media.forEach((m, i) => {
    console.log(`\n[${i + 1}] ${m.media_type}`);
    console.log('  원본 URL:', m.original_url?.substring(0, 100));
    console.log('  Cloudinary:', m.cloudinary_url?.substring(0, 100));
  });

  // 같은 검색어로 수집된 총 광고 수
  const { count } = await supabase
    .from('ad_archives')
    .select('*', { count: 'exact', head: true })
    .eq('search_query', ad.search_query);

  console.log('\n=== 통계 ===');
  console.log(`"${ad.search_query}"로 수집된 총 광고:`, count);
}

checkAd().catch(console.error);
