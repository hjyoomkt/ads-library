import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkJobs() {
  const { data: jobs } = await supabase
    .from('scrape_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\n=== 최근 작업 5개 ===\n');
  jobs.forEach(job => {
    console.log(`Job ID: ${job.job_id}`);
    console.log(`검색어: ${job.search_query}`);
    console.log(`상태: ${job.status}`);
    console.log(`진행률: ${job.progress}%`);
    console.log(`생성: ${job.created_at}`);
    console.log('---\n');
  });
}

checkJobs();
