import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qpeflgaxnavvogsodjlq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWZsZ2F4bmF2dm9nc29kamxxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDAxMjU2MiwiZXhwIjoyMDg1NTg4NTYyfQ.WDcHUxdCRZ3LmtzXj5pZuQc6LZueMFfC7f8SiVUao4E'
);

async function checkConstraints() {
  console.log('\n🔍 ad_archives 테이블 제약 조건 확인...\n');

  // 테스트 upsert 시도
  const testAd = {
    user_id: 'df757234-1cec-4ade-bbd4-5422477c2d21',
    platform: 'meta',
    search_type: 'keyword',
    search_query: '테스트',
    ad_archive_id: 'TEST123456789',
    advertiser_name: '테스트 광고주',
    ad_creative_body: '테스트 광고 텍스트',
    started_running_date: '2025-01-01',
    platform_specific_data: {
      ad_archive_id: 'TEST123456789',
      is_active: true
    }
  };

  console.log('📝 테스트 upsert 시도...\n');

  // 1. 일반 insert 테스트
  const { data: insertData, error: insertError } = await supabase
    .from('ad_archives')
    .insert(testAd)
    .select()
    .single();

  if (insertError) {
    console.log('❌ Insert 에러:', insertError.message);
    console.log('   Code:', insertError.code);
    console.log('   Details:', insertError.details);
    console.log('   Hint:', insertError.hint);
  } else {
    console.log('✅ Insert 성공:', insertData.id);

    // 2. 같은 데이터로 upsert 테스트
    console.log('\n📝 같은 데이터로 upsert 테스트...\n');

    const { data: upsertData, error: upsertError } = await supabase
      .from('ad_archives')
      .upsert(testAd, {
        onConflict: 'platform,ad_archive_id,user_id'
      })
      .select()
      .single();

    if (upsertError) {
      console.log('❌ Upsert 에러:', upsertError.message);
      console.log('   Code:', upsertError.code);
      console.log('   Details:', upsertError.details);
      console.log('   Hint:', upsertError.hint);
    } else {
      console.log('✅ Upsert 성공:', upsertData.id);
    }

    // 3. 정리
    console.log('\n🧹 테스트 데이터 삭제...\n');
    const { error: deleteError } = await supabase
      .from('ad_archives')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.log('❌ Delete 에러:', deleteError.message);
    } else {
      console.log('✅ 테스트 데이터 삭제 완료');
    }
  }
}

checkConstraints().catch(console.error);
