-- ========================================
-- 기존 94개 광고 데이터 보존을 위한 기본 브랜드 생성
-- ========================================

-- 1. 기본 organization 생성
INSERT INTO organizations (id, name, type, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'Default Organization',
  'advertiser',
  NOW()
);

-- 2. 기본 advertiser 생성
INSERT INTO advertisers (id, name, organization_id, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000002'::UUID,
  'Default Brand',
  '00000000-0000-0000-0000-000000000001'::UUID,
  NOW()
);

-- 3. 기존 사용자(1명)를 users 테이블에 복사
INSERT INTO users (id, email, role, organization_id, advertiser_id, organization_type, status, created_at)
SELECT
  id,
  email,
  'master' AS role, -- 기존 사용자를 master로 설정
  '00000000-0000-0000-0000-000000000001'::UUID,
  '00000000-0000-0000-0000-000000000002'::UUID,
  'advertiser',
  'active',
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM users)
LIMIT 1;

-- 4. user_search_history에 기본 advertiser 연결
UPDATE user_search_history
SET advertiser_id = '00000000-0000-0000-0000-000000000002'::UUID
WHERE advertiser_id IS NULL;

-- 5. scrape_jobs에 기본 advertiser 연결
UPDATE scrape_jobs
SET advertiser_id = '00000000-0000-0000-0000-000000000002'::UUID
WHERE advertiser_id IS NULL;

-- 검증 쿼리
SELECT 'user_search_history', COUNT(*) FROM user_search_history WHERE advertiser_id IS NOT NULL
UNION ALL
SELECT 'scrape_jobs', COUNT(*) FROM scrape_jobs WHERE advertiser_id IS NOT NULL;
-- 결과: 각각 7, 6이어야 함

-- 참고: ad_archives는 서버 귀속이므로 advertiser_id 없음

-- ========================================
-- 롤백
-- ========================================
-- DELETE FROM users WHERE email IN (SELECT email FROM auth.users);
-- DELETE FROM advertisers WHERE id = '00000000-0000-0000-0000-000000000002'::UUID;
-- DELETE FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001'::UUID;
