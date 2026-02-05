import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecentAds() {
  console.log('\n📊 Checking recent ads in Supabase...\n');

  // 최근 광고 확인
  const { data: ads, error } = await supabase
    .from('ad_archives')
    .select('id, advertiser_name, search_query, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Found ${ads.length} recent ads:\n`);
  ads.forEach((ad, idx) => {
    console.log(`${idx + 1}. ${ad.advertiser_name}`);
    console.log(`   Search: ${ad.search_query}`);
    console.log(`   Created: ${ad.created_at}`);
    console.log('');
  });

  // 미디어 확인
  const { data: media, error: mediaError } = await supabase
    .from('ad_media')
    .select('id, media_type, media_url, cloudinary_public_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (mediaError) {
    console.error('❌ Media error:', mediaError);
    return;
  }

  console.log(`\n📸 Recent media (${media.length}):\n`);
  media.forEach((m, idx) => {
    console.log(`${idx + 1}. ${m.media_type}`);
    console.log(`   URL: ${m.media_url.substring(0, 60)}...`);
    console.log(`   Cloudinary: ${m.cloudinary_public_id ? 'Yes' : 'No'}`);
    console.log('');
  });
}

checkRecentAds();
