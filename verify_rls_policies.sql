-- ========================================
-- RLS 정책 검증 SQL
-- Supabase Studio SQL Editor에서 실행하세요
-- ========================================

-- 1. organizations 테이블의 INSERT 정책 확인
SELECT
    policyname,
    cmd,
    roles::text[] as roles,
    qual as using_condition,
    with_check as with_check_condition
FROM pg_policies
WHERE tablename = 'organizations' AND cmd = 'INSERT'
ORDER BY policyname;

-- 예상 결과: "authenticated_insert_organizations" 정책이 있어야 함
-- with_check: true (인증된 사용자 누구나 생성 가능)


-- 2. advertisers 테이블의 INSERT 정책 확인
SELECT
    policyname,
    cmd,
    roles::text[] as roles,
    qual as using_condition,
    with_check as with_check_condition
FROM pg_policies
WHERE tablename = 'advertisers' AND cmd = 'INSERT'
ORDER BY policyname;

-- 예상 결과: "authenticated_insert_advertisers" 정책이 있어야 함


-- 3. users 테이블의 INSERT 정책 확인
SELECT
    policyname,
    cmd,
    roles::text[] as roles,
    qual as using_condition,
    with_check as with_check_condition
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'INSERT'
ORDER BY policyname;

-- 예상 결과: "users_insert_own_record" 정책이 있어야 함
-- with_check: (id = auth.uid())


-- 4. 모든 테이블의 정책 개수 확인
SELECT
    tablename,
    COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_policies,
    COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_policies,
    COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_policies,
    COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_policies,
    COUNT(*) as total_policies
FROM pg_policies
WHERE tablename IN ('organizations', 'advertisers', 'users', 'invitation_codes')
GROUP BY tablename
ORDER BY tablename;

-- 예상 결과:
-- organizations: SELECT=1, INSERT=1, UPDATE=1
-- advertisers: SELECT=1, INSERT=1, UPDATE=1
-- users: SELECT=1, INSERT=1, UPDATE=1
-- invitation_codes: SELECT=2, UPDATE=1


-- 5. RLS 활성화 상태 확인
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('organizations', 'advertisers', 'users', 'invitation_codes')
ORDER BY tablename;

-- 모두 true여야 함


-- 6. 실제 INSERT 테스트 (실행 계획만 확인, 실제 INSERT 안 됨)
-- 회원가입 시도한 사용자 ID로 테스트
DO $$
DECLARE
    test_user_id UUID := 'ce862122-1fcc-4d67-b924-271c846d142e';
BEGIN
    -- 이 블록은 실제로 실행되지 않고 구문만 확인
    RAISE NOTICE 'Test user ID: %', test_user_id;
END $$;

-- ========================================
-- 결과 해석:
-- ========================================
-- 1. INSERT 정책이 0개면 → apply_signup_fix.sql 미적용
-- 2. INSERT 정책이 있지만 with_check 조건이 너무 엄격하면 → 정책 수정 필요
-- 3. RLS가 비활성화되어 있으면 → RLS 활성화 필요
