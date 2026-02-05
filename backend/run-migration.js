import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🔄 Running migration: 003_add_link_url.sql\n');

  const sql = readFileSync('../supabase/migrations/003_add_link_url.sql', 'utf-8');

  try {
    // Supabase에서 raw SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Migration failed:', error);

      // RPC 함수가 없는 경우 직접 실행
      console.log('\n⚠️  Trying direct SQL execution...\n');

      // ALTER TABLE은 직접 실행할 수 없으므로 Supabase Dashboard에서 실행 필요
      console.log('Please run this SQL in Supabase Dashboard → SQL Editor:\n');
      console.log('─'.repeat(60));
      console.log(sql);
      console.log('─'.repeat(60));
    } else {
      console.log('✅ Migration completed successfully!');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📋 Please run this SQL manually in Supabase Dashboard:\n');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
  }
}

runMigration();
