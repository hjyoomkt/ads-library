import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMedia() {
  // 시원스쿨 광고의 미디어 확인
  const { data: ads } = await supabase
    .from('ad_archives')
    .select('id, advertiser_name')
    .eq('search_query', '시원스쿨')
    .limit(3);

  for (const ad of ads) {
    console.log(`\n=== ${ad.advertiser_name} ===`);

    const { data: media } = await supabase
      .from('ad_media')
      .select('*')
      .eq('ad_id', ad.id);

    console.log(`미디어 개수: ${media.length}`);

    if (media.length > 0) {
      const firstMedia = media[0];
      console.log('타입:', firstMedia.media_type);
      console.log('원본 URL:', firstMedia.original_url?.substring(0, 80));
      console.log('Cloudinary URL:', firstMedia.cloudinary_url?.substring(0, 80) || '❌ 없음');
      console.log('Media URL:', firstMedia.media_url?.substring(0, 80) || '❌ 없음');
    }
  }
}

checkMedia();
