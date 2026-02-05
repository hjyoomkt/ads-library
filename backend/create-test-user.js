import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  console.log('🔍 Checking for existing users...\n');

  // Check if there's any user in auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Error fetching users:', authError);
  } else {
    console.log(`✅ Found ${authUsers.users.length} users in auth.users`);

    if (authUsers.users.length > 0) {
      const firstUser = authUsers.users[0];
      console.log(`\n📋 Using existing user:`);
      console.log(`   ID: ${firstUser.id}`);
      console.log(`   Email: ${firstUser.email || '(no email)'}`);
      console.log(`\n✅ Use this ID for testing: ${firstUser.id}`);
      return firstUser.id;
    }
  }

  // If no users exist, create a test user
  console.log('\n⚠️  No users found. Creating test user...');

  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: 'test@example.com',
    password: 'test123456',
    email_confirm: true
  });

  if (createError) {
    console.error('❌ Error creating user:', createError);

    // Alternative: insert directly into a users table if it exists
    console.log('\n⚠️  Trying alternative method...');
    const testUserId = '00000000-0000-0000-0000-000000000001';

    // Check if users table exists and insert
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: 'test@example.com'
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error inserting into users table:', userError);
      console.log('\n📋 Please create a user manually or use an existing user ID');
    } else {
      console.log('✅ Test user created in users table!');
      console.log(`   ID: ${userData.id}`);
      return userData.id;
    }
  } else {
    console.log('✅ Test user created!');
    console.log(`   ID: ${newUser.user.id}`);
    console.log(`   Email: ${newUser.user.email}`);
    return newUser.user.id;
  }
}

createTestUser();
