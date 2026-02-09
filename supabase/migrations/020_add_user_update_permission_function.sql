-- 사용자 수정 권한 체크 함수
-- 프론트엔드 EditUserModal.jsx의 canEditUser 로직을 데이터베이스 레벨로 구현
-- 작성일: 2024
-- 목적: ads-library /superadmin/users의 직급 변경 기능 활성화

CREATE OR REPLACE FUNCTION can_update_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_email TEXT;
  current_user_id UUID;
  current_user_role TEXT;
  current_user_org_id UUID;
  current_user_adv_id UUID;

  target_user_role TEXT;
  target_user_org_id UUID;
  target_user_adv_id UUID;

  -- 현재 시스템에서 사용 중인 역할만 포함
  -- specialist, editor, agency_staff는 008_add_admin_system.sql에서 제거됨
  role_hierarchy JSONB := '{
    "master": 100,
    "agency_admin": 7,
    "agency_manager": 6,
    "advertiser_admin": 4,
    "advertiser_staff": 3,
    "viewer": 1
  }'::jsonb;

  current_level INT;
  target_level INT;
BEGIN
  -- 1. 현재 사용자 인증 확인
  SELECT id, email INTO current_user_id, current_user_email
  FROM auth.users
  WHERE id = auth.uid();

  IF current_user_email IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 2. 현재 사용자의 메타데이터 조회
  SELECT role, organization_id, advertiser_id
  INTO current_user_role, current_user_org_id, current_user_adv_id
  FROM users
  WHERE email = current_user_email AND deleted_at IS NULL;

  IF current_user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 3. 대상 사용자의 메타데이터 조회
  SELECT role, organization_id, advertiser_id
  INTO target_user_role, target_user_org_id, target_user_adv_id
  FROM users
  WHERE id = target_user_id AND deleted_at IS NULL;

  IF target_user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 4. 자기 자신은 항상 수정 가능 (프로필 편집용)
  IF target_user_id = (SELECT id FROM users WHERE email = current_user_email) THEN
    RETURN TRUE;
  END IF;

  -- 5. 권한 레벨 조회 (role_hierarchy에 없는 역할은 NULL 반환)
  current_level := (role_hierarchy->current_user_role)::int;
  target_level := (role_hierarchy->target_user_role)::int;

  -- 권한 레벨이 정의되지 않은 역할은 차단
  IF current_level IS NULL OR target_level IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 6. master 규칙: 다른 master는 수정 불가, 나머지는 모두 가능
  IF current_user_role = 'master' THEN
    RETURN target_user_role != 'master';
  END IF;

  -- 7. 동급이거나 상위 권한 사용자는 수정 불가 (핵심 규칙)
  IF target_level >= current_level THEN
    RETURN FALSE;
  END IF;

  -- 8. agency_admin, agency_manager: 같은 organization_id의 하위 권한 사용자만 수정 가능
  IF current_user_role IN ('agency_admin', 'agency_manager') THEN
    RETURN current_user_org_id IS NOT NULL
      AND target_user_org_id = current_user_org_id;
  END IF;

  -- 9. advertiser_admin: 같은 advertiser_id의 하위 권한 사용자만 수정 가능
  IF current_user_role = 'advertiser_admin' THEN
    RETURN current_user_adv_id IS NOT NULL
      AND target_user_adv_id = current_user_adv_id;
  END IF;

  -- 10. advertiser_staff, viewer: 자기 자신만 (이미 4번에서 처리되어 여기까지 오지 않음)
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수 설명 추가
COMMENT ON FUNCTION can_update_user(UUID) IS
'사용자 수정 권한 체크: master는 모든 사용자(master 제외), agency는 같은 조직, advertiser는 같은 광고주, 일반 사용자는 자기 자신만 수정 가능';
