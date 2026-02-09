-- ========================================
-- 회원 삭제 감사 로그 테이블
-- ========================================
-- 회원 삭제 시 삭제된 사용자 정보와 삭제 사유를 기록합니다.
-- growth-dashboard의 user_deletion_log 테이블과 동일한 구조입니다.

CREATE TABLE IF NOT EXISTS user_deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_user_id UUID NOT NULL,
  deleted_user_email TEXT,
  deleted_user_name TEXT,
  deleted_by_user_id UUID,
  advertiser_id UUID,
  organization_id UUID,
  new_advertiser_admin_id UUID,
  deletion_reason TEXT,
  data_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_deletion_log_user ON user_deletion_log(deleted_user_id);
CREATE INDEX IF NOT EXISTS idx_user_deletion_log_date ON user_deletion_log(created_at);

COMMENT ON TABLE user_deletion_log IS '회원 삭제 감사 로그 - 삭제된 사용자 정보와 삭제 사유 기록';
COMMENT ON COLUMN user_deletion_log.deleted_user_id IS '삭제된 사용자 UUID';
COMMENT ON COLUMN user_deletion_log.deleted_by_user_id IS '삭제를 실행한 사용자 UUID (본인 삭제 시 동일)';
COMMENT ON COLUMN user_deletion_log.new_advertiser_admin_id IS '소유권 이전 시 새 관리자 UUID';
COMMENT ON COLUMN user_deletion_log.deletion_reason IS 'Self-deletion 또는 Admin-initiated deletion';
COMMENT ON COLUMN user_deletion_log.data_snapshot IS '삭제 시점의 사용자 정보 JSON 스냅샷';

-- ========================================
-- 롤백
-- ========================================
-- DROP TABLE IF EXISTS user_deletion_log CASCADE;
