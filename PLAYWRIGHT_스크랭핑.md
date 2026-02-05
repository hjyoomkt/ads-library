# Playwright Meta Ad Library 스크래핑 성공 기록

**날짜**: 2026-02-03
**상태**: ✅ 완료

---

## 📊 최종 결과

### 성공 지표
- ✅ **HTML 초기 데이터**: 30개 광고 추출
- ✅ **GraphQL 스크롤**: 48개 응답, 457개 광고 추출
- ✅ **총 수집**: 487개 고유 광고
- ✅ **테스트 키워드**: "나이키" (한글)

---

## 🔍 발견된 핵심 사항

### 1. Meta는 두 가지 방식으로 광고 데이터 제공

#### 방식 A: HTML 초기 렌더링 (SSR)
- **위치**: `<script>` 태그 내부 JSON
- **개수**: 약 20~30개
- **추출 방법**:
  ```javascript
  const script = Array.from(document.querySelectorAll('script'))
    .find(s => s.textContent.includes('ad_archive_id'));
  const data = JSON.parse(script.textContent);
  ```

**데이터 구조**:
```javascript
{
  "require": [[
    "ScheduledServerJS", "handle", null, [{
      "__bbox": {
        "require": [[
          "RelayPrefetchedStreamCache@...", "next", [], [
            "adp_AdLibraryFoundationRootQueryRelayPreloader_...", {
              "__bbox": {
                "result": {
                  "data": {
                    "ad_library_main": {
                      "search_results_connection": {
                        "count": 28,
                        "edges": [...]
                      }
                    }
                  }
                }
              }
            }
          ]
        ]]
      }
    }]
  ]]
}
```

#### 방식 B: GraphQL 페이지네이션 (스크롤 시)
- **쿼리 이름**: `AdLibrarySearchPaginationQuery`
- **트리거**: 무한 스크롤
- **개수**: 스크롤당 약 9~10개 광고

**데이터 구조**:
```javascript
{
  "data": {
    "ad_library_main": {
      "search_results_connection": {
        "edges": [{
          "node": {
            "collated_results": [{
              "ad_archive_id": "...",
              "snapshot": { ... }
            }]
          }
        }]
      }
    }
  }
}
```

---

## 🛠️ 구현된 스크래핑 로직

### 파일: `backend/scrape-full.js`

```javascript
// 1. 페이지 열기 & 새로고침
await page.goto('https://www.facebook.com/ads/library/?...');
await page.waitForTimeout(3000);
await page.reload();
await page.waitForTimeout(5000);

// 2. HTML에서 초기 광고 추출
const htmlData = await page.evaluate(() => {
  const script = Array.from(document.querySelectorAll('script'))
    .find(s => s.textContent.includes('ad_archive_id'));
  return script ? script.textContent : null;
});

// 3. GraphQL 응답 리스너 설정
page.on('response', async res => {
  if (res.url().includes('graphql')) {
    const json = await res.json();
    const friendlyName = res.request().headers()['x-fb-friendly-name'];
    if (friendlyName === 'AdLibrarySearchPaginationQuery') {
      graphqlResponses.push(json);
    }
  }
});

// 4. 무한 스크롤
for (let i = 0; i < 50; i++) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);
}
```

---

## 📦 추출 가능한 광고 데이터 필드

### 필수 필드
```javascript
{
  ad_archive_id: "1984531405458859",
  page_name: "Nike Seoul",
  page_profile_uri: "https://www.facebook.com/nikeseoul/",
  is_active: true,
  start_date: 1770019200, // Unix timestamp
  end_date: 1770019200,
  publisher_platform: ["FACEBOOK", "INSTAGRAM", "MESSENGER"]
}
```

### 광고 크리에이티브
```javascript
{
  display_format: "DCO", // or "VIDEO", "IMAGE"
  cta_text: "지금 구매하기",
  link_url: "http://itunes.apple.com/app/id1095459556",

  // DCO 광고는 cards 배열 사용
  cards: [{
    title: "나이키 ACG 라바 플로우",
    body: "앱 첫 구매 시 15% 할인",
    original_image_url: "https://scontent-icn2-1.xx.fbcdn.net/...",
    resized_image_url: "https://scontent-icn2-1.xx.fbcdn.net/..."
  }],

  // VIDEO 광고
  videos: [{
    video_hd_url: "...",
    video_sd_url: "...",
    video_preview_image_url: "..."
  }],

  // IMAGE 광고
  images: [{
    original_image_url: "...",
    resized_image_url: "..."
  }]
}
```

### 통계 정보
```javascript
{
  impressions_with_index: {
    impressions_text: "<100",
    impressions_index: 0
  },
  reach_estimate: {
    lower_bound: null,
    upper_bound: null
  },
  spend: {
    lower_bound: null,
    upper_bound: null
  },
  currency: null
}
```

---

## ⚠️ 주요 이슈 및 해결

### 이슈 1: GraphQL 쿼리 이름 찾기
**문제**: 수많은 GraphQL 쿼리 중 광고 데이터를 포함한 쿼리 찾기
**해결**:
- `x-fb-friendly-name` 헤더 확인
- `AdLibrarySearchPaginationQuery`만 필터링

### 이슈 2: DCO 광고의 템플릿 문구
**문제**: `body.text: "{{product.brand}}"` 같은 템플릿
**해결**: `cards` 배열에서 실제 문구 추출

### 이슈 3: 중복 제거
**문제**: HTML + GraphQL에서 중복 광고
**해결**: `ad_archive_id` 기준으로 중복 제거

---

## 🎯 최적 스크래핑 설정

### 타이밍
- 초기 로딩: 3초
- 새로고침 후 대기: 5초
- 스크롤 간격: 2초
- 스크롤 횟수: 50회 (약 400~500개 광고)

### 안정성 개선
```javascript
// 1. User-Agent 설정
await context.addInitScript(() => {
  Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined
  });
});

// 2. 랜덤 대기 시간
const randomDelay = () =>
  Math.floor(Math.random() * 1000) + 2000;

// 3. 에러 처리
page.on('response', async res => {
  try {
    if (res.url().includes('graphql')) {
      const json = await res.json();
      // ...
    }
  } catch (e) {
    // JSON 파싱 실패는 무시
  }
});
```

---

## 📁 생성된 파일들

### 테스트 파일
- `backend/scrape-full.js` - 완전한 스크래핑 스크립트
- `backend/parse-html-ads.js` - HTML 파싱 전용
- `backend/capture-nike.js` - GraphQL 캡처 전용

### 데이터 파일
- `backend/initial-html-ads.json` - HTML 초기 30개
- `backend/graphql-1.json ~ graphql-48.json` - 각 GraphQL 응답
- `backend/all-ads-summary.json` - 전체 487개 요약

---

## ✅ 최종 구현 상태 (2026-02-03 완료)

### 1. 메인 스크래퍼 업데이트 ✅
**파일**: `backend/src/scrapers/metaAdLibrary.js`

**완료 사항**:
- ✅ HTML + GraphQL 하이브리드 방식 적용
- ✅ 자동 종료 기능 (5회 연속 새 데이터 없으면 중단)
- ✅ Supabase 저장 로직 (ad_archives, ad_media)
- ✅ 이미지 + 동영상 URL 추출
- ✅ 광고 링크 URL 필드 (ad_creative_link_url)
- ✅ 활성화 상태 저장 (is_active)
- ✅ Cloudinary 중복 방지 로직 (ad_id + position + original_url 체크)
- ✅ OCR 비활성화 (속도 개선)

### 2. 데이터 파싱 로직 ✅
- ✅ DCO 광고: `cards` 배열 처리
- ✅ VIDEO 광고: `videos` 배열 처리
- ✅ IMAGE 광고: `images` 배열 처리
- ✅ 중복 제거 (ad_archive_id 기준)

### 3. Cloudinary 중복 방지 로직 ✅
**파일**: `backend/src/scrapers/metaAdLibrary.js` (Line 372-449)

**로직**:
같은 광고(ad_id)의 같은 위치(position)에 같은 이미지(original_url)가 있으면 재사용:

```javascript
// 이미지 업로드 전 체크
const { data: existingMedia } = await supabase
  .from('ad_media')
  .select('cloudinary_public_id, media_url, ocr_text, ocr_confidence, metadata')
  .eq('ad_id', adData.id)
  .eq('position', position)
  .eq('original_url', imageUrl)
  .single();

if (existingMedia?.cloudinary_public_id) {
  // ♻️ 재사용
  console.log(`♻️ Reusing existing image`);
} else {
  // 새로 업로드
  const cloudinaryResult = await uploadMedia(imageUrl, 'image');
}
```

**효과**:
- 같은 광고 재수집 시 Cloudinary 재업로드 방지
- 다른 광고가 같은 이미지 사용 시 별도 업로드 (정상)

### 4. OCR 비활성화 ✅
**파일**: `backend/src/scrapers/metaAdLibrary.js` (Line 403-404)

**이유**: 처리 속도 개선 (이미지당 5-10초 소요)

```javascript
// OCR 비활성화 (속도 개선)
// const ocrResult = await extractTextFromImage(cloudinaryResult.url);

mediaItems.push({
  ocr_text: null,           // ocrResult.text
  ocr_confidence: null      // ocrResult.confidence
});
```

**참고**: 필요 시 별도 배치 스크립트로 OCR 처리 가능

### 5. 테스트 완료 ✅
- ✅ "시원스쿨" 키워드: 50개 광고 수집
- ✅ Cloudinary 중복 방지 작동 확인 (♻️ 로그)
- ✅ OCR 비활성화로 빠른 처리
- ✅ Supabase 저장 검증

---

## 🔧 중복 저장 로직 개선 (2026-02-04 완료)

### 문제점 발견
**이전 중복 판단:**
```
UNIQUE(platform, advertiser_name, ad_creative_body, started_running_date)
```

**문제:**
- 같은 광고주, 같은 텍스트, 같은 시작일 → 다른 광고인데 같은 것으로 취급
- Meta의 고유 ID(`ad_archive_id`) 미사용
- 결과: 2번째 광고가 1번째 광고를 덮어씌움 (데이터 손실)

**예시:**
```
광고 A (ad_archive_id: 123): 나이키 "50% 할인" + 이미지 X
광고 B (ad_archive_id: 456): 나이키 "50% 할인" + 이미지 Y

이전: B가 A를 덮어씌움 ❌
현재: A, B 각각 저장 ✅
```

### 해결 방법

**1. 데이터베이스 마이그레이션**
- `ad_archive_id` 컬럼 추가 (별도 컬럼으로 추출)
- UNIQUE CONSTRAINT 변경: `(platform, ad_archive_id)`

**2. 중복 체크 개선**
- `ad_archive_id` 기반 중복 판단
- 각 광고의 고유성 보장

**3. 재시도 로직 추가**
- 저장 실패 시 최대 3회 재시도 (1초 간격)
- 실패한 광고 추적 및 리포트

### 마이그레이션 파일
- `005_fix_ad_archive_id_uniqueness.sql` - ad_archive_id 컬럼 추가
- `006_fix_unique_constraint.sql` - UNIQUE CONSTRAINT 설정

---

## 📌 참고 링크

- [Meta Ad Library](https://www.facebook.com/ads/library/)
- [Playwright 문서](https://playwright.dev/)
- [테스트 결과 파일](./backend/all-ads-summary.json)

---

## ✅ 검증 완료

- [x] HTML 초기 데이터 추출
- [x] GraphQL 스크롤 데이터 캡처
- [x] 중복 제거 로직
- [x] 광고 데이터 파싱
- [x] 이미지 URL 추출
- [x] 메타데이터 (플랫폼, 날짜 등) 추출
