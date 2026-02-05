-- Cloudinary 및 OCR 필드 추가
-- 실행 날짜: 2026-02-03

-- ad_media 테이블에 Cloudinary 및 OCR 관련 컬럼 추가
ALTER TABLE ad_media
ADD COLUMN IF NOT EXISTS original_url TEXT,
ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT,
ADD COLUMN IF NOT EXISTS ocr_text TEXT,
ADD COLUMN IF NOT EXISTS ocr_confidence NUMERIC,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_ad_media_cloudinary_id
ON ad_media(cloudinary_public_id);

CREATE INDEX IF NOT EXISTS idx_ad_media_ocr_text
ON ad_media USING gin(to_tsvector('simple', ocr_text));

-- 컬럼 설명 추가
COMMENT ON COLUMN ad_media.original_url IS 'Meta 원본 미디어 URL';
COMMENT ON COLUMN ad_media.cloudinary_public_id IS 'Cloudinary Public ID';
COMMENT ON COLUMN ad_media.ocr_text IS 'OCR 추출 텍스트 (이미지만 해당)';
COMMENT ON COLUMN ad_media.ocr_confidence IS 'OCR 정확도 (0-100)';
COMMENT ON COLUMN ad_media.metadata IS '미디어 메타데이터 (width, height, format, duration 등)';
