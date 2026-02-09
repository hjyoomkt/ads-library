-- 함수 삭제
DROP FUNCTION IF EXISTS is_master_user();

-- 원래 정책 복원
DROP POLICY IF EXISTS "users_select_accessible_users" ON users;

CREATE POLICY "users_select_accessible_users"
ON users FOR SELECT
TO authenticated
USING (
  (advertiser_id IN (
    SELECT get_user_advertiser_ids_by_uid(auth.uid())
  ))
  OR (id = auth.uid())
);

-- 확인
SELECT policyname, qual
FROM pg_policies
WHERE tablename = 'users' AND policyname = 'users_select_accessible_users';
