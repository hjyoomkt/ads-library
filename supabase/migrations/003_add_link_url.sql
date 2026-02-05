-- 광고 링크 URL 컬럼 추가
-- 실행 날짜: 2026-02-03

ALTER TABLE ad_archives
ADD COLUMN IF NOT EXISTS ad_creative_link_url TEXT;

-- 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_ad_archives_link_url
ON ad_archives(ad_creative_link_url);

COMMENT ON COLUMN ad_archives.ad_creative_link_url IS '실제 광고 링크 URL (클릭 시 이동하는 주소)';
