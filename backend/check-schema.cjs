require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('\n=== user_search_history 테이블 스키마 ===\n');

  const { data, error } = await supabase
    .from('user_search_history')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('컬럼 목록:');
    Object.keys(data[0]).forEach(col => {
      console.log(`  - ${col}: ${typeof data[0][col]} (값: ${data[0][col]})`);
    });
  }

  // RLS 정책 확인
  console.log('\n=== RLS 정책 확인 ===\n');

  const { data: policies, error: policyError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'user_search_history';
    `
  }).catch(() => {
    // exec_sql 함수가 없으면 직접 쿼리
    return supabase.from('pg_policies').select('*').eq('tablename', 'user_search_history');
  });

  if (!policyError && policies) {
    console.log('정책:', JSON.stringify(policies, null, 2));
  } else {
    console.log('정책 조회 실패 - 대체 방법 시도');
  }

  // 테이블 정보 조회
  console.log('\n=== 테이블 정보 조회 (information_schema) ===\n');

  const { data: columns, error: colError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_search_history'
      ORDER BY ordinal_position;
    `
  }).catch(async () => {
    // fallback - 직접 pg_catalog 조회는 권한 문제로 안 될 수 있음
    return { data: null, error: 'exec_sql not available' };
  });

  if (!colError && columns) {
    console.log('컬럼 상세:');
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
  }
}

checkSchema().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
