-- =====================================================
-- Migration 006: PARTIAL INDEX를 UNIQUE CONSTRAINT로 변경
-- =====================================================
-- 문제: PARTIAL INDEX는 upsert의 onConflict에서 사용 불가
-- 해결: 일반 UNIQUE CONSTRAINT로 변경
-- =====================================================

-- 1. 기존 PARTIAL INDEX 및 CHECK CONSTRAINT 제거
DROP INDEX IF EXISTS unique_meta_ad_archive_id;
DROP INDEX IF EXISTS unique_other_platform_ads;

-- 기존 CHECK constraint도 제거 (너무 엄격함)
ALTER TABLE ad_archives
DROP CONSTRAINT IF EXISTS check_meta_ad_archive_id;

-- 2. UNIQUE CONSTRAINT 추가
-- Meta 광고: platform + ad_archive_id + user_id
-- ad_archive_id가 NULL이면 unique 체크에서 제외됨 (PostgreSQL 특성)
ALTER TABLE ad_archives
ADD CONSTRAINT unique_meta_ads
UNIQUE (platform, ad_archive_id, user_id);

-- 3. 다른 플랫폼용 UNIQUE CONSTRAINT는 유지 (기존 방식)
-- 이미 001_create_tables.sql에서 제거했으므로 다시 추가하지 않음

-- =====================================================
-- 검증 쿼리
-- =====================================================
-- 1. Constraint 확인
-- SELECT conname, contype, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'ad_archives'::regclass
-- AND conname LIKE '%unique%';

-- 2. 테스트 upsert
-- INSERT INTO ad_archives (user_id, platform, ad_archive_id, search_type, search_query, advertiser_name, ad_creative_body)
-- VALUES ('df757234-1cec-4ade-bbd4-5422477c2d21', 'meta', 'TEST123', 'keyword', 'test', 'Test', 'Test')
-- ON CONFLICT (platform, ad_archive_id, user_id)
-- DO UPDATE SET ad_creative_body = EXCLUDED.ad_creative_body;
