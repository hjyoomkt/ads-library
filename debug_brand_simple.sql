-- ========================================
-- 브랜드 표시 안되는 문제 간단 진단 SQL
-- 아래 쿼리들을 하나씩 실행하세요
-- ========================================

-- 1. 현재 로그인한 사용자의 정보 확인
-- 'test02@zestdot.com'을 본인의 이메일로 변경하세요
SELECT
  '1. 사용자 정보' as section,
  id,
  email,
  role,
  organization_id,
  advertiser_id,
  organization_type,
  status,
  CASE
    WHEN advertiser_id IS NULL THEN '❌ advertiser_id가 NULL입니다!'
    ELSE '✅ advertiser_id 할당됨'
  END as advertiser_status
FROM users
WHERE email = 'test02@zestdot.com' -- 여기를 본인 이메일로 변경
  AND deleted_at IS NULL;


-- 2. 해당 사용자의 브랜드 정보 확인
SELECT
  '2. 브랜드 정보' as section,
  a.id,
  a.name as brand_name,
  a.organization_id,
  o.name as organization_name,
  a.deleted_at
FROM users u
LEFT JOIN advertisers a ON u.advertiser_id = a.id
LEFT JOIN organizations o ON a.organization_id = o.id
WHERE u.email = 'test02@zestdot.com' -- 여기를 본인 이메일로 변경
  AND u.deleted_at IS NULL;


-- 3. RLS 함수 테스트 - get_user_advertiser_ids
SELECT
  '3. RLS 함수 결과' as section,
  advertiser_id
FROM get_user_advertiser_ids('test02@zestdot.com'); -- 여기를 본인 이메일로 변경


-- 4. 모든 브랜드 목록 확인
SELECT
  '4. 전체 브랜드 목록' as section,
  a.id,
  a.name as brand_name,
  o.name as organization_name,
  a.organization_id,
  a.deleted_at
FROM advertisers a
LEFT JOIN organizations o ON a.organization_id = o.id
ORDER BY a.created_at DESC
LIMIT 20;


-- 5. 모든 사용자와 브랜드 연결 상태
SELECT
  '5. 사용자-브랜드 연결 상태' as section,
  u.email,
  u.role,
  u.advertiser_id,
  a.name as brand_name,
  CASE
    WHEN u.advertiser_id IS NULL THEN '❌ NULL'
    WHEN a.id IS NULL THEN '❌ 브랜드 없음'
    ELSE '✅ 연결됨'
  END as status
FROM users u
LEFT JOIN advertisers a ON u.advertiser_id = a.id
WHERE u.deleted_at IS NULL
ORDER BY u.created_at DESC
LIMIT 20;


-- 6. advertisers 테이블 RLS 정책 확인
SELECT
  '6. advertisers RLS 정책' as section,
  policyname,
  cmd,
  qual::text as using_expression,
  with_check::text as check_expression
FROM pg_policies
WHERE tablename = 'advertisers'
ORDER BY policyname;


-- 7. 현재 사용자가 advertisers 테이블에서 조회 가능한 브랜드
-- (이 쿼리는 실제 RLS가 적용된 상태에서 실행됩니다)
SELECT
  '7. 내가 조회 가능한 브랜드' as section,
  id,
  name,
  organization_id,
  deleted_at
FROM advertisers
WHERE deleted_at IS NULL
LIMIT 20;
