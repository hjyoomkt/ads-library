-- ========================================
-- DELETE 정책 추가
-- ========================================
-- 브랜드/조직/사용자 삭제 기능을 위한 DELETE 정책 추가
-- (INSERT/UPDATE 정책은 이미 존재함)

-- 1. organizations DELETE 정책
CREATE POLICY "authenticated_users_delete_organizations"
ON organizations FOR DELETE
TO authenticated
USING (true);

-- 2. advertisers DELETE 정책
CREATE POLICY "authenticated_users_delete_advertisers"
ON advertisers FOR DELETE
TO authenticated
USING (true);

-- 3. users DELETE 정책
CREATE POLICY "authenticated_users_delete_users"
ON users FOR DELETE
TO authenticated
USING (true);

-- 4. invitation_codes DELETE 정책 (users_manage_own_invitations ALL 정책에 포함되어 있지만 명시적 추가)
CREATE POLICY "authenticated_users_delete_invitation_codes"
ON invitation_codes FOR DELETE
TO authenticated
USING (true);

-- ========================================
-- 롤백
-- ========================================
-- DROP POLICY IF EXISTS "authenticated_users_delete_organizations" ON organizations;
-- DROP POLICY IF EXISTS "authenticated_users_delete_advertisers" ON advertisers;
-- DROP POLICY IF EXISTS "authenticated_users_delete_users" ON users;
-- DROP POLICY IF EXISTS "authenticated_users_delete_invitation_codes" ON invitation_codes;
