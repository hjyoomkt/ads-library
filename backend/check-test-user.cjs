require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser() {
  console.log('\n=== test@zestdot.com 사용자 확인 ===\n');

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'test@zestdot.com')
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('사용자 정보:');
  console.log(JSON.stringify(data, null, 2));

  console.log('\n=== advertiser_id 매칭 ===\n');

  if (data.advertiser_id) {
    const { data: advertiser } = await supabase
      .from('advertisers')
      .select('*')
      .eq('id', data.advertiser_id)
      .single();

    if (advertiser) {
      console.log(`advertiser_id: ${data.advertiser_id}`);
      console.log(`브랜드 이름: ${advertiser.name}`);
    }
  } else {
    console.log('advertiser_id가 NULL입니다');
  }

  console.log('\n=== DISABLE_AUTH 설정 확인 ===\n');
  console.log(`DISABLE_AUTH=${process.env.DISABLE_AUTH}`);
  console.log('백엔드 인증이', process.env.DISABLE_AUTH === 'true' ? '비활성화됨' : '활성화됨');
}

checkUser().then(() => process.exit(0));
