import { scrapeMetaAds } from './src/scrapers/metaAdLibrary.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_USER_ID = 'df757234-1cec-4ade-bbd4-5422477c2d21';

async function testDuplicatePrevention() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   중복 방지 테스트 (기존 데이터 유지)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. 현재 데이터 확인
  console.log('📊 현재 데이터 상태:\n');

  const { data: currentAds, count: adCount } = await supabase
    .from('ad_archives')
    .select('*', { count: 'exact' })
    .eq('user_id', TEST_USER_ID)
    .eq('search_query', '시원스쿨');

  const { data: currentMedia, count: mediaCount } = await supabase
    .from('ad_media')
    .select('*', { count: 'exact' });

  console.log(`   광고: ${adCount}개`);
  console.log(`   미디어: ${mediaCount}개`);

  // 중복 확인
  const { data: duplicates } = await supabase.rpc('get_duplicate_media_count', {}, { count: 'exact' });

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // 2. 다시 스크래핑
  console.log('🚀 같은 키워드로 다시 스크래핑 시작...\n');

  const onProgress = (progress) => {
    process.stdout.write(`\r📊 진행률: ${Math.floor(progress)}%`);
  };

  const result = await scrapeMetaAds({
    searchType: 'keyword',
    searchQuery: '시원스쿨',
    maxAds: 100,
    country: 'KR',
    userId: TEST_USER_ID,
    onProgress,
    uploadToCloudinary: true,
    headless: true
  });

  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 3. 결과 확인
  const { data: afterAds, count: afterAdCount } = await supabase
    .from('ad_archives')
    .select('*', { count: 'exact' })
    .eq('user_id', TEST_USER_ID)
    .eq('search_query', '시원스쿨');

  const { data: afterMedia, count: afterMediaCount } = await supabase
    .from('ad_media')
    .select('*', { count: 'exact' });

  console.log('📊 스크래핑 후 데이터 상태:\n');
  console.log(`   광고: ${afterAdCount}개 (이전: ${adCount}개, 변화: ${afterAdCount - adCount > 0 ? '+' : ''}${afterAdCount - adCount})`);
  console.log(`   미디어: ${afterMediaCount}개 (이전: ${mediaCount}개, 변화: ${afterMediaCount - mediaCount > 0 ? '+' : ''}${afterMediaCount - mediaCount})`);
  console.log(`   수집된 광고: ${result.totalCollected}개`);
  console.log(`   Supabase 저장: ${result.savedAds}개`);

  // 중복 확인
  const { data: duplicatesAfter } = await supabase
    .from('ad_media')
    .select('original_url')
    .not('original_url', 'is', null);

  const urlMap = new Map();
  duplicatesAfter.forEach(item => {
    const count = urlMap.get(item.original_url) || 0;
    urlMap.set(item.original_url, count + 1);
  });

  const duplicateCount = Array.from(urlMap.values()).filter(count => count > 1).length;

  console.log(`\n🔍 중복 체크:`);
  console.log(`   중복된 URL: ${duplicateCount}개`);

  if (duplicateCount === 0) {
    console.log(`   ✅ 중복 방지 성공!`);
  } else {
    console.log(`   ❌ 중복 발생!`);
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

testDuplicatePrevention().catch(console.error);
