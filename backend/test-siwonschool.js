import dotenv from 'dotenv';
import { scrapeMetaAds } from './src/scrapers/metaAdLibrary.js';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testScraper() {
  console.log('\n🔍 Testing scraper with "시원스쿨" keyword\n');
  console.log('─'.repeat(60));

  try {
    // 테스트용 userId (실제 존재하는 사용자)
    const testUserId = 'df757234-1cec-4ade-bbd4-5422477c2d21';

    const results = await scrapeMetaAds({
      searchType: 'keyword',
      searchQuery: '시원스쿨',
      maxAds: 500,  // 최대 500개까지 스크래핑
      country: 'KR',
      userId: testUserId,
      onProgress: (progress) => {
        console.log(`  Progress: ${progress.progress}/${progress.total}`);
      }
    });

    console.log('\n✅ Scraping completed!');
    console.log(`📊 Total ads collected: ${results.length}\n`);

    // 수집된 광고 중 첫 번째 광고 정보 출력
    if (results.length > 0) {
      const firstAd = results[0];
      console.log('📄 First Ad Sample:');
      console.log('─'.repeat(60));
      console.log('Advertiser:', firstAd.advertiserName);
      console.log('Ad Text:', firstAd.adText?.substring(0, 100) + '...');
      console.log('Link Title:', firstAd.linkTitle);
      console.log('Link URL:', firstAd.linkUrl);
      console.log('Start Date:', firstAd.startedRunningDate);
      console.log('Platforms:', firstAd.platforms);
      console.log('Is Active:', firstAd.isActive);
      console.log('Images:', firstAd.imageUrls?.length || 0, 'images');
      console.log('─'.repeat(60));
    }

    // Supabase에서 저장된 데이터 확인
    console.log('\n🔍 Checking saved data in Supabase...\n');

    const { data: savedAds, error } = await supabase
      .from('ad_archives')
      .select('id, advertiser_name, ad_creative_link_url, ad_creative_body, started_running_date')
      .eq('user_id', testUserId)
      .eq('search_query', '시원스쿨')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching from Supabase:', error);
    } else {
      console.log(`✅ Found ${savedAds.length} ads in Supabase`);

      savedAds.forEach((ad, idx) => {
        console.log(`\n${idx + 1}. ${ad.advertiser_name}`);
        console.log(`   Link URL: ${ad.ad_creative_link_url || '(none)'}`);
        console.log(`   Body: ${ad.ad_creative_body?.substring(0, 50)}...`);
        console.log(`   Date: ${ad.started_running_date}`);
      });

      // ad_creative_link_url 필드가 제대로 저장되었는지 확인
      const adsWithLinks = savedAds.filter(ad => ad.ad_creative_link_url);
      console.log(`\n📊 Ads with link URLs: ${adsWithLinks.length}/${savedAds.length}`);

      if (adsWithLinks.length > 0) {
        console.log('✅ Link URL field is working correctly!');
      } else {
        console.log('⚠️  No ads have link URLs - this might be normal if ads don\'t contain links');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  }

  console.log('\n─'.repeat(60));
  console.log('✅ Test completed!\n');
}

testScraper();
