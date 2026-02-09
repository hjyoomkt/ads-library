-- 1. 마스터 체크 함수
CREATE OR REPLACE FUNCTION is_master_user()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM users
  WHERE email = auth.email() AND deleted_at IS NULL;

  RETURN v_role = 'master';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 기존 정책 삭제
DROP POLICY IF EXISTS "users_select_accessible_users" ON users;

-- 3. 완전한 정책 (마스터 + 에이전시 + 브랜드 모두 지원)
CREATE POLICY "users_select_accessible_users"
ON users FOR SELECT
TO authenticated
USING (
  -- 1. 마스터: 모든 사용자
  is_master_user()

  -- 2. 같은 브랜드 사용자 (기존 로직)
  OR (advertiser_id IN (
    SELECT get_user_advertiser_ids_by_uid(auth.uid())
  ))

  -- 3. 에이전시 관리자: 같은 organization의 모든 사용자 (에이전시 직원 포함)
  OR (
    organization_id IN (
      SELECT DISTINCT a.organization_id
      FROM advertisers a
      WHERE a.id IN (SELECT get_user_advertiser_ids_by_uid(auth.uid()))
    )
  )

  -- 4. 자기 자신
  OR (id = auth.uid())
);

-- 확인
SELECT * FROM is_master_user();
