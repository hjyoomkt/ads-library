-- ========================================
-- 새로운 RLS 정책 생성
-- 중요: ad_archives는 서버 귀속이므로 RLS 불필요
-- ========================================

-- 중요: ad_archives와 ad_media는 RLS 없음 (모든 인증 사용자 조회 가능)
CREATE POLICY "authenticated_select_all_archives"
ON ad_archives FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_select_all_media"
ON ad_media FOR SELECT
TO authenticated
USING (true);

-- 1. user_search_history 정책 (브랜드별 모니터링 목록)
CREATE POLICY "users_manage_own_brand_history"
ON user_search_history FOR ALL
TO authenticated
USING (
  advertiser_id IN (
    SELECT get_user_advertiser_ids_by_uid(auth.uid())
  )
)
WITH CHECK (
  advertiser_id IN (
    SELECT get_user_advertiser_ids_by_uid(auth.uid())
  )
);

-- 2. scrape_jobs는 RLS 불필요 (프론트엔드에서 전체 목록 조회 안 함, JobTracker만 특정 jobId 추적)
-- 백엔드 API에서 advertiser_id 필터링 처리

-- 3. invitation_codes 정책
CREATE POLICY "anon_select_valid_invitations"
ON invitation_codes FOR SELECT
TO anon
USING (
  used_by IS NULL
  AND expires_at > NOW()
);

CREATE POLICY "users_manage_own_invitations"
ON invitation_codes FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- 4. users, organizations, advertisers 정책
CREATE POLICY "users_select_accessible_users"
ON users FOR SELECT
TO authenticated
USING (
  -- 같은 브랜드 사용자 또는 자기 자신
  advertiser_id IN (
    SELECT get_user_advertiser_ids_by_uid(auth.uid())
  )
  OR id = (SELECT id FROM users WHERE email = auth.email())
);

CREATE POLICY "users_select_accessible_advertisers"
ON advertisers FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT get_user_advertiser_ids_by_uid(auth.uid())
  )
);

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

-- user_advertisers 테이블 없음 (1명=1브랜드 단순화)

-- ========================================
-- 롤백
-- ========================================
-- DROP POLICY IF EXISTS "authenticated_select_all_archives" ON ad_archives;
-- DROP POLICY IF EXISTS "authenticated_select_all_media" ON ad_media;
-- DROP POLICY IF EXISTS "users_manage_own_brand_history" ON user_search_history;
-- DROP POLICY IF EXISTS "anon_select_valid_invitations" ON invitation_codes;
-- DROP POLICY IF EXISTS "users_manage_own_invitations" ON invitation_codes;
-- DROP POLICY IF EXISTS "users_select_accessible_users" ON users;
-- DROP POLICY IF EXISTS "users_select_accessible_advertisers" ON advertisers;
-- DROP POLICY IF EXISTS "users_select_accessible_organizations" ON organizations;
