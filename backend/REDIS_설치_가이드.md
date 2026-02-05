# Redis 설치 가이드 (가장 빠른 방법)

## ✅ 방법 1: Upstash Redis (무료, 권장) - 5분

**장점**: 설치 불필요, 무료, 바로 사용 가능

### 1단계: Upstash 계정 생성
1. https://upstash.com 접속
2. "Get Started" 클릭
3. GitHub, Google 또는 이메일로 가입

### 2단계: Redis 데이터베이스 생성
1. 로그인 후 "Create Database" 클릭
2. 설정:
   - **Name**: `ads-library-redis`
   - **Type**: **Regional** (무료)
   - **Region**: **ap-northeast-1 (Tokyo)** (한국과 가장 가까움)
3. "Create" 클릭

### 3단계: 연결 정보 복사
데이터베이스 생성 후 나오는 정보:
```
UPSTASH_REDIS_REST_URL=https://xxxxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxx
```

**또는** "Redis" 탭에서:
```
Host: xxxxxxx.upstash.io
Port: 6379
Password: xxxxxxx
```

### 4단계: .env 파일 업데이트

**backend/.env** 파일에 추가:
```env
# Upstash Redis
REDIS_HOST=xxxxxxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-password-here
```

### 5단계: 테스트
```bash
cd backend
npm start
```

**출력**:
```
✅ Redis connected successfully - Queue ready
```

---

## 방법 2: Memurai (Windows 네이티브) - 10분

**장점**: Windows 네이티브, 빠름
**단점**: 다운로드 필요

### 1단계: Memurai 다운로드
1. https://www.memurai.com/get-memurai 접속
2. "Download Memurai" 클릭
3. 이메일 입력 후 다운로드

### 2단계: 설치
1. 다운로드한 `.msi` 파일 실행
2. 기본 설정으로 설치
3. 자동으로 서비스 시작됨

### 3단계: 확인
```bash
# PowerShell에서
memurai-cli ping
# 출력: PONG
```

### 4단계: .env 파일
**backend/.env**:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD는 불필요 (로컬)
```

---

## 방법 3: Docker Desktop - 15분

**장점**: 개발 환경에 적합
**단점**: Docker Desktop 설치 필요

### 1단계: Docker Desktop 설치
1. https://www.docker.com/products/docker-desktop/ 접속
2. Windows용 다운로드 및 설치
3. 설치 후 재부팅 필요할 수 있음

### 2단계: Redis 컨테이너 실행
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

### 3단계: 확인
```bash
docker ps
# redis 컨테이너 실행 중 확인

redis-cli ping
# 출력: PONG
```

### 4단계: .env 파일
**backend/.env**:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 🎯 권장 방법 비교

| 방법 | 설치 시간 | 장점 | 단점 | 프로덕션 |
|------|----------|------|------|---------|
| **Upstash** | 5분 | 설치 불필요, 무료 | 인터넷 필요 | ✅ 가능 |
| **Memurai** | 10분 | 빠름, 로컬 | Windows만 | ❌ 불가 |
| **Docker** | 15분 | 이식성 좋음 | Docker 필요 | ✅ 가능 |

---

## 🧪 연결 테스트

Redis 설정 후 테스트:

```bash
cd backend

# Node.js로 Redis 연결 테스트
node -e "import('ioredis').then(m => { const redis = new m.default({ host: process.env.REDIS_HOST || 'localhost', port: process.env.REDIS_PORT || 6379, password: process.env.REDIS_PASSWORD }); redis.ping().then(r => console.log('✅ Redis:', r)).catch(e => console.error('❌ Error:', e.message)); });"

# 또는 서버 실행
npm start
```

**성공 시 출력**:
```
✅ Redis connected successfully - Queue ready
🚀 Server running on port 5000
```

---

## ❌ 문제 해결

### "ECONNREFUSED" 에러
- Redis가 실행 중인지 확인
- .env 파일의 REDIS_HOST, REDIS_PORT 확인
- 방화벽 설정 확인

### Upstash "TLS" 에러
Bull Queue는 TLS를 자동 지원하지 않을 수 있음.

**해결**: scrapeQueue.js 수정
```javascript
export const scrapeQueue = new Bull('meta-ads-scrape', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined
  }
});
```

**.env**:
```env
REDIS_TLS=true  # Upstash는 true
```

---

**작성**: 2026-02-03
**권장**: Upstash (가장 빠르고 간단)
