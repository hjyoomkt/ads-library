import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qpeflgaxnavvogsodjlq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWZsZ2F4bmF2dm9nc29kamxxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDAxMjU2MiwiZXhwIjoyMDg1NTg4NTYyfQ.WDcHUxdCRZ3LmtzXj5pZuQc6LZueMFfC7f8SiVUao4E'
);

async function checkEmptyText() {
  console.log('\n🔍 ad_archive_id: 1200582498700094 확인...\n');

  // 1. 해당 광고 조회
  const { data: ad, error } = await supabase
    .from('ad_archives')
    .select('*')
    .eq('platform_specific_data->>ad_archive_id', '1200582498700094')
    .single();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log('📋 광고 정보:');
  console.log('   ID:', ad.id);
  console.log('   광고주:', ad.advertiser_name);
  console.log('   ad_creative_body:', `"${ad.ad_creative_body}"`);
  console.log('   ad_creative_link_title:', ad.ad_creative_link_title);
  console.log('   ad_creative_link_description:', ad.ad_creative_link_description);
  console.log('   ad_creative_link_url:', ad.ad_creative_link_url);
  console.log('');

  console.log('📦 platform_specific_data:\n');
  console.log(JSON.stringify(ad.platform_specific_data, null, 2));
  console.log('');

  // 2. 텍스트 추출 로직 재현
  const snapshot = ad.platform_specific_data;

  console.log('🔍 텍스트 추출 분석:\n');

  // 방법 1: cards[0].body
  const cards = snapshot?.cards;
  console.log('1. snapshot.cards:', cards ? `있음 (${cards.length}개)` : '없음');
  if (cards && cards.length > 0) {
    console.log('   cards[0].body:', `"${cards[0].body || ''}"`);
    console.log('   cards[0].title:', `"${cards[0].title || ''}"`);
    console.log('   cards[0].link_description:', `"${cards[0].link_description || ''}"`);
  }

  // 방법 2: body.text
  const body = snapshot?.body;
  console.log('\n2. snapshot.body:', body ? '있음' : '없음');
  if (body) {
    console.log('   body.text:', `"${body.text || ''}"`);
  }

  // 방법 3: title
  console.log('\n3. snapshot.title:', `"${snapshot?.title || ''}"`);

  // 방법 4: caption
  console.log('\n4. snapshot.caption:', `"${snapshot?.caption || ''}"`);

  console.log('\n💡 결론:');
  let adText = '';
  if (snapshot?.cards?.[0]?.body) {
    adText = snapshot.cards[0].body;
    console.log('   텍스트 출처: cards[0].body');
  } else if (snapshot?.body?.text) {
    adText = snapshot.body.text;
    console.log('   텍스트 출처: snapshot.body.text');
  } else if (snapshot?.title) {
    adText = snapshot.title;
    console.log('   텍스트 출처: snapshot.title (fallback)');
  } else {
    console.log('   ⚠️  텍스트를 찾을 수 없음!');
  }

  console.log(`   최종 ad_creative_body: "${adText}"\n`);

  // 3. 미디어 확인
  const { data: media } = await supabase
    .from('ad_media')
    .select('*')
    .eq('ad_id', ad.id);

  if (media && media.length > 0) {
    console.log(`📸 미디어: ${media.length}개`);
    media.forEach((m, idx) => {
      console.log(`   ${idx + 1}. ${m.media_type}: ${m.media_url.substring(0, 80)}...`);
    });
  }
}

checkEmptyText().catch(console.error);
