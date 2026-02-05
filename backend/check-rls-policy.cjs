require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkRLS() {
  console.log('\n=== RLS 활성화 여부 ===\n');

  // user_search_history에 직접 쿼리
  const { data: testData, error: testError } = await supabase
    .from('user_search_history')
    .select('*')
    .limit(1);

  console.log('테스트 쿼리 결과:', testError ? `에러: ${testError.message}` : '성공');

  // 테이블의 RLS 활성화 여부 확인 (pg_class)
  console.log('\n=== 테이블 RLS 설정 ===\n');

  const query = `
    SELECT
      c.relname as table_name,
      c.relrowsecurity as rls_enabled,
      c.relforcerowsecurity as rls_forced
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'user_search_history';
  `;

  // 직접 SQL 실행이 안 되면 다른 방법 시도
  try {
    // Supabase REST API로 직접 조회 시도
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('RLS 설정:', result);
    } else {
      console.log('SQL 실행 불가 - 스키마 파일 확인 필요');
    }
  } catch (e) {
    console.log('REST API 호출 실패');
  }

  // advertiser 목록 확인
  console.log('\n=== advertisers 테이블 확인 ===\n');

  const { data: advertisers, error: advError } = await supabase
    .from('advertisers')
    .select('id, name')
    .limit(10);

  if (!advError && advertisers) {
    console.log('브랜드 목록:');
    advertisers.forEach(adv => {
      console.log(`  ${adv.id}: ${adv.name}`);
    });
  }

  // 검색 히스토리의 advertiser_id와 매칭
  console.log('\n=== 검색 히스토리와 브랜드 매칭 ===\n');

  const { data: searches } = await supabase
    .from('user_search_history')
    .select('search_query, advertiser_id')
    .limit(5);

  if (searches && advertisers) {
    searches.forEach(search => {
      const adv = advertisers.find(a => a.id === search.advertiser_id);
      console.log(`"${search.search_query}" -> ${adv ? adv.name : search.advertiser_id}`);
    });
  }
}

checkRLS().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
