-- =====================================================
-- Migration 005: ad_archive_id를 별도 컬럼으로 추출하여 중복 문제 해결
-- =====================================================
-- 문제: 현재 ad_archive_id가 JSONB에 숨겨져 있어, 같은 광고주의 같은 텍스트면
--      다른 광고인데도 같은 광고로 취급되어 데이터가 덮어씌워짐
-- 해결: ad_archive_id를 별도 컬럼으로 추출하고 이를 기준으로 UNIQUE constraint 설정
-- =====================================================

-- 1. 기존 UNIQUE constraint 제거
ALTER TABLE ad_archives
DROP CONSTRAINT IF EXISTS ad_archives_platform_advertiser_name_ad_creative_body_start_key;

-- 2. ad_archive_id 컬럼 추가 (nullable, 나중에 NOT NULL로 변경)
ALTER TABLE ad_archives
ADD COLUMN ad_archive_id TEXT;

-- 3. 기존 데이터에서 ad_archive_id 추출 (platform_specific_data JSONB에서)
UPDATE ad_archives
SET ad_archive_id = platform_specific_data->>'ad_archive_id'
WHERE platform = 'meta'
  AND platform_specific_data->>'ad_archive_id' IS NOT NULL;

-- 4. ad_archive_id 인덱스 생성 (성능 최적화)
CREATE INDEX idx_ad_archives_ad_archive_id ON ad_archives(ad_archive_id);

-- 5. 새로운 UNIQUE constraint 설정
-- Meta 광고는 ad_archive_id + user_id로 중복 판단
-- 다른 플랫폼은 기존 방식 유지 (partial unique index 사용)
CREATE UNIQUE INDEX unique_meta_ad_archive_id
ON ad_archives(platform, ad_archive_id, user_id)
WHERE platform = 'meta' AND ad_archive_id IS NOT NULL;

-- 6. 다른 플랫폼용 UNIQUE constraint (기존 방식)
CREATE UNIQUE INDEX unique_other_platform_ads
ON ad_archives(platform, advertiser_name, ad_creative_body, started_running_date, user_id)
WHERE platform != 'meta' OR ad_archive_id IS NULL;

-- 7. ad_archive_id에 NOT NULL constraint 추가 (Meta 플랫폼만)
-- 주의: 이 제약은 애플리케이션 레벨에서도 체크해야 함
ALTER TABLE ad_archives
ADD CONSTRAINT check_meta_ad_archive_id
CHECK (
  (platform = 'meta' AND ad_archive_id IS NOT NULL) OR
  (platform != 'meta')
);

-- =====================================================
-- 검증 쿼리
-- =====================================================
-- 1. ad_archive_id가 추출되었는지 확인
-- SELECT platform, COUNT(*), COUNT(ad_archive_id)
-- FROM ad_archives
-- GROUP BY platform;

-- 2. 중복 ad_archive_id 확인 (같은 user_id 내에서)
-- SELECT ad_archive_id, user_id, COUNT(*)
-- FROM ad_archives
-- WHERE platform = 'meta' AND ad_archive_id IS NOT NULL
-- GROUP BY ad_archive_id, user_id
-- HAVING COUNT(*) > 1;
