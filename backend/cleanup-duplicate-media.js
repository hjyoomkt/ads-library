import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * 중복 미디어 정리 스크립트
 *
 * 1. 같은 original_url을 가진 레코드 중 가장 최근 것만 남김
 * 2. 나머지는 삭제
 * 3. 삭제된 레코드의 cloudinary_public_id도 Cloudinary에서 삭제
 */
async function cleanupDuplicateMedia() {
  console.log('🔍 중복 미디어 검색 중...\n');

  // 1. 중복된 original_url 찾기
  const { data: duplicates, error } = await supabase
    .from('ad_media')
    .select('original_url')
    .not('original_url', 'is', null);

  if (error) {
    console.error('❌ Error fetching media:', error);
    return;
  }

  // original_url별로 그룹화
  const urlMap = new Map();
  duplicates.forEach(item => {
    const count = urlMap.get(item.original_url) || 0;
    urlMap.set(item.original_url, count + 1);
  });

  // 2개 이상인 것만 필터링
  const duplicateUrls = Array.from(urlMap.entries())
    .filter(([url, count]) => count > 1)
    .map(([url]) => url);

  console.log(`📊 중복 URL 개수: ${duplicateUrls.length}\n`);

  if (duplicateUrls.length === 0) {
    console.log('✅ 중복 없음!');
    return;
  }

  let totalDeleted = 0;
  let totalCloudinaryDeleted = 0;

  // 2. 각 중복 URL에 대해 처리
  for (const url of duplicateUrls) {
    const { data: records } = await supabase
      .from('ad_media')
      .select('*')
      .eq('original_url', url)
      .order('created_at', { ascending: false }); // 최신순

    if (records && records.length > 1) {
      const toKeep = records[0]; // 가장 최근 레코드 유지
      const toDelete = records.slice(1); // 나머지 삭제

      console.log(`\n📌 URL: ${url.substring(0, 80)}...`);
      console.log(`   총 ${records.length}개 → 1개 유지, ${toDelete.length}개 삭제`);

      // DB에서 삭제
      for (const record of toDelete) {
        const { error: deleteError } = await supabase
          .from('ad_media')
          .delete()
          .eq('id', record.id);

        if (deleteError) {
          console.log(`   ❌ DB 삭제 실패 (${record.id}):`, deleteError.message);
        } else {
          totalDeleted++;
          console.log(`   ✅ DB 삭제: ${record.id}`);

          // Cloudinary에서도 삭제 (있는 경우만)
          if (record.cloudinary_public_id) {
            try {
              const resourceType = record.media_type === 'video' ? 'video' : 'image';
              await cloudinary.uploader.destroy(record.cloudinary_public_id, {
                resource_type: resourceType
              });
              totalCloudinaryDeleted++;
              console.log(`   ☁️  Cloudinary 삭제: ${record.cloudinary_public_id}`);
            } catch (cloudinaryError) {
              console.log(`   ⚠️  Cloudinary 삭제 실패: ${cloudinaryError.message}`);
            }
          }
        }
      }
    }
  }

  console.log(`\n✅ 정리 완료!`);
  console.log(`   DB 삭제: ${totalDeleted}개`);
  console.log(`   Cloudinary 삭제: ${totalCloudinaryDeleted}개`);
}

// 실행
cleanupDuplicateMedia().catch(console.error);
