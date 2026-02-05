-- ========================================
-- 완전한 RLS 재설정
-- ========================================

-- 1. 기존 정책 모두 삭제
DROP POLICY IF EXISTS "users_select_accessible_users" ON users;
DROP POLICY IF EXISTS "users_select_accessible_advertisers" ON advertisers;
DROP POLICY IF EXISTS "users_select_accessible_organizations" ON organizations;
DROP POLICY IF EXISTS "users_manage_own_brand_history" ON user_search_history;
DROP POLICY IF EXISTS "authenticated_select_all_archives" ON ad_archives;
DROP POLICY IF EXISTS "authenticated_select_all_media" ON ad_media;
DROP POLICY IF EXISTS "anon_select_valid_invitations" ON invitation_codes;
DROP POLICY IF EXISTS "users_manage_own_invitations" ON invitation_codes;

-- 2. RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;

-- 3. 새 정책 생성

-- users 테이블 정책 (무한 재귀 수정)
CREATE POLICY "users_select_accessible_users"
ON users FOR SELECT
TO authenticated
USING (
  users.advertiser_id IN (
    SELECT get_user_advertiser_ids_by_uid(auth.uid())
  )
  OR users.id = auth.uid()  -- ✅ 수정: 직접 비교, 서브쿼리 제거
);

-- advertisers 테이블 정책
CREATE POLICY "users_select_accessible_advertisers"
ON advertisers FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT get_user_advertiser_ids_by_uid(auth.uid())
  )
);

-- organizations 테이블 정책
CREATE POLICY "users_select_accessible_organizations"
ON organizations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT DISTINCT a.organization_id
    FROM advertisers a
    WHERE a.id IN (
      SELECT get_user_advertiser_ids_by_uid(auth.uid())
    )
  )
);

-- user_search_history 테이블 정책
CREATE POLICY "users_manage_own_brand_history"
ON user_search_history FOR ALL
TO authenticated
USING (
  user_search_history.advertiser_id IN (
    SELECT get_user_advertiser_ids_by_uid(auth.uid())
  )
)
WITH CHECK (
  user_search_history.advertiser_id IN (
    SELECT get_user_advertiser_ids_by_uid(auth.uid())
  )
);

-- ad_archives 테이블 정책 (모든 인증 사용자 조회 가능)
CREATE POLICY "authenticated_select_all_archives"
ON ad_archives FOR SELECT
TO authenticated
USING (true);

-- ad_media 테이블 정책 (모든 인증 사용자 조회 가능)
CREATE POLICY "authenticated_select_all_media"
ON ad_media FOR SELECT
TO authenticated
USING (true);

-- invitation_codes 테이블 정책 (익명 사용자)
CREATE POLICY "anon_select_valid_invitations"
ON invitation_codes FOR SELECT
TO anon
USING (
  used_by IS NULL
  AND expires_at > NOW()
);

-- invitation_codes 테이블 정책 (인증 사용자)
CREATE POLICY "users_manage_own_invitations"
ON invitation_codes FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- 4. 확인
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN ('users', 'advertisers', 'organizations', 'user_search_history', 'ad_archives', 'ad_media', 'invitation_codes')
ORDER BY tablename, policyname;
