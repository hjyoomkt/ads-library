-- =====================================================
-- Row Level Security (RLS) 정책
-- =====================================================

-- ad_archives RLS
ALTER TABLE ad_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ads"
  ON ad_archives FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ads"
  ON ad_archives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ads"
  ON ad_archives FOR DELETE
  USING (auth.uid() = user_id);

-- ad_media RLS
ALTER TABLE ad_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own media"
  ON ad_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ad_archives
      WHERE ad_archives.id = ad_media.ad_id
      AND ad_archives.user_id = auth.uid()
    )
  );

-- saved_searches RLS
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own searches"
  ON saved_searches FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- scrape_jobs RLS
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
  ON scrape_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs"
  ON scrape_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- user_search_history RLS
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history"
  ON user_search_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON user_search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);
