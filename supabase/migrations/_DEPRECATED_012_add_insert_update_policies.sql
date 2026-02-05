-- ========================================
-- INSERT/UPDATE/DELETE 정책 추가
-- 회원가입 및 데이터 수정을 위한 정책
-- ========================================

-- 1. organizations 테이블 정책
-- INSERT: 인증된 사용자는 조직 생성 가능 (회원가입 시)
CREATE POLICY "authenticated_insert_organizations"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: 같은 조직의 사용자만 수정 가능
CREATE POLICY "users_update_own_organization"
ON organizations FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT DISTINCT a.organization_id
    FROM advertisers a
    WHERE a.id IN (
      SELECT get_user_advertiser_ids_by_uid(auth.uid())
    )
  )
)
WITH CHECK (
  id IN (
    SELECT DISTINCT a.organization_id
    FROM advertisers a
    WHERE a.id IN (
      SELECT get_user_advertiser_ids_by_uid(auth.uid())
    )
  )
);

-- 2. advertisers 테이블 정책
-- INSERT: 인증된 사용자는 광고주 생성 가능 (회원가입 시)
CREATE POLICY "authenticated_insert_advertisers"
ON advertisers FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: 같은 광고주의 사용자만 수정 가능
CREATE POLICY "users_update_own_advertiser"
ON advertisers FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT get_user_advertiser_ids_by_uid(auth.uid())
  )
)
WITH CHECK (
  id IN (
    SELECT get_user_advertiser_ids_by_uid(auth.uid())
  )
);

-- 3. users 테이블 정책
-- INSERT: 자기 자신의 레코드만 생성 가능
CREATE POLICY "users_insert_own_record"
ON users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- UPDATE: 자기 자신의 레코드만 수정 가능
CREATE POLICY "users_update_own_record"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 4. user_advertisers 테이블 정책 (복수 브랜드 매핑)
-- INSERT: 인증된 사용자는 자신의 매핑 생성 가능
CREATE POLICY "users_insert_own_advertiser_mapping"
ON user_advertisers FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- SELECT: 자신의 매핑만 조회 가능
CREATE POLICY "users_select_own_advertiser_mapping"
ON user_advertisers FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- UPDATE: 자신의 매핑만 수정 가능
CREATE POLICY "users_update_own_advertiser_mapping"
ON user_advertisers FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: 자신의 매핑만 삭제 가능
CREATE POLICY "users_delete_own_advertiser_mapping"
ON user_advertisers FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 5. invitation_codes UPDATE 정책 (사용 처리)
-- UPDATE: 초대 코드 사용 처리를 위해 인증된 사용자가 수정 가능
CREATE POLICY "authenticated_update_invitation_codes"
ON invitation_codes FOR UPDATE
TO authenticated
USING (used_by IS NULL OR used_by = auth.uid())
WITH CHECK (used_by = auth.uid());

-- ========================================
-- 롤백
-- ========================================
-- DROP POLICY IF EXISTS "authenticated_insert_organizations" ON organizations;
-- DROP POLICY IF EXISTS "users_update_own_organization" ON organizations;
-- DROP POLICY IF EXISTS "authenticated_insert_advertisers" ON advertisers;
-- DROP POLICY IF EXISTS "users_update_own_advertiser" ON advertisers;
-- DROP POLICY IF EXISTS "users_insert_own_record" ON users;
-- DROP POLICY IF EXISTS "users_update_own_record" ON users;
-- DROP POLICY IF EXISTS "users_insert_own_advertiser_mapping" ON user_advertisers;
-- DROP POLICY IF EXISTS "users_select_own_advertiser_mapping" ON user_advertisers;
-- DROP POLICY IF EXISTS "users_update_own_advertiser_mapping" ON user_advertisers;
-- DROP POLICY IF EXISTS "users_delete_own_advertiser_mapping" ON user_advertisers;
-- DROP POLICY IF EXISTS "authenticated_update_invitation_codes" ON invitation_codes;
