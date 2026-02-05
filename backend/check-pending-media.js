import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPendingMedia() {
  console.log('\n🔍 Checking pending media details...\n');

  // cloudinary_public_id가 null인 것
  const { data: nullId, error: error1 } = await supabase
    .from('ad_media')
    .select('id, media_type, original_url, media_url, cloudinary_public_id')
    .is('cloudinary_public_id', null)
    .limit(20);

  console.log(`Items with NULL cloudinary_public_id: ${nullId?.length || 0}`);
  if (nullId && nullId.length > 0) {
    nullId.forEach((item, idx) => {
      console.log(`\n${idx + 1}. ${item.media_type}`);
      console.log(`   ID: ${item.id}`);
      console.log(`   Original: ${item.original_url?.substring(0, 60)}...`);
      console.log(`   Media URL: ${item.media_url?.substring(0, 60)}...`);
    });
  }

  // original_url과 media_url이 같은 것 (업로드 안된 것)
  const { data: allMedia } = await supabase
    .from('ad_media')
    .select('id, media_type, original_url, media_url, cloudinary_public_id');

  const notUploaded = allMedia.filter(m =>
    m.original_url && m.media_url === m.original_url
  );

  console.log(`\n\nItems where media_url == original_url (not uploaded): ${notUploaded.length}`);
  if (notUploaded.length > 0) {
    notUploaded.slice(0, 10).forEach((item, idx) => {
      console.log(`\n${idx + 1}. ${item.media_type}`);
      console.log(`   ID: ${item.id}`);
      console.log(`   Cloudinary ID: ${item.cloudinary_public_id || '(null)'}`);
      console.log(`   URL: ${item.media_url?.substring(0, 60)}...`);
    });
  }

  console.log('\n');
}

checkPendingMedia();
