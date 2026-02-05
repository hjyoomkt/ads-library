-- ========================================
-- RLS 무한 재귀 문제 수정
-- ========================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "users_select_accessible_users" ON users;

-- 수정된 정책 생성 (무한 재귀 방지)
CREATE POLICY "users_select_accessible_users"
ON users FOR SELECT
TO authenticated
USING (
  -- 같은 브랜드 사용자 또는 자기 자신
  advertiser_id IN (
    SELECT get_user_advertiser_ids_by_uid(auth.uid())
  )
  OR id = auth.uid()  -- ✅ 수정: users 테이블 조회 제거, auth.uid() 직접 사용
);

-- 확인
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'users';
