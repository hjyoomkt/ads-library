-- ========================================
-- user_advertisers 테이블 생성
-- 복수 브랜드 지원을 위한 N:M 매핑 테이블
-- ========================================

CREATE TABLE user_advertisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  advertiser_id UUID NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, advertiser_id)
);

CREATE INDEX idx_user_advertisers_user ON user_advertisers(user_id);
CREATE INDEX idx_user_advertisers_advertiser ON user_advertisers(advertiser_id);

COMMENT ON TABLE user_advertisers IS '사용자-브랜드 N:M 매핑 테이블 (복수 브랜드 지원)';
COMMENT ON COLUMN user_advertisers.user_id IS 'users.id 참조';
COMMENT ON COLUMN user_advertisers.advertiser_id IS 'advertisers.id 참조';

-- ========================================
-- 롤백
-- ========================================
-- DROP TABLE IF EXISTS user_advertisers CASCADE;
