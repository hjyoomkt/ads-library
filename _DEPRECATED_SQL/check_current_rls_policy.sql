-- 현재 적용된 users 테이블 RLS 정책 확인
SELECT
  policyname,
  definition
FROM pg_policies
WHERE tablename = 'users'
AND policyname = 'users_select_accessible_users';
