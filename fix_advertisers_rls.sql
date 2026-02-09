-- ========================================
-- advertisers 테이블 RLS 정책 수정
-- ========================================
-- 마스터: 모든 브랜드
-- 에이전시 관리자: 자기 조직(organization)의 브랜드
-- 브랜드 사용자: 자기 브랜드만

-- 1. 원래 정책 백업 (롤백 검증용)
SELECT
  policyname,
  qual AS "Original USING Clause"
FROM pg_policies
WHERE tablename = 'advertisers' AND policyname = 'allow_select_advertisers';

-- 2. 기존 정책 삭제
DROP POLICY IF EXISTS "allow_select_advertisers" ON advertisers;
DROP POLICY IF EXISTS "users_select_accessible_advertisers" ON advertisers;

-- 3. 새 정책 생성
CREATE POLICY "allow_select_advertisers"
ON advertisers FOR SELECT
TO authenticated
USING (
  -- 1. 마스터: 모든 브랜드
  is_master_user()

  -- 2. 에이전시 관리자: 자기 조직의 브랜드
  --    브랜드 사용자: 자기 브랜드만
  --    (get_user_advertiser_ids_by_uid 함수가 처리)
  OR id IN (
    SELECT get_user_advertiser_ids_by_uid(auth.uid())
  )
);

-- 4. 적용 결과 확인
SELECT
  policyname,
  qual AS "New USING Clause"
FROM pg_policies
WHERE tablename = 'advertisers' AND policyname = 'allow_select_advertisers';
