-- ========================================
-- 회원가입 오류 진단 SQL
-- Supabase Studio의 SQL Editor에서 실행하세요
-- ========================================

-- 1. 초대 코드 상태 확인
SELECT
    ic.code,
    ic.organization_id,
    ic.advertiser_id,
    ic.invited_email,
    ic.role,
    ic.invite_type,
    ic.created_by,
    ic.used_by,
    ic.used_at,
    ic.expires_at,
    ic.expires_at > NOW() as is_valid,
    ic.used_by IS NULL as is_unused,
    o.name as org_name,
    o.type as org_type,
    a.name as advertiser_name
FROM invitation_codes ic
LEFT JOIN organizations o ON ic.organization_id = o.id
LEFT JOIN advertisers a ON ic.advertiser_id = a.id
WHERE ic.code = '45qlr278c7jqm8inmpz2p';

-- 2. RLS 정책 확인 - organizations
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'organizations'
ORDER BY policyname;

-- 3. RLS 정책 확인 - advertisers
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'advertisers'
ORDER BY policyname;

-- 4. RLS 정책 확인 - users
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- 5. RLS 정책 확인 - invitation_codes
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'invitation_codes'
ORDER BY policyname;

-- 6. 테이블 RLS 활성화 상태 확인
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('organizations', 'advertisers', 'users', 'invitation_codes')
ORDER BY tablename;

-- 7. 회원가입 사용자 ID 확인 (초대코드 에러 발생 시점의 auth.uid)
-- 이 쿼리는 회원가입 시도한 사용자의 auth.users 레코드를 찾습니다
SELECT
    id,
    email,
    created_at,
    email_confirmed_at,
    confirmation_sent_at
FROM auth.users
WHERE email = 'test@example.com'  -- 회원가입 시도한 이메일로 변경
ORDER BY created_at DESC
LIMIT 1;

-- 8. RLS 함수 존재 확인
SELECT
    proname as function_name,
    prosrc as source_code
FROM pg_proc
WHERE proname IN ('get_user_advertiser_ids_by_uid', 'get_user_advertiser_ids')
ORDER BY proname;

-- 9. 특정 사용자로 INSERT 시뮬레이션 (실제 실행 안 됨, 실행 계획만 확인)
-- 실제 회원가입 시도한 사용자의 ID를 넣어서 테스트
EXPLAIN (COSTS OFF, VERBOSE ON)
INSERT INTO organizations (name, organization_type, created_by)
VALUES ('테스트조직', 'client', 'ce862122-1fcc-4d67-b924-271c846d142e'::uuid);
-- 위 쿼리는 실제 INSERT가 안 되고 실행 계획만 보여줍니다

-- 10. INSERT 정책이 없는 경우 확인
SELECT
    COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_policies_count,
    COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_policies_count,
    COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_policies_count
FROM pg_policies
WHERE tablename IN ('organizations', 'advertisers', 'users');

-- ========================================
-- 결과 해석:
-- ========================================
-- 1. 초대 코드가 유효한지 확인 (is_valid = true, is_unused = true)
-- 2. INSERT 정책이 각 테이블에 존재하는지 확인 (insert_policies_count > 0)
-- 3. RLS가 활성화되어 있는지 확인 (rowsecurity = true)
-- 4. auth.users에 회원가입 시도한 계정이 생성되었는지 확인
