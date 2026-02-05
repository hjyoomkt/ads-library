-- ========================================
-- Growth-Dashboard 어드민 시스템 테이블
-- ========================================

-- 1. organizations 테이블
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'agency' 또는 'advertiser'
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_type ON organizations(type) WHERE deleted_at IS NULL;

-- 2. advertisers 테이블 (브랜드)
CREATE TABLE advertisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  advertiser_group_id UUID, -- 브랜드 그룹핑
  business_number VARCHAR,
  website_url TEXT,
  contact_email VARCHAR,
  contact_phone VARCHAR,
  meta_conversion_type TEXT DEFAULT 'purchase',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_advertisers_organization ON advertisers(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_advertisers_group ON advertisers(advertiser_group_id) WHERE deleted_at IS NULL;

-- 3. users 테이블 (auth.users와 분리)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer', -- master, agency_admin, agency_manager, advertiser_admin, advertiser_staff, viewer
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  advertiser_id UUID REFERENCES advertisers(id) ON DELETE SET NULL, -- 1:1 관계 (user_advertisers 제거)
  organization_type TEXT, -- 'master', 'agency', 'advertiser'
  name TEXT,
  status VARCHAR DEFAULT 'active',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_organization ON users(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_advertiser ON users(advertiser_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role);

COMMENT ON COLUMN users.role IS 'master, agency_admin, agency_manager, advertiser_admin, advertiser_staff, viewer (specialist, editor, agency_staff 제거)';
COMMENT ON COLUMN users.advertiser_id IS '1명=1브랜드 단순화, user_advertisers 테이블 불필요';

-- 4. invitation_codes 테이블
CREATE TABLE invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR NOT NULL UNIQUE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  advertiser_id UUID REFERENCES advertisers(id) ON DELETE CASCADE,
  advertiser_ids UUID[],
  advertiser_names JSONB,
  invited_email VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  created_by UUID,
  used_by UUID,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  invite_type TEXT DEFAULT 'existing_member',
  parent_advertiser_id UUID REFERENCES advertisers(id) ON DELETE NO ACTION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitation_codes_code ON invitation_codes(code) WHERE used_by IS NULL;
CREATE INDEX idx_invitation_codes_email ON invitation_codes(invited_email);
CREATE INDEX idx_invitation_codes_expires ON invitation_codes(expires_at);

COMMENT ON COLUMN invitation_codes.invite_type IS 'existing_member: 기존 조직 멤버, new_brand: 신규 브랜드, new_agency: 신규 에이전시';
COMMENT ON COLUMN invitation_codes.parent_advertiser_id IS '하위 브랜드 추가 시 부모 브랜드 ID (isNewBrand)';

-- ========================================
-- 롤백
-- ========================================
-- DROP TABLE IF EXISTS invitation_codes CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS advertisers CASCADE;
-- DROP TABLE IF EXISTS organizations CASCADE;
