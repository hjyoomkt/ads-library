-- ========================================
-- advertisers 테이블 RLS 정책 원복
-- ========================================

-- 1. 현재 정책 확인 (원복 전)
SELECT
  policyname,
  qual AS "Current USING Clause (Before Rollback)"
FROM pg_policies
WHERE tablename = 'advertisers' AND policyname = 'allow_select_advertisers';

-- 2. 기존 정책 삭제
DROP POLICY IF EXISTS "allow_select_advertisers" ON advertisers;

-- 3. 원래 정책 복원 (모든 사용자가 모든 브랜드 조회 가능)
CREATE POLICY "allow_select_advertisers"
ON advertisers FOR SELECT
TO authenticated
USING (true);

-- 4. 원복 결과 확인 (USING (true)인지 검증)
SELECT
  policyname,
  qual AS "Restored USING Clause (Should be: true)"
FROM pg_policies
WHERE tablename = 'advertisers' AND policyname = 'allow_select_advertisers';

-- 5. 검증: qual이 'true'와 일치하는지 확인
DO $$
DECLARE
  v_qual TEXT;
BEGIN
  SELECT qual INTO v_qual
  FROM pg_policies
  WHERE tablename = 'advertisers' AND policyname = 'allow_select_advertisers';

  IF v_qual = 'true' THEN
    RAISE NOTICE '✅ 원복 성공: USING (true)';
  ELSE
    RAISE WARNING '⚠️  원복 실패: USING = %', v_qual;
  END IF;
END $$;
