-- ========================================
-- 브랜드 표시 안되는 문제 진단 SQL
-- ========================================

-- 1. 현재 로그인한 사용자 확인 (auth.users의 이메일을 여기에 입력하세요)
DO $$
DECLARE
  v_email TEXT := 'YOUR_EMAIL_HERE'; -- 여기에 로그인한 이메일 입력
  v_user_record RECORD;
  v_advertiser_record RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '1. 사용자 정보 확인';
  RAISE NOTICE '========================================';

  -- users 테이블에서 사용자 정보 조회
  SELECT * INTO v_user_record
  FROM users
  WHERE email = v_email AND deleted_at IS NULL;

  IF v_user_record IS NULL THEN
    RAISE NOTICE '❌ users 테이블에서 사용자를 찾을 수 없습니다!';
    RAISE NOTICE '이메일: %', v_email;
    RETURN;
  END IF;

  RAISE NOTICE '✅ 사용자 발견:';
  RAISE NOTICE '  - ID: %', v_user_record.id;
  RAISE NOTICE '  - Email: %', v_user_record.email;
  RAISE NOTICE '  - Role: %', v_user_record.role;
  RAISE NOTICE '  - Organization ID: %', v_user_record.organization_id;
  RAISE NOTICE '  - Advertiser ID: %', v_user_record.advertiser_id;
  RAISE NOTICE '  - Organization Type: %', v_user_record.organization_type;
  RAISE NOTICE '';

  -- 2. advertiser_id가 있는지 확인
  IF v_user_record.advertiser_id IS NULL THEN
    RAISE NOTICE '⚠️  advertiser_id가 NULL입니다!';
    RAISE NOTICE '이것이 문제의 원인입니다. 브랜드가 할당되지 않았습니다.';
  ELSE
    -- advertiser 정보 조회
    SELECT * INTO v_advertiser_record
    FROM advertisers
    WHERE id = v_user_record.advertiser_id AND deleted_at IS NULL;

    IF v_advertiser_record IS NULL THEN
      RAISE NOTICE '❌ advertiser_id는 있지만 advertisers 테이블에서 해당 브랜드를 찾을 수 없습니다!';
      RAISE NOTICE '  - Advertiser ID: %', v_user_record.advertiser_id;
    ELSE
      RAISE NOTICE '✅ 브랜드 정보:';
      RAISE NOTICE '  - Brand ID: %', v_advertiser_record.id;
      RAISE NOTICE '  - Brand Name: %', v_advertiser_record.name;
      RAISE NOTICE '  - Organization ID: %', v_advertiser_record.organization_id;
    END IF;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '2. RLS 함수 테스트';
  RAISE NOTICE '========================================';

  -- get_user_advertiser_ids 함수 테스트
  RAISE NOTICE 'get_user_advertiser_ids 함수 결과:';
  FOR v_advertiser_record IN
    SELECT * FROM get_user_advertiser_ids(v_email)
  LOOP
    RAISE NOTICE '  - Advertiser ID: %', v_advertiser_record.advertiser_id;
  END LOOP;

END $$;

-- 3. 모든 사용자의 advertiser_id 상태 확인
SELECT
  '========================================' as divider,
  '3. 전체 사용자 advertiser_id 상태' as title;

SELECT
  email,
  role,
  advertiser_id,
  organization_id,
  organization_type,
  CASE
    WHEN advertiser_id IS NULL THEN '❌ NULL'
    ELSE '✅ 할당됨'
  END as status
FROM users
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- 4. 모든 브랜드 목록
SELECT
  '========================================' as divider,
  '4. 전체 브랜드 목록' as title;

SELECT
  a.id,
  a.name as brand_name,
  o.name as organization_name,
  a.organization_id,
  a.deleted_at
FROM advertisers a
LEFT JOIN organizations o ON a.organization_id = o.id
ORDER BY a.created_at DESC;

-- 5. RLS 정책 확인
SELECT
  '========================================' as divider,
  '5. advertisers 테이블 RLS 정책' as title;

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

-- 6. organizations 테이블 RLS 정책
SELECT
  '========================================' as divider,
  '6. organizations 테이블 RLS 정책' as title;

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
