-- ========================================
-- advertisers 테이블 RLS 활성화 및 정책 추가
-- ========================================
-- growth-dashboard와 동일하게 authenticated 사용자에게 모든 작업 허용
-- (서비스 레이어에서 권한 체크)

-- 0. RLS 활성화
ALTER TABLE advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;

-- 1. organizations 정책
CREATE POLICY "authenticated_users_insert_organizations"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_users_update_organizations"
ON organizations FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_users_delete_organizations"
ON organizations FOR DELETE
TO authenticated
USING (true);

-- 2. advertisers 정책
CREATE POLICY "authenticated_users_insert_advertisers"
ON advertisers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_users_update_advertisers"
ON advertisers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_users_delete_advertisers"
ON advertisers FOR DELETE
TO authenticated
USING (true);

-- 3. users 정책
CREATE POLICY "authenticated_users_insert_users"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_users_update_users"
ON users FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_users_delete_users"
ON users FOR DELETE
TO authenticated
USING (true);

-- 4. invitation_codes 정책
CREATE POLICY "authenticated_users_update_invitation_codes"
ON invitation_codes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_users_delete_invitation_codes"
ON invitation_codes FOR DELETE
TO authenticated
USING (true);

-- ========================================
-- 롤백
-- ========================================
-- DROP POLICY IF EXISTS "authenticated_users_insert_organizations" ON organizations;
-- DROP POLICY IF EXISTS "authenticated_users_update_organizations" ON organizations;
-- DROP POLICY IF EXISTS "authenticated_users_delete_organizations" ON organizations;
-- DROP POLICY IF EXISTS "authenticated_users_insert_advertisers" ON advertisers;
-- DROP POLICY IF EXISTS "authenticated_users_update_advertisers" ON advertisers;
-- DROP POLICY IF EXISTS "authenticated_users_delete_advertisers" ON advertisers;
-- DROP POLICY IF EXISTS "authenticated_users_insert_users" ON users;
-- DROP POLICY IF EXISTS "authenticated_users_update_users" ON users;
-- DROP POLICY IF EXISTS "authenticated_users_delete_users" ON users;
-- DROP POLICY IF EXISTS "authenticated_users_update_invitation_codes" ON invitation_codes;
-- DROP POLICY IF EXISTS "authenticated_users_delete_invitation_codes" ON invitation_codes;
