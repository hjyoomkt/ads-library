import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyMigration() {
  console.log('🔄 Applying migration: 004_add_cloudinary_ocr_fields.sql\n');

  // Supabase URL에서 connection string 생성
  const supabaseUrl = process.env.SUPABASE_URL;
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

  // Supabase 데이터베이스 연결 (포트 5432 사용)
  const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`;

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database\n');

    const migrationPath = join(__dirname, '../supabase/migrations/004_add_cloudinary_ocr_fields.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📋 Executing SQL...\n');
    await client.query(sql);

    console.log('✅ Migration applied successfully!\n');

    // 확인
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'ad_media'
      AND column_name IN ('original_url', 'cloudinary_public_id', 'ocr_text', 'ocr_confidence', 'metadata')
      ORDER BY column_name;
    `);

    console.log('📋 New columns added:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);

    // Connection string 오류인 경우
    if (error.message.includes('connect')) {
      console.log('\n⚠️  Direct database connection failed.');
      console.log('Please run the SQL manually in Supabase Dashboard → SQL Editor:\n');

      const migrationPath = join(__dirname, '../supabase/migrations/004_add_cloudinary_ocr_fields.sql');
      const sql = readFileSync(migrationPath, 'utf-8');

      console.log('─'.repeat(60));
      console.log(sql);
      console.log('─'.repeat(60));
    }
  } finally {
    await client.end();
  }
}

applyMigration();
