-- master 사용자 데이터 확인 및 수정

-- 1. 현재 데이터 확인
SELECT
  id,
  email,
  role,
  organization_type,
  organization_id,
  advertiser_id,
  status
FROM users
WHERE email = 'test@zestdot.com' AND deleted_at IS NULL;

-- 2. master 사용자 organization_type 수정 (필요시)
-- master 역할의 사용자는 organization_type이 'master'여야 함
UPDATE users
SET organization_type = 'master'
WHERE role = 'master' AND organization_type != 'master';

-- 3. 수정 후 재확인
SELECT
  id,
  email,
  role,
  organization_type,
  organization_id,
  advertiser_id,
  status
FROM users
WHERE email = 'test@zestdot.com' AND deleted_at IS NULL;
