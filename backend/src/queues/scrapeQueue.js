import Bull from 'bull';
import { scrapeMetaAds } from '../scrapers/metaAdLibrary.js';
import { updateJobStatus } from '../services/dbService.js';
import { supabase } from '../config/supabase.js';

export const scrapeQueue = new Bull('meta-ads-scrape', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined
  }
});

export async function addScrapeJob({ searchType, searchQuery, platform = 'meta', maxAds = 100 }) {
  const job = await scrapeQueue.add(
    {
      searchType,
      searchQuery,
      platform,
      maxAds
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000
      },
      timeout: 900000 // 15분 (Cloudinary 업로드 시간 고려)
    }
  );

  return job.id.toString();
}

scrapeQueue.process(async (job) => {
  const { searchType, searchQuery, platform, maxAds } = job.data;
  const jobId = job.id.toString();

  console.log(`\n🚀 Starting scrape job ${jobId} for "${searchQuery}"`);
  console.log(`   Search Type: ${searchType}`);
  console.log(`   Max Ads: ${maxAds}`);

  try {
    await updateJobStatus(jobId, 'processing');

    // 진행률 콜백
    const onProgress = (progress) => {
      job.progress(progress);
      console.log(`📊 Progress: ${progress}%`);
    };

    // 메타 광고 스크래핑 (Cloudinary 자동 업로드)
    const result = await scrapeMetaAds({
      searchType,
      searchQuery,
      maxAds,
      country: 'KR',
      onProgress,
      uploadToCloudinary: true, // Cloudinary 자동 업로드
      headless: false // 브라우저 표시 (디버깅용)
    });

    const savedCount = result.savedAds || 0;
    const newCount = result.newAds || 0;
    const updatedCount = result.updatedAds || 0;
    const failedCount = result.failedAds || 0;

    console.log(`✅ Scraping completed!`);
    console.log(`   New: ${newCount}`);
    console.log(`   Updated: ${updatedCount}`);
    if (failedCount > 0) {
      console.log(`   Failed: ${failedCount}`);
    }

    // Job 완료 상태 업데이트
    await updateJobStatus(jobId, 'completed', savedCount);
    console.log(`✅ Job ${jobId} completed: ${newCount} new, ${updatedCount} updated${failedCount > 0 ? `, ${failedCount} failed` : ''}\n`);

    return {
      totalAds: savedCount,
      newAds: newCount,
      updatedAds: updatedCount,
      failedAds: failedCount
    };

  } catch (error) {
    console.error(`❌ Job ${jobId} failed:`, error);
    await updateJobStatus(jobId, 'failed');
    throw error;
  }
});

scrapeQueue.on('completed', (job, result) => {
  const summary = `${result.newAds || 0} new, ${result.updatedAds || 0} updated`;
  const failed = result.failedAds > 0 ? `, ${result.failedAds} failed` : '';
  console.log(`✅ Job ${job.id} completed: ${summary}${failed}`);
});

scrapeQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

// Redis 연결 상태 모니터링
scrapeQueue.on('error', (error) => {
  console.error('❌ Redis connection error:', error.message);
});

scrapeQueue.on('ready', () => {
  console.log('✅ Redis connected successfully - Queue ready');
});
