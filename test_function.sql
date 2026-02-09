-- ========================================
-- get_user_advertiser_ids_by_uid 함수 테스트
-- ========================================

-- 1. 현재 로그인한 사용자 정보
SELECT
  auth.uid() AS "Auth UID",
  auth.email() AS "Auth Email",
  u.role AS "User Role",
  u.organization_id AS "Organization ID"
FROM users u
WHERE u.email = auth.email();

-- 2. 함수 결과 (현재 사용자가 접근 가능한 advertiser 목록)
SELECT
  a.id AS "Advertiser ID",
  a.name AS "Advertiser Name",
  a.organization_id AS "Organization ID"
FROM get_user_advertiser_ids_by_uid(auth.uid()) AS func_result
JOIN advertisers a ON a.id = func_result.advertiser_id
ORDER BY a.name;

-- 3. 함수 결과 개수
SELECT COUNT(*) AS "Accessible Advertisers Count"
FROM get_user_advertiser_ids_by_uid(auth.uid());

-- 4. 현재 사용자 role별 예상 결과
SELECT
  u.role AS "User Role",
  CASE
    WHEN u.role = 'master' THEN '모든 브랜드'
    WHEN u.role IN ('agency_admin', 'agency_manager') THEN '같은 organization의 모든 브랜드'
    WHEN u.role IN ('advertiser_admin', 'advertiser_staff') THEN '자신의 브랜드만'
    ELSE '접근 불가'
  END AS "Expected Access"
FROM users u
WHERE u.email = auth.email();

-- 5. 실제 데이터베이스의 브랜드 개수 (비교용)
SELECT
  '전체 브랜드 개수' AS "Category",
  COUNT(*) AS "Count"
FROM advertisers
WHERE deleted_at IS NULL

UNION ALL

SELECT
  '현재 사용자 organization의 브랜드 개수' AS "Category",
  COUNT(*) AS "Count"
FROM advertisers a
JOIN users u ON u.organization_id = a.organization_id
WHERE u.email = auth.email()
  AND a.deleted_at IS NULL;
