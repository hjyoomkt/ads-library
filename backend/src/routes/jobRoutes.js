import express from 'express';
import { scrapeQueue } from '../queues/scrapeQueue.js';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.get('/:jobId', requireAuth, async (req, res) => {
  try {
    const { jobId } = req.params;

    const { data: jobRecord, error: dbError } = await supabase
      .from('scrape_jobs')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (dbError || !jobRecord) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = await scrapeQueue.getJob(jobId);

    if (!job) {
      return res.json({
        jobId,
        status: jobRecord.status,
        progress: jobRecord.progress,
        totalAds: jobRecord.total_ads_saved,
        data: {
          searchType: jobRecord.search_type,
          searchQuery: jobRecord.search_query
        }
      });
    }

    const state = await job.getState();
    const progress = job.progress();

    res.json({
      jobId: job.id.toString(),
      status: state,
      progress: progress || 0,
      totalAds: jobRecord.total_ads_saved,
      data: job.data,
      createdAt: jobRecord.created_at,
      startedAt: jobRecord.started_at,
      completedAt: jobRecord.completed_at
    });
  } catch (error) {
    console.error('Get job status error:', error);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const { data, error } = await supabase
      .from('scrape_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

export default router;
