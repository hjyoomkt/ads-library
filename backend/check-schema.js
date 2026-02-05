import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking ad_archives table schema...\n');

  // ad_archives 테이블에서 샘플 데이터 조회 (컬럼 확인용)
  const { data, error } = await supabase
    .from('ad_archives')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error);
  } else {
    if (data.length > 0) {
      console.log('✅ Table columns:');
      Object.keys(data[0]).forEach(col => {
        console.log(`   - ${col}: ${typeof data[0][col]}`);
      });
    } else {
      console.log('⚠️  Table is empty, inserting test data to check schema...');
    }
  }

  // ad_creative_link_url 컬럼이 있는지 확인
  const { data: testData, error: testError } = await supabase
    .from('ad_archives')
    .select('ad_creative_link_url')
    .limit(1);

  if (testError) {
    console.error('\n❌ ad_creative_link_url column does NOT exist!');
    console.error('Error:', testError.message);
    console.log('\n📋 Please run this SQL in Supabase Dashboard:\n');
    console.log('ALTER TABLE ad_archives ADD COLUMN ad_creative_link_url TEXT;');
    console.log('CREATE INDEX idx_ad_archives_link_url ON ad_archives(ad_creative_link_url);');
  } else {
    console.log('\n✅ ad_creative_link_url column exists!');
  }
}

checkSchema();
