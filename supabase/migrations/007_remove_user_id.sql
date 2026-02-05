-- =====================================================
-- Migration 007: user_id 제거 및 데이터 공유 시스템 전환
-- =====================================================
-- 목적: user_id 기반 개인 소유 모델 → 서버 공용 데이터 모델
-- 작성일: 2026-02-04
-- =====================================================

-- =====================================================
-- 0. ad_archive_id 컬럼 추가 (005에서 통합)
-- =====================================================

-- ad_archive_id 컬럼 추가 (nullable)
ALTER TABLE ad_archives
ADD COLUMN IF NOT EXISTS ad_archive_id TEXT;

-- 기존 데이터에서 ad_archive_id 추출 (platform_specific_data JSONB에서)
UPDATE ad_archives
SET ad_archive_id = platform_specific_data->>'ad_archive_id'
WHERE platform = 'meta'
  AND ad_archive_id IS NULL
  AND platform_specific_data->>'ad_archive_id' IS NOT NULL;

-- ad_archive_id 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_ad_archives_ad_archive_id
ON ad_archives(ad_archive_id);

-- =====================================================
-- 1. RLS 정책 제거
-- =====================================================

-- ad_archives RLS 정책 제거
DROP POLICY IF EXISTS "Users can view own ads" ON ad_archives;
DROP POLICY IF EXISTS "Users can insert own ads" ON ad_archives;
DROP POLICY IF EXISTS "Users can delete own ads" ON ad_archives;
ALTER TABLE ad_archives DISABLE ROW LEVEL SECURITY;

-- ad_media RLS 정책 제거
DROP POLICY IF EXISTS "Users can view own media" ON ad_media;
ALTER TABLE ad_media DISABLE ROW LEVEL SECURITY;

-- scrape_jobs RLS 정책 제거
DROP POLICY IF EXISTS "Users can view own jobs" ON scrape_jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON scrape_jobs;
ALTER TABLE scrape_jobs DISABLE ROW LEVEL SECURITY;

-- user_search_history RLS 정책 제거
DROP POLICY IF EXISTS "Users can view own history" ON user_search_history;
DROP POLICY IF EXISTS "Users can insert own history" ON user_search_history;
ALTER TABLE user_search_history DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. UNIQUE Constraint 변경
-- =====================================================

-- 기존 constraint 제거
ALTER TABLE ad_archives
DROP CONSTRAINT IF EXISTS unique_meta_ads;

-- 기존 partial index 제거 (migration 005, 006에서 생성된 것들)
DROP INDEX IF EXISTS unique_meta_ad_archive_id;
DROP INDEX IF EXISTS unique_other_platform_ads;

-- 새로운 UNIQUE constraint 추가 (user_id 없이)
-- Meta 광고: platform + ad_archive_id만으로 중복 판단
ALTER TABLE ad_archives
ADD CONSTRAINT unique_meta_ads
UNIQUE (platform, ad_archive_id);

-- =====================================================
-- 3. user_id 컬럼 제거
-- =====================================================

-- ad_archives에서 user_id 제거
ALTER TABLE ad_archives
DROP COLUMN IF EXISTS user_id;

-- scrape_jobs에서 user_id 제거
ALTER TABLE scrape_jobs
DROP COLUMN IF EXISTS user_id;

-- user_search_history에서 user_id 제거 (검색 기록 공유)
ALTER TABLE user_search_history
DROP COLUMN IF EXISTS user_id;

-- =====================================================
-- 4. 인덱스 정리
-- =====================================================

-- user_id 관련 인덱스 제거
DROP INDEX IF EXISTS idx_ad_archives_user_id;
DROP INDEX IF EXISTS idx_ad_archives_user_platform;
DROP INDEX IF EXISTS idx_scrape_jobs_user_id;
DROP INDEX IF EXISTS idx_user_search_history_user_id;

-- =====================================================
-- 검증 쿼리 (주석 처리)
-- =====================================================

-- 1. user_id 컬럼 제거 확인
-- SELECT column_name
-- FROM information_schema.columns
-- WHERE table_name IN ('ad_archives', 'scrape_jobs', 'user_search_history')
--   AND column_name = 'user_id';
-- -- 예상 결과: 0 rows

-- 2. UNIQUE constraint 확인
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'ad_archives'::regclass
--   AND conname LIKE '%unique%';
-- -- 예상 결과: unique_meta_ads UNIQUE (platform, ad_archive_id)

-- 3. RLS 비활성화 확인
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('ad_archives', 'ad_media', 'scrape_jobs', 'user_search_history');
-- -- 예상 결과: 모두 false

-- 4. 데이터 무결성 확인
-- SELECT COUNT(*) AS total_ads
-- FROM ad_archives;
-- -- 기존 데이터가 유지되어야 함

-- =====================================================
-- 완료
-- =====================================================
-- 마이그레이션 완료 후:
-- - 모든 광고 데이터는 서버 공용
-- - 검색 기록 공유
-- - 같은 ad_archive_id는 하나만 존재 (중복 시 UPDATE)
-- =====================================================
