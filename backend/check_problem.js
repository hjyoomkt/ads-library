const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkData() {
  console.log('=== 최근 수집된 광고 확인 ===\n');

  // 최근 광고 10개 확인
  const { data: ads, error } = await supabase
    .from('ads')
    .select('id, search_query, media_url, media_type, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('최근 광고 10개:');
  ads.forEach((ad, i) => {
    console.log(`\n[${i+1}] ID: ${ad.id}`);
    console.log(`  검색어: ${ad.search_query}`);
    console.log(`  타입: ${ad.media_type}`);
    console.log(`  생성: ${ad.created_at}`);
    if (ad.media_url) {
      const isComplete = ad.media_url.match(/\.(jpg|jpeg|png|mp4|webm)$/) || ad.media_url.includes('scontent');
      console.log(`  URL 상태: ${isComplete ? '✓ 정상' : '✗ 불완전'}`);
      console.log(`  URL: ${ad.media_url.substring(0, 80)}...`);
    } else {
      console.log(`  URL 상태: ✗ NULL`);
    }
  });

  // 통계
  const { data: stats } = await supabase
    .from('ads')
    .select('media_url, media_type')
    .order('created_at', { ascending: false })
    .limit(100);

  const nullUrls = stats.filter(s => !s.media_url || s.media_url === '').length;
  const incompleteUrls = stats.filter(s =>
    s.media_url &&
    s.media_url.includes('cloudinary') &&
    !s.media_url.match(/\.(jpg|jpeg|png|mp4|webm)$/)
  ).length;
  const completeUrls = stats.filter(s =>
    s.media_url &&
    (s.media_url.match(/\.(jpg|jpeg|png|mp4|webm)$/) || s.media_url.includes('scontent'))
  ).length;

  console.log(`\n\n=== 최근 100개 광고 URL 상태 ===`);
  console.log(`✗ NULL/빈 URL: ${nullUrls}개`);
  console.log(`✗ 불완전한 Cloudinary URL: ${incompleteUrls}개 (업로드 실패)`);
  console.log(`✓ 정상 URL: ${completeUrls}개`);

  // 현재 문제 요약
  console.log(`\n\n=== 📋 현재 문제 요약 ===`);
  if (incompleteUrls > 0 || nullUrls > 0) {
    console.log(`❌ 문제 발생: ${incompleteUrls + nullUrls}개 광고의 이미지가 표시되지 않음`);
    console.log(`\n원인:`);
    console.log(`1. Meta 광고 이미지 URL은 1-2시간 후 만료됨`);
    console.log(`2. Cloudinary 업로드 시도 시 403 Forbidden 에러 발생`);
    console.log(`3. 업로드 실패 시 불완전한 URL이 DB에 저장됨`);
    console.log(`\n해결 필요: Playwright로 브라우저 내에서 이미지 다운로드 구현`);
  } else {
    console.log(`✓ 모든 광고 이미지가 정상적으로 표시됨`);
  }
}

checkData().catch(console.error);
