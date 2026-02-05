import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qpeflgaxnavvogsodjlq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWZsZ2F4bmF2dm9nc29kamxxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDAxMjU2MiwiZXhwIjoyMDg1NTg4NTYyfQ.WDcHUxdCRZ3LmtzXj5pZuQc6LZueMFfC7f8SiVUao4E'
);

async function findDuplicates() {
  console.log('\n🔍 중복 ad_archive_id 찾기...\n');

  // 1. 모든 Meta 광고 조회 (ad_archive_id 컬럼은 아직 없음)
  const { data: ads, error } = await supabase
    .from('ad_archives')
    .select('id, advertiser_name, ad_creative_body, started_running_date, created_at, user_id, platform_specific_data')
    .eq('platform', 'meta')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  // 2. ad_archive_id로 그룹화
  const archiveIdMap = new Map();

  ads.forEach(ad => {
    const archiveId = ad.platform_specific_data?.ad_archive_id;
    if (!archiveId) return;

    const key = `${ad.user_id}-${archiveId}`;
    if (!archiveIdMap.has(key)) {
      archiveIdMap.set(key, []);
    }
    archiveIdMap.get(key).push(ad);
  });

  // 3. 중복 찾기
  const duplicates = Array.from(archiveIdMap.entries())
    .filter(([key, items]) => items.length > 1);

  console.log(`📊 총 광고: ${ads.length}개`);
  console.log(`📊 고유 ad_archive_id: ${archiveIdMap.size}개`);
  console.log(`📊 중복: ${duplicates.length}개\n`);

  if (duplicates.length > 0) {
    console.log('🔍 중복 상세:\n');

    duplicates.forEach(([key, items], idx) => {
      const [userId, archiveId] = key.split('-');
      console.log(`${idx + 1}. ad_archive_id: ${archiveId}`);
      console.log(`   중복 개수: ${items.length}개`);
      console.log(`   광고주: ${items[0].advertiser_name}`);
      console.log('');

      items.forEach((item, i) => {
        console.log(`   [${i + 1}] ID: ${item.id}`);
        console.log(`       생성: ${item.created_at}`);
        console.log(`       시작일: ${item.started_running_date}`);
        console.log(`       텍스트: ${item.ad_creative_body?.substring(0, 50)}...`);
      });
      console.log('');
    });

    // 4. 중복 정리 SQL 생성
    console.log('\n📝 중복 정리 SQL (최신 것만 유지):\n');
    console.log('-- 중복 광고 삭제 (최신 것만 유지)');
    console.log('WITH duplicates AS (');
    console.log('  SELECT');
    console.log('    id,');
    console.log('    ROW_NUMBER() OVER (');
    console.log('      PARTITION BY platform, (platform_specific_data->>\'ad_archive_id\'), user_id');
    console.log('      ORDER BY created_at DESC');
    console.log('    ) as rn');
    console.log('  FROM ad_archives');
    console.log('  WHERE platform = \'meta\'');
    console.log('    AND platform_specific_data->>\'ad_archive_id\' IS NOT NULL');
    console.log(')');
    console.log('DELETE FROM ad_archives');
    console.log('WHERE id IN (');
    console.log('  SELECT id FROM duplicates WHERE rn > 1');
    console.log(');\n');

    // 5. 삭제될 광고 목록
    const toDelete = [];
    duplicates.forEach(([key, items]) => {
      // created_at 기준 내림차순 정렬 (최신이 먼저)
      items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      // 첫 번째(최신)를 제외한 나머지
      toDelete.push(...items.slice(1));
    });

    console.log(`\n⚠️  ${toDelete.length}개 광고가 삭제됩니다:`);
    toDelete.forEach((ad, idx) => {
      console.log(`${idx + 1}. ${ad.advertiser_name} (ID: ${ad.id}, 생성: ${ad.created_at})`);
    });

  } else {
    console.log('✅ 중복 없음!\n');
  }
}

findDuplicates().catch(console.error);
