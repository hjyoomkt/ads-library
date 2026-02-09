-- 롤백 스크립트: users 테이블 UPDATE 정책을 원래대로 복원
-- 작성일: 2024
-- 사용 시기: 020, 021 마이그레이션 실행 후 문제 발생 시

-- 1. 새 정책 삭제
DROP POLICY IF EXISTS "users_update_with_permission" ON users;

-- 2. 새 함수 삭제
DROP FUNCTION IF EXISTS can_update_user(UUID);

-- 3. 기존 정책 복원 (정확한 원본)
CREATE POLICY "users_update_own_record"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 4. 복원 확인 쿼리
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual::text,
  with_check::text
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'UPDATE';

-- 예상 결과:
-- policyname: users_update_own_record
-- cmd: UPDATE
-- permissive: PERMISSIVE
-- roles: {authenticated}
-- qual: (id = auth.uid())
-- with_check: (id = auth.uid())
