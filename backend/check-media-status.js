import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMediaStatus() {
  console.log('\n📊 Checking media upload status...\n');
  console.log('─'.repeat(60));

  // 전체 미디어 개수
  const { count: totalCount, error: totalError } = await supabase
    .from('ad_media')
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    console.error('❌ Error:', totalError);
    return;
  }

  // Cloudinary 업로드 완료된 미디어
  const { count: uploadedCount, error: uploadedError } = await supabase
    .from('ad_media')
    .select('*', { count: 'exact', head: true })
    .not('cloudinary_public_id', 'is', null);

  if (uploadedError) {
    console.error('❌ Error:', uploadedError);
    return;
  }

  // 미업로드 미디어
  const pendingCount = totalCount - uploadedCount;

  // 타입별 통계
  const { data: typeStats } = await supabase
    .from('ad_media')
    .select('media_type, cloudinary_public_id');

  const imageTotal = typeStats.filter(m => m.media_type === 'image').length;
  const videoTotal = typeStats.filter(m => m.media_type === 'video').length;
  const imageUploaded = typeStats.filter(m => m.media_type === 'image' && m.cloudinary_public_id).length;
  const videoUploaded = typeStats.filter(m => m.media_type === 'video' && m.cloudinary_public_id).length;

  console.log('📈 Overall Statistics:');
  console.log(`   Total media items: ${totalCount}`);
  console.log(`   ✅ Uploaded to Cloudinary: ${uploadedCount}`);
  console.log(`   ⏳ Pending upload: ${pendingCount}`);
  console.log(`   Upload rate: ${((uploadedCount / totalCount) * 100).toFixed(1)}%`);

  console.log('\n📊 By Media Type:');
  console.log(`   Images: ${imageUploaded}/${imageTotal} uploaded`);
  console.log(`   Videos: ${videoUploaded}/${videoTotal} uploaded`);

  console.log('\n─'.repeat(60));

  if (pendingCount > 0) {
    console.log(`⚠️  ${pendingCount} media items still need to be uploaded`);
    console.log('Run: node upload-media-to-cloudinary.js');
  } else {
    console.log('✅ All media items uploaded to Cloudinary!');
  }

  console.log('');
}

checkMediaStatus();
