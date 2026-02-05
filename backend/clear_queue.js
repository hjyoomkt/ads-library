import Bull from 'bull';
import dotenv from 'dotenv';

dotenv.config();

const scrapeQueue = new Bull('meta-ads-scrape', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined
  }
});

async function clearQueue() {
  console.log('🧹 Clearing all jobs from queue...');

  // 모든 작업 중단 및 제거
  await scrapeQueue.clean(0, 'active');
  await scrapeQueue.clean(0, 'wait');
  await scrapeQueue.clean(0, 'delayed');
  await scrapeQueue.clean(0, 'paused');

  // 실행 중인 모든 작업 중단
  const activeJobs = await scrapeQueue.getActive();
  for (const job of activeJobs) {
    await job.remove();
    console.log(`❌ Removed active job ${job.id}`);
  }

  const waitingJobs = await scrapeQueue.getWaiting();
  for (const job of waitingJobs) {
    await job.remove();
    console.log(`❌ Removed waiting job ${job.id}`);
  }

  console.log('✅ Queue cleared!');
  process.exit(0);
}

clearQueue().catch(console.error);
