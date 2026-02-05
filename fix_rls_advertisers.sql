-- ========================================
-- RLS 정책 수정: advertisers 테이블
-- organizations와 동일한 방식 적용
-- ========================================

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "allow_insert_advertisers" ON advertisers;
DROP POLICY IF EXISTS "allow_select_advertisers" ON advertisers;
DROP POLICY IF EXISTS "allow_update_advertisers" ON advertisers;
DROP POLICY IF EXISTS "users_select_accessible_advertisers" ON advertisers;


-- 2. 가장 단순한 정책 생성
CREATE POLICY "allow_insert_advertisers"
ON advertisers FOR INSERT
WITH CHECK (true);

CREATE POLICY "allow_select_advertisers"
ON advertisers FOR SELECT
USING (true);

CREATE POLICY "allow_update_advertisers"
ON advertisers FOR UPDATE
USING (true)
WITH CHECK (true);


-- 3. PostgREST 캐시 갱신
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(0.5);
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(0.5);
NOTIFY pgrst, 'reload config';


-- 4. 최종 확인
SELECT
    policyname,
    cmd,
    roles::text[] as policy_roles,
    with_check::text as with_check_condition
FROM pg_policies
WHERE tablename = 'advertisers'
ORDER BY cmd, policyname;


-- ========================================
-- 완료 메시지
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ advertisers 테이블 RLS 정책 생성 완료';
    RAISE NOTICE '⚠️  현재 정책: 모든 사용자 접근 가능 (임시)';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 회원가입을 다시 시도해주세요';
    RAISE NOTICE '========================================';
END $$;
