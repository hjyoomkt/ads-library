-- ========================================
-- 최종 RLS 정책 확인 및 강제 적용
-- ========================================

-- 1. 현재 정책 상태 확인
SELECT
    tablename,
    policyname,
    cmd,
    roles::text[] as policy_roles,
    permissive,
    with_check::text as with_check_condition
FROM pg_policies
WHERE tablename = 'organizations'
ORDER BY cmd, policyname;

-- 예상: authenticated 역할로 설정되어 있어야 함
-- 만약 여전히 public으로 나온다면 → 정책이 실제로 적용되지 않음


-- 2. RLS 활성화 상태 재확인
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'organizations';


-- 3. 정책을 완전히 삭제하고 다시 생성 (강제 적용)
DROP POLICY IF EXISTS "allow_insert_for_all_authenticated_users" ON organizations;
DROP POLICY IF EXISTS "allow_select_own_org" ON organizations;
DROP POLICY IF EXISTS "allow_update_own_org" ON organizations;

-- 잠시 대기 (정책 삭제 완료 확인)
SELECT pg_sleep(1);

-- 새로운 정책 생성
CREATE POLICY "allow_insert_for_all_authenticated_users"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_select_own_org"
ON organizations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id
    FROM users
    WHERE id = auth.uid()
  )
);

CREATE POLICY "allow_update_own_org"
ON organizations FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT organization_id
    FROM users
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT organization_id
    FROM users
    WHERE id = auth.uid()
  )
);

-- 4. PostgREST 캐시 강제 갱신 (여러 번)
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(0.5);
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(0.5);
NOTIFY pgrst, 'reload config';
SELECT pg_sleep(0.5);
NOTIFY pgrst, 'reload schema';


-- 5. 최종 확인
SELECT
    policyname,
    cmd,
    roles::text[] as policy_roles,
    with_check::text as with_check
FROM pg_policies
WHERE tablename = 'organizations'
ORDER BY cmd;


-- 6. 역할별 정책 개수 확인
SELECT
    'public' as role_name,
    COUNT(*) FILTER (WHERE roles::text[] @> ARRAY['public']) as count
FROM pg_policies
WHERE tablename = 'organizations'
UNION ALL
SELECT
    'authenticated' as role_name,
    COUNT(*) FILTER (WHERE roles::text[] @> ARRAY['authenticated']) as count
FROM pg_policies
WHERE tablename = 'organizations';

-- 예상 결과:
-- public: 0
-- authenticated: 3


-- ========================================
-- 완료 메시지
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RLS 정책 강제 재적용 완료';
    RAISE NOTICE '✅ PostgREST 캐시 여러 번 갱신 요청';
    RAISE NOTICE '';
    RAISE NOTICE '⏰ 5-10분 대기 후 회원가입 재시도';
    RAISE NOTICE '   또는 Supabase Dashboard에서 프로젝트 재시작';
    RAISE NOTICE '========================================';
END $$;
