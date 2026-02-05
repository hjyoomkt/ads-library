-- ========================================
-- RLS 정책 보안 강화
-- 문제: 현재 누구나 organizations 접근 가능
-- 해결: 인증된 사용자 + 자신의 조직만 접근
-- ========================================

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "allow_insert_for_all_authenticated_users" ON organizations;
DROP POLICY IF EXISTS "allow_select_own_org" ON organizations;
DROP POLICY IF EXISTS "allow_update_own_org" ON organizations;


-- 2. 보안 강화된 정책 생성

-- INSERT 정책: 인증된 사용자만 조직 생성 가능
CREATE POLICY "organizations_insert_policy"
ON organizations FOR INSERT
WITH CHECK (
  -- auth.uid()가 NULL이 아님 = 인증된 사용자
  auth.uid() IS NOT NULL
);

-- SELECT 정책: 자신이 속한 조직만 조회 가능
CREATE POLICY "organizations_select_policy"
ON organizations FOR SELECT
USING (
  -- 1. 자신의 organization_id와 일치
  id IN (
    SELECT organization_id
    FROM users
    WHERE id = auth.uid()
  )
  OR
  -- 2. 또는 master 권한 (모든 조직 조회 가능)
  EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role = 'master'
  )
);

-- UPDATE 정책: 자신이 속한 조직만 수정 가능
CREATE POLICY "organizations_update_policy"
ON organizations FOR UPDATE
USING (
  id IN (
    SELECT organization_id
    FROM users
    WHERE id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role = 'master'
  )
)
WITH CHECK (
  id IN (
    SELECT organization_id
    FROM users
    WHERE id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role = 'master'
  )
);

-- DELETE 정책: master만 삭제 가능
CREATE POLICY "organizations_delete_policy"
ON organizations FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role = 'master'
  )
);


-- 3. PostgREST 캐시 갱신
NOTIFY pgrst, 'reload schema';


-- 4. 최종 확인
SELECT
    policyname,
    cmd,
    roles::text[] as policy_roles,
    qual::text as using_condition,
    with_check::text as with_check_condition
FROM pg_policies
WHERE tablename = 'organizations'
ORDER BY cmd, policyname;


-- ========================================
-- 완료 메시지
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RLS 정책 보안 강화 완료';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 INSERT: 인증된 사용자만';
    RAISE NOTICE '🔒 SELECT: 자신의 조직 + master';
    RAISE NOTICE '🔒 UPDATE: 자신의 조직 + master';
    RAISE NOTICE '🔒 DELETE: master만';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  주의: 회원가입 시 타이밍 이슈 발생 가능';
    RAISE NOTICE '   문제 발생 시 다시 WITH CHECK (true)로 복원';
    RAISE NOTICE '========================================';
END $$;
