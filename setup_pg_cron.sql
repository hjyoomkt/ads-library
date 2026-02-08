-- pg_cron을 사용한 Supabase Keep-Alive 설정
-- Supabase Dashboard → SQL Editor에서 실행하세요

-- 1. pg_cron extension 활성화 (Dashboard → Extensions에서도 가능)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Keep Alive 테이블 생성
CREATE TABLE IF NOT EXISTS keep_alive_log (
  id SERIAL PRIMARY KEY,
  last_ping TIMESTAMP DEFAULT NOW()
);

-- 3. 크론잡 생성 - 매일 새벽 3시 실행
SELECT cron.schedule(
  'keep-alive-job',       -- 작업 이름
  '0 3 * * *',            -- 크론 표현식: 매일 새벽 3시
  $$
  INSERT INTO keep_alive_log (last_ping) VALUES (NOW());
  DELETE FROM keep_alive_log WHERE last_ping < NOW() - INTERVAL '30 days';
  $$
);

-- 4. 크론잡 확인
SELECT * FROM cron.job;

-- 5. (옵션) 크론 실행 히스토리 확인
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- 6. (옵션) 크론잡 삭제
-- SELECT cron.unschedule('keep-alive-job');

-- 크론 표현식 예시:
-- '0 3 * * *'       - 매일 새벽 3시
-- '0 */12 * * *'    - 12시간마다 (0시, 12시)
-- '*/30 * * * *'    - 30분마다
-- '0 0 * * 0'       - 매주 일요일 자정
--
-- 주의사항:
-- 1. pg_cron은 UTC 시간대를 사용합니다
-- 2. Supabase 무료 버전에서도 사용 가능합니다
-- 3. 외부 서버나 추가 설정이 필요 없습니다
