import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qpeflgaxnavvogsodjlq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWZsZ2F4bmF2dm9nc29kamxxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDAxMjU2MiwiZXhwIjoyMDg1NTg4NTYyfQ.WDcHUxdCRZ3LmtzXj5pZuQc6LZueMFfC7f8SiVUao4E'
);

async function checkPlatformSpecificData() {
  console.log('\n🔍 기존 광고의 platform_specific_data 확인...\n');

  // 1. 모든 Meta 광고 조회
  const { data: ads, error } = await supabase
    .from('ad_archives')
    .select('id, advertiser_name, platform_specific_data, created_at')
    .eq('platform', 'meta')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`📊 총 ${ads.length}개 광고 샘플:\n`);

  let hasAdArchiveId = 0;
  let missingAdArchiveId = 0;

  ads.forEach((ad, idx) => {
    const adArchiveId = ad.platform_specific_data?.ad_archive_id;
    const hasIt = !!adArchiveId;

    console.log(`${idx + 1}. [${ad.advertiser_name}]`);
    console.log(`   생성: ${ad.created_at}`);
    console.log(`   ad_archive_id: ${hasIt ? adArchiveId : '❌ 없음'}`);
    console.log(`   platform_specific_data:`, JSON.stringify(ad.platform_specific_data).substring(0, 100) + '...');
    console.log('');

    if (hasIt) {
      hasAdArchiveId++;
    } else {
      missingAdArchiveId++;
    }
  });

  console.log('\n📊 요약:');
  console.log(`   ad_archive_id 있음: ${hasAdArchiveId}개`);
  console.log(`   ad_archive_id 없음: ${missingAdArchiveId}개`);

  if (missingAdArchiveId > 0) {
    console.log('\n⚠️  경고: 일부 광고에 ad_archive_id가 없습니다!');
    console.log('   마이그레이션 후에도 이 광고들은 ad_archive_id 컬럼이 NULL입니다.');
    console.log('   해결 방법:');
    console.log('   1. 재스크래핑하여 ad_archive_id 포함');
    console.log('   2. 또는 기존 광고 삭제 후 새로 수집');
  } else {
    console.log('\n✅ 모든 광고에 ad_archive_id가 있습니다!');
    console.log('   마이그레이션 안전하게 진행 가능합니다.');
  }

  // 2. 전체 통계
  const { data: stats } = await supabase
    .from('ad_archives')
    .select('id, platform_specific_data')
    .eq('platform', 'meta');

  if (stats) {
    const total = stats.length;
    const withId = stats.filter(ad => ad.platform_specific_data?.ad_archive_id).length;
    const withoutId = total - withId;

    console.log('\n📊 전체 통계:');
    console.log(`   총 광고: ${total}개`);
    console.log(`   ad_archive_id 있음: ${withId}개 (${(withId/total*100).toFixed(1)}%)`);
    console.log(`   ad_archive_id 없음: ${withoutId}개 (${(withoutId/total*100).toFixed(1)}%)`);
  }
}

checkPlatformSpecificData().catch(console.error);
