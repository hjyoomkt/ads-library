-- ========================================
-- 기존 테이블에 advertiser_id 추가
-- ========================================

-- 중요: ad_archives는 서버 귀속 데이터이므로 advertiser_id 추가하지 않음

-- 1. user_search_history 테이블 (브랜드별 모니터링 목록)
ALTER TABLE user_search_history
ADD COLUMN advertiser_id UUID REFERENCES advertisers(id) ON DELETE CASCADE;

CREATE INDEX idx_user_search_history_advertiser ON user_search_history(advertiser_id);

COMMENT ON COLUMN user_search_history.advertiser_id IS '브랜드별 검색 히스토리 (SavedSearchesSidebar용)';

-- 2. scrape_jobs 테이블 (통계/감사 로그용, RLS 불필요)
ALTER TABLE scrape_jobs
ADD COLUMN advertiser_id UUID REFERENCES advertisers(id) ON DELETE CASCADE;

CREATE INDEX idx_scrape_jobs_advertiser ON scrape_jobs(advertiser_id);

COMMENT ON COLUMN scrape_jobs.advertiser_id IS '어떤 브랜드가 스크래핑 요청했는지 (통계/감사용)';

-- 참고: ad_archives는 서버 귀속이므로 advertiser_id 추가하지 않음
-- 참고: ad_media는 ad_archives를 통해 간접 연결
-- 참고: saved_searches는 삭제됨

-- ========================================
-- 롤백
-- ========================================
-- ALTER TABLE user_search_history DROP COLUMN IF EXISTS advertiser_id;
-- ALTER TABLE scrape_jobs DROP COLUMN IF EXISTS advertiser_id;
