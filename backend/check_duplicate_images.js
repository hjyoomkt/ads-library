import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qpeflgaxnavvogsodjlq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWZsZ2F4bmF2dm9nc29kamxxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDAxMjU2MiwiZXhwIjoyMDg1NTg4NTYyfQ.WDcHUxdCRZ3LmtzXj5pZuQc6LZueMFfC7f8SiVUao4E'
);

async function checkDuplicateImages() {
  console.log('\n🔍 중복 이미지 분석...\n');

  // 1. 같은 original_url을 가진 미디어 찾기
  const { data: media, error } = await supabase
    .from('ad_media')
    .select('original_url, ad_id, cloudinary_public_id, media_type')
    .eq('media_type', 'image')
    .order('original_url');

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  // 2. original_url로 그룹화
  const urlMap = new Map();
  media.forEach(item => {
    if (!urlMap.has(item.original_url)) {
      urlMap.set(item.original_url, []);
    }
    urlMap.get(item.original_url).push(item);
  });

  // 3. 중복 찾기
  const duplicates = Array.from(urlMap.entries())
    .filter(([url, items]) => items.length > 1)
    .map(([url, items]) => ({
      url: url.substring(0, 80) + '...',
      count: items.length,
      ads: items.length,
      cloudinary_ids: new Set(items.map(i => i.cloudinary_public_id).filter(Boolean)).size
    }));

  console.log(`📊 총 이미지 수: ${media.length}`);
  console.log(`📊 고유 이미지 URL: ${urlMap.size}`);
  console.log(`📊 중복 이미지: ${duplicates.length}\n`);

  if (duplicates.length > 0) {
    console.log('🔍 중복 상위 10개:\n');
    duplicates.slice(0, 10).forEach((dup, idx) => {
      console.log(`${idx + 1}. ${dup.url}`);
      console.log(`   사용 광고 수: ${dup.ads}`);
      console.log(`   Cloudinary 업로드: ${dup.cloudinary_ids}번`);
      console.log('');
    });

    // 4. Cloudinary 중복 업로드 추정
    const totalDuplicates = duplicates.reduce((sum, dup) => sum + (dup.count - 1), 0);
    const cloudinaryDuplicates = duplicates.reduce((sum, dup) => sum + Math.max(0, dup.cloudinary_ids - 1), 0);

    console.log(`\n💰 비용 영향 추정:`);
    console.log(`   잠재적 중복: ${totalDuplicates}개`);
    console.log(`   Cloudinary 실제 중복: ${cloudinaryDuplicates}개`);

    if (cloudinaryDuplicates > 0) {
      console.log(`   ⚠️  Cloudinary에 ${cloudinaryDuplicates}개 이미지가 중복 저장되었을 수 있습니다`);
    } else {
      console.log(`   ✅ Cloudinary 중복 없음 (원본 URL 재사용 중)`);
    }
  } else {
    console.log('✅ 중복 이미지 없음\n');
  }
}

checkDuplicateImages().catch(console.error);
