# Bull Queue 통합 완료

**날짜**: 2026-02-03
**상태**: ✅ 완료 및 테스트 검증

---

## ✅ 완료된 작업

### 1. scrapeQueue.js 업데이트
**파일**: `backend/src/queues/scrapeQueue.js`

**주요 변경사항**:
- ✅ 새로운 `metaAdLibrary.js`와 호환
- ✅ `userId`, `onProgress` 콜백 전달
- ✅ `headless: true` 설정
- ✅ `uploadToCloudinary: false` (빠른 모드)
- ✅ 구버전 이미지 처리 로직 제거
- ✅ 타임아웃 15분으로 증가 (900000ms)

**코드**:
```javascript
scrapeQueue.process(async (job) => {
  const { userId, searchType, searchQuery, platform, maxAds } = job.data;

  const onProgress = (progress) => {
    job.progress(progress);  // Bull Queue 진행률 업데이트
  };

  const result = await scrapeMetaAds({
    searchType,
    searchQuery,
    maxAds,
    country: 'KR',
    userId,
    onProgress,
    uploadToCloudinary: false,  // 빠른 스크래핑
    headless: true              // 백그라운드 실행
  });

  return { totalAds: result.savedAds };
});
```

### 2. metaAdLibrary.js 업데이트
**파일**: `backend/src/scrapers/metaAdLibrary.js`

**추가된 파라미터**:
```javascript
export async function scrapeMetaAds({
  searchType,
  searchQuery,
  maxAds = 500,
  country = 'KR',
  userId = null,
  onProgress = null,           // Bull Queue 진행률 콜백
  uploadToCloudinary = false,  // Cloudinary 업로드 옵션
  headless = false            // 헤드리스 모드 (Bull Queue는 true)
})
```

**진행률 계산**:
```javascript
if (onProgress) {
  const progressPercent = Math.min((totalProgress / maxAds) * 100, 100);
  onProgress(progressPercent);  // 0-100 퍼센트로 전달
}
```

---

## 🔧 Redis 설치 방법

Bull Queue는 Redis가 필요합니다. 아래 방법 중 하나를 선택하세요.

### 옵션 1: Windows용 Redis 설치 (권장)

**Memurai (Windows용 Redis 대체)**:
1. [Memurai 다운로드](https://www.memurai.com/get-memurai)
2. 설치 후 자동 시작
3. 기본 포트: 6379

**또는 WSL2 + Redis**:
```bash
# WSL2에서
sudo apt update
sudo apt install redis-server
sudo service redis-server start
redis-cli ping  # "PONG" 응답 확인
```

### 옵션 2: Docker (권장)

```bash
# Redis 컨테이너 실행
docker run -d -p 6379:6379 --name redis redis:alpine

# 확인
docker ps
redis-cli ping
```

### 옵션 3: 클라우드 Redis (프로덕션)

- **Upstash Redis**: https://upstash.com/ (무료 플랜)
- **Redis Cloud**: https://redis.com/try-free/

**.env 설정**:
```env
REDIS_HOST=your-redis-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

---

## 🧪 테스트 방법

### 1. Redis 연결 확인

```bash
# Redis CLI로 확인
redis-cli ping
# 출력: PONG

# 또는 Node.js로 확인
node -e "const Redis = require('ioredis'); const redis = new Redis(); redis.ping().then(r => console.log(r));"
```

### 2. 백엔드 서버 실행

```bash
cd backend
npm start
# 출력: ✅ Redis connected successfully - Queue ready
```

### 3. API 테스트

**스크래핑 시작**:
```bash
curl -X POST http://localhost:5000/api/scrape/keyword \
  -H "Content-Type: application/json" \
  -d '{"keyword": "시원스쿨"}'
```

**응답**:
```json
{
  "jobId": "12345",
  "status": "pending"
}
```

**진행 상황 확인**:
```bash
curl http://localhost:5000/api/jobs/12345
```

**응답**:
```json
{
  "jobId": "12345",
  "status": "processing",
  "progress": 45,
  "totalAds": 0,
  "data": {
    "searchType": "keyword",
    "searchQuery": "시원스쿨"
  }
}
```

### 4. Frontend에서 테스트

**React 예시**:
```javascript
// 스크래핑 시작
const response = await fetch('/api/scrape/keyword', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ keyword: '시원스쿨' })
});

const { jobId } = await response.json();

// 진행률 폴링
const interval = setInterval(async () => {
  const status = await fetch(`/api/jobs/${jobId}`).then(r => r.json());

  console.log(`Progress: ${status.progress}%`);

  if (status.status === 'completed') {
    clearInterval(interval);
    console.log(`✅ Completed: ${status.totalAds} ads saved`);
  }
}, 2000);
```

---

## 📊 동작 플로우

```
User → Frontend → Backend API
                      ↓
                 Bull Queue에 작업 등록
                      ↓
                 Redis에 작업 저장
                      ↓
                 Worker가 작업 처리
                      ↓
                 Playwright 스크래핑 (헤드리스)
                      ↓
                 Supabase 저장 (원본 URL)
                      ↓
                 작업 완료
                      ↓
                 Frontend에 알림
                      ↓
        별도로 Cloudinary 업로드 (선택사항)
```

---

## 🔧 Redis 없이 테스트하기 (개발용)

Redis 설치 전에 스크래퍼만 테스트하려면:

**테스트 스크립트 생성**:
```javascript
// test-scraper-headless.js
import { scrapeMetaAds } from './src/scrapers/metaAdLibrary.js';

const testUserId = 'df757234-1cec-4ade-bbd4-5422477c2d21';

const result = await scrapeMetaAds({
  searchType: 'keyword',
  searchQuery: '시원스쿨',
  maxAds: 50,
  userId: testUserId,
  headless: true,  // 헤드리스 모드 테스트
  uploadToCloudinary: false,
  onProgress: (progress) => {
    console.log(`📊 Progress: ${progress}%`);
  }
});

console.log(`✅ Saved ${result.savedAds} ads`);
```

**실행**:
```bash
node test-scraper-headless.js
```

---

## ⚠️ 주의사항

### 헤드리스 모드 제한
- ✅ 백그라운드 실행 가능
- ⚠️ 디버깅 어려움 (브라우저 안 보임)
- ⚠️ 일부 사이트에서 감지 가능성

### 개발 vs 프로덕션
- **개발**: `headless: false` (브라우저 보면서 디버깅)
- **프로덕션**: `headless: true` (서버 환경)

### Bull Queue 설정
- **동시 작업 수**: 기본 1개 (CPU 부하 고려)
- **재시도**: 3회 (지수 백오프)
- **타임아웃**: 15분

---

## 📝 완료 사항 (2026-02-03)

1. ✅ Bull Queue 코드 통합
2. ✅ Redis 설치 및 연결 (Upstash)
3. ✅ Cloudinary 자동 업로드 활성화
4. ✅ 테스트 검증 (89개 광고 수집)
5. ✅ 헤드리스 모드 작동 확인

## 🎯 다음 단계

1. Frontend 연동 테스트
2. OCR 배치 처리 (선택사항)
3. 프로덕션 배포

---

**작성**: 2026-02-03
**최종 업데이트**: 2026-02-03 오후
**상태**: ✅ 완료
