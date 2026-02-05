-- ========================================
-- 이메일 기반 접근 가능 브랜드 조회
-- 수정: user_advertisers 제거, users.advertiser_id 직접 사용
-- ========================================
CREATE OR REPLACE FUNCTION get_user_advertiser_ids(user_email TEXT)
RETURNS TABLE(advertiser_id UUID) AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_org_id UUID;
  v_adv_id UUID;
BEGIN
  SELECT users.id, users.role, users.organization_id, users.advertiser_id INTO v_user_id, v_role, v_org_id, v_adv_id
  FROM users
  WHERE users.email = user_email AND users.deleted_at IS NULL;

  -- Master: 모든 브랜드
  IF v_role = 'master' THEN
    RETURN QUERY SELECT id FROM advertisers WHERE deleted_at IS NULL;
    RETURN;
  END IF;

  -- Agency 역할 (agency_admin, agency_manager): 같은 organization의 모든 브랜드
  IF v_role IN ('agency_admin', 'agency_manager') THEN
    RETURN QUERY
    SELECT a.id
    FROM advertisers a
    WHERE a.organization_id = v_org_id AND a.deleted_at IS NULL;
    RETURN;
  END IF;

  -- Advertiser 역할 (advertiser_admin, advertiser_staff, viewer): 자신의 브랜드만
  IF v_adv_id IS NOT NULL THEN
    RETURN QUERY SELECT v_adv_id WHERE EXISTS (SELECT 1 FROM advertisers WHERE id = v_adv_id AND deleted_at IS NULL);
    RETURN;
  END IF;

  -- 브랜드 미할당 사용자: 빈 결과
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- UUID 기반 접근 가능 브랜드 조회
-- 수정: user_advertisers 제거, users.advertiser_id 직접 사용
-- ========================================
CREATE OR REPLACE FUNCTION get_user_advertiser_ids_by_uid(user_uid UUID)
RETURNS TABLE(advertiser_id UUID) AS $$
DECLARE
  v_email TEXT;
  v_role TEXT;
  v_org_id UUID;
  v_adv_id UUID;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = user_uid;

  SELECT users.role, users.organization_id, users.advertiser_id INTO v_role, v_org_id, v_adv_id
  FROM users WHERE users.email = v_email AND users.deleted_at IS NULL;

  -- Master: 모든 브랜드
  IF v_role = 'master' THEN
    RETURN QUERY SELECT id FROM advertisers WHERE deleted_at IS NULL;
    RETURN;
  END IF;

  -- Agency 역할: 같은 organization의 모든 브랜드
  IF v_role IN ('agency_admin', 'agency_manager') THEN
    RETURN QUERY
    SELECT a.id FROM advertisers a
    WHERE a.organization_id = v_org_id AND a.deleted_at IS NULL;
    RETURN;
  END IF;

  -- Advertiser 역할: 자신의 브랜드만
  IF v_adv_id IS NOT NULL THEN
    RETURN QUERY SELECT v_adv_id WHERE EXISTS (SELECT 1 FROM advertisers WHERE id = v_adv_id AND deleted_at IS NULL);
    RETURN;
  END IF;

  -- 브랜드 미할당: 빈 결과
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 롤백
-- ========================================
-- DROP FUNCTION IF EXISTS get_user_advertiser_ids(TEXT);
-- DROP FUNCTION IF EXISTS get_user_advertiser_ids_by_uid(UUID);
