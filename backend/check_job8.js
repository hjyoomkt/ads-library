import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qpeflgaxnavvogsodjlq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWZsZ2F4bmF2dm9nc29kamxxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDAxMjU2MiwiZXhwIjoyMDg1NTg4NTYyfQ.WDcHUxdCRZ3LmtzXj5pZuQc6LZueMFfC7f8SiVUao4E'
);

async function checkJob8() {
  // 1. Job 8 정보 확인
  console.log('\n🔍 Checking Job 8...\n');
  const { data: job, error: jobError } = await supabase
    .from('scrape_jobs')
    .select('*')
    .eq('job_id', '8')
    .single();

  if (jobError) {
    console.error('❌ Error fetching job:', jobError.message);
    return;
  }

  console.log('📋 Job 8 정보:');
  console.log('   ID:', job.job_id);
  console.log('   상태:', job.status);
  console.log('   검색어:', job.search_query);
  console.log('   검색 타입:', job.search_type);
  console.log('   User ID:', job.user_id);
  console.log('   저장된 광고 수:', job.ads_saved);
  console.log('   생성 시간:', job.created_at);
  console.log('');

  // 2. 해당 검색어로 저장된 광고 확인
  console.log(`🔍 "${job.search_query}" 검색어로 저장된 광고 확인...\n`);
  const { data: ads, error: adsError } = await supabase
    .from('ad_archives')
    .select('id, advertiser_name, ad_creative_body, started_running_date, created_at')
    .eq('user_id', job.user_id)
    .eq('search_query', job.search_query)
    .order('created_at', { ascending: false })
    .limit(10);

  if (adsError) {
    console.error('❌ Error fetching ads:', adsError.message);
    return;
  }

  console.log(`📊 총 ${ads.length}개의 광고가 발견되었습니다:\n`);
  ads.forEach((ad, idx) => {
    console.log(`${idx + 1}. [ID: ${ad.id}]`);
    console.log(`   광고주: ${ad.advertiser_name}`);
    console.log(`   텍스트: ${ad.ad_creative_body?.substring(0, 50)}...`);
    console.log(`   시작일: ${ad.started_running_date}`);
    console.log(`   저장 시간: ${ad.created_at}`);
    console.log('');
  });

  // 3. 최근 생성된 광고 (Job 8 실행 시간 이후)
  if (job.created_at) {
    console.log(`\n🕐 Job 8 실행 이후 생성된 광고 확인 (${job.created_at} 이후)...\n`);
    const { data: recentAds, error: recentError } = await supabase
      .from('ad_archives')
      .select('id, advertiser_name, search_query, created_at')
      .eq('user_id', job.user_id)
      .gte('created_at', job.created_at)
      .order('created_at', { ascending: false });

    if (recentError) {
      console.error('❌ Error:', recentError.message);
    } else {
      console.log(`📊 ${recentAds.length}개의 광고가 Job 8 이후 생성됨:\n`);
      recentAds.forEach((ad, idx) => {
        console.log(`${idx + 1}. [ID: ${ad.id}] ${ad.advertiser_name} - "${ad.search_query}"`);
      });
    }
  }
}

checkJob8().catch(console.error);
