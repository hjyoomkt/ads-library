require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  console.log('=== 최근 검색 히스토리 확인 ===\n');

  const { data: history, error } = await supabase
    .from('user_search_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('오류:', error.message);
    return;
  }

  if (history.length === 0) {
    console.log('❌ 검색 히스토리 없음\n');
  } else {
    console.log(`총 ${history.length}개:\n`);
    history.forEach((item, idx) => {
      console.log(`${idx + 1}. [${item.search_type}] "${item.search_query}"`);
      console.log(`   advertiser_id: ${item.advertiser_id || 'NULL'}`);
      console.log(`   user_id: ${item.user_id || 'NULL'}`);
      console.log(`   created_at: ${item.created_at}\n`);
    });
  }

  console.log('=== RLS 활성화 여부 확인 ===\n');
  const { data: tableInfo, error: tableError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        schemaname,
        tablename,
        rowsecurity
      FROM pg_tables
      WHERE tablename = 'user_search_history'
    `
  }).catch(() => null);

  if (!tableError && tableInfo) {
    console.log('Table Info:', tableInfo);
  }
}

checkData().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
