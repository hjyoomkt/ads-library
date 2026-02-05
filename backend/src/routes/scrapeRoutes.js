import express from 'express';
import { addScrapeJob } from '../queues/scrapeQueue.js';
import { requireAuth } from '../middleware/auth.js';
import { createJob } from '../services/dbService.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// 검색어 유효성 검증 함수
function validateSearchQuery(query) {
  if (!query || !query.trim()) {
    return { valid: false, error: 'Search query is required' };
  }

  const trimmed = query.trim();

  // 깨진 인코딩 감지 (제어 문자, 대체 문자 등)
  const hasInvalidChars = /[\uFFFD\u0000-\u001F\u007F-\u009F]/.test(trimmed);
  if (hasInvalidChars) {
    return { valid: false, error: 'Invalid characters detected. Please use valid Korean, English, or numbers only.' };
  }

  // 너무 짧거나 긴 검색어
  if (trimmed.length < 2) {
    return { valid: false, error: 'Search query must be at least 2 characters' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Search query must be less than 100 characters' };
  }

  // 유효한 문자만 포함 (한글, 영문, 숫자, 공백, 일부 특수문자)
  const validPattern = /^[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318Fa-zA-Z0-9\s\-_.&]+$/;
  if (!validPattern.test(trimmed)) {
    return { valid: false, error: 'Search query contains invalid characters. Please use Korean, English, numbers, spaces, or basic punctuation only.' };
  }

  return { valid: true, query: trimmed };
}

router.post('/keyword', requireAuth, async (req, res) => {
  try {
    const { keyword, platform = 'meta' } = req.body;

    // 검색어 유효성 검증
    const validation = validateSearchQuery(keyword);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const jobId = await addScrapeJob({
      searchType: 'keyword',
      searchQuery: validation.query,
      platform
    });

    // Create job record in database
    await createJob(jobId, 'keyword', validation.query);

    res.json({ jobId, status: 'pending' });
  } catch (error) {
    console.error('Scrape keyword error:', error);
    res.status(500).json({ error: 'Failed to start scraping job' });
  }
});

router.post('/advertiser', requireAuth, async (req, res) => {
  try {
    const { advertiser, platform = 'meta' } = req.body;

    // 검색어 유효성 검증
    const validation = validateSearchQuery(advertiser);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const jobId = await addScrapeJob({
      searchType: 'advertiser',
      searchQuery: validation.query,
      platform
    });

    // Create job record in database
    await createJob(jobId, 'advertiser', validation.query);

    res.json({ jobId, status: 'pending' });
  } catch (error) {
    console.error('Scrape advertiser error:', error);
    res.status(500).json({ error: 'Failed to start scraping job' });
  }
});

export default router;
