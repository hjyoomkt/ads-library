import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🔄 Running migration: 004_add_cloudinary_ocr_fields.sql\n');

  const migrationPath = join(__dirname, '../supabase/migrations/004_add_cloudinary_ocr_fields.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  console.log('📋 SQL to execute:');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));

  console.log('\n⚠️  Supabase SDK cannot execute DDL statements directly.');
  console.log('Please run this SQL manually in Supabase Dashboard → SQL Editor');
  console.log('Or use Supabase CLI: supabase db push\n');

  // Try to verify if columns exist
  const { data, error } = await supabase
    .from('ad_media')
    .select('original_url, cloudinary_public_id, ocr_text')
    .limit(1);

  if (error) {
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('❌ Columns do not exist yet. Please run the migration in Supabase Dashboard.\n');
    } else {
      console.log('⚠️  Error checking columns:', error.message);
    }
  } else {
    console.log('✅ Columns already exist! Migration may have been run previously.\n');
  }
}

runMigration();
