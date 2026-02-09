-- RLS 정책 교체: users 테이블 UPDATE 권한
-- 작성일: 2024
-- 목적: 기존 users_update_own_record 정책을 권한 기반 정책으로 교체

-- 기존 정책 정보 (롤백용):
-- policyname: users_update_own_record
-- cmd: UPDATE
-- permissive: PERMISSIVE
-- roles: {authenticated}
-- qual: (id = auth.uid())
-- with_check: (id = auth.uid())

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "users_update_own_record" ON users;

-- 2. 새로운 권한 기반 UPDATE 정책 추가
CREATE POLICY "users_update_with_permission"
ON users FOR UPDATE
TO authenticated
USING (can_update_user(id))
WITH CHECK (can_update_user(id));

-- 3. 정책 설명 추가
COMMENT ON POLICY "users_update_with_permission" ON users IS
'역할 기반 사용자 수정 권한: master는 모든 사용자(master 제외), agency는 같은 조직의 하위 권한, advertiser는 같은 광고주의 하위 권한, 일반 사용자는 자기 자신만 수정 가능';
