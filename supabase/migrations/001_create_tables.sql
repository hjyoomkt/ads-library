-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table 1: ad_archives (범용 광고 아카이브)
-- =====================================================
CREATE TABLE ad_archives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 플랫폼 정보 (핵심 - 확장성)
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'naver', 'kakao', 'youtube', 'tiktok')),

  -- 검색 정보
  search_type TEXT NOT NULL CHECK (search_type IN ('keyword', 'advertiser')),
  search_query TEXT NOT NULL,

  -- 공통 광고 정보
  advertiser_name TEXT,
  ad_creative_body TEXT,
  ad_creative_link_title TEXT,
  ad_creative_link_description TEXT,

  -- 게재 정보
  started_running_date DATE,
  last_shown_date DATE,

  -- 공통 인게이지먼트
  impressions_min BIGINT,
  impressions_max BIGINT,
  spend_min NUMERIC(10,2),
  spend_max NUMERIC(10,2),

  -- 미디어 타입
  media_type TEXT CHECK (media_type IN ('image', 'video', 'carousel')),

  -- 플랫폼별 고유 데이터 (JSONB)
  platform_specific_data JSONB,

  -- 메타
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 복합 인덱스
  UNIQUE(platform, advertiser_name, ad_creative_body, started_running_date, user_id)
);

CREATE INDEX idx_ad_archives_user_id ON ad_archives(user_id);
CREATE INDEX idx_ad_archives_platform ON ad_archives(platform);
CREATE INDEX idx_ad_archives_user_platform ON ad_archives(user_id, platform);
CREATE INDEX idx_ad_archives_search_query ON ad_archives(search_query);
CREATE INDEX idx_ad_archives_advertiser ON ad_archives(advertiser_name);
CREATE INDEX idx_ad_archives_scraped_at ON ad_archives(scraped_at DESC);

-- =====================================================
-- Table 2: ad_media (광고 이미지/비디오)
-- =====================================================
CREATE TABLE ad_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id UUID REFERENCES ad_archives(id) ON DELETE CASCADE,

  -- 미디어 정보
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  cloudinary_url TEXT,
  cloudinary_public_id TEXT,

  -- 순서 (캐러셀용)
  position INTEGER DEFAULT 0,

  -- OCR 결과
  extracted_text TEXT,
  ocr_confidence NUMERIC(5,2),
  ocr_processed_at TIMESTAMP WITH TIME ZONE,

  -- 메타
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(ad_id, position)
);

CREATE INDEX idx_ad_media_ad_id ON ad_media(ad_id);

-- =====================================================
-- Table 3: scrape_jobs (스크래핑 작업 추적)
-- =====================================================
CREATE TABLE scrape_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 작업 정보
  job_id TEXT UNIQUE NOT NULL,
  search_type TEXT NOT NULL,
  search_query TEXT NOT NULL,

  -- 상태
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0,
  total_ads_found INTEGER DEFAULT 0,
  total_ads_saved INTEGER DEFAULT 0,

  -- 에러
  error_message TEXT,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_scrape_jobs_user_id ON scrape_jobs(user_id);
CREATE INDEX idx_scrape_jobs_status ON scrape_jobs(status);

-- =====================================================
-- Table 4: saved_searches (저장된 검색)
-- =====================================================
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 검색 정보
  search_type TEXT NOT NULL CHECK (search_type IN ('keyword', 'advertiser')),
  search_query TEXT NOT NULL,
  display_name TEXT,

  -- 플랫폼 필터
  platform_filter TEXT CHECK (platform_filter IN ('meta', 'google', 'naver', 'kakao', 'youtube', 'tiktok')),

  -- UI 개인화
  icon_emoji TEXT DEFAULT '🔍',
  color TEXT DEFAULT '#4299E1',

  -- 자동 스크래핑 설정
  auto_scrape BOOLEAN DEFAULT true,
  scrape_frequency TEXT DEFAULT 'daily' CHECK (scrape_frequency IN ('daily', 'weekly', 'monthly')),

  -- 통계 (캐시)
  total_ads_count INTEGER DEFAULT 0,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  next_scrape_at TIMESTAMP WITH TIME ZONE,

  -- 정렬 순서
  sort_order INTEGER DEFAULT 0,

  -- 메타
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, search_type, search_query, platform_filter)
);

CREATE INDEX idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX idx_saved_searches_next_scrape ON saved_searches(next_scrape_at)
  WHERE auto_scrape = true;

-- =====================================================
-- Table 5: user_search_history (검색 이력)
-- =====================================================
CREATE TABLE user_search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  search_type TEXT NOT NULL,
  search_query TEXT NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_search_history_user_id ON user_search_history(user_id);
