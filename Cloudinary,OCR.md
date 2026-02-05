# Cloudinary 업로드 & OCR 통합 완료 기록

**날짜**: 2026-02-03
**상태**: ✅ Cloudinary 완료, OCR 주석처리 (추후 활성화)

---

## 📊 최종 결과

### 업로드 통계
- **총 미디어**: 121개
- **이미지**: 100개 (100% 업로드 완료)
- **동영상**: 21개 (100% 업로드 완료)
- **성공률**: 100%

### 처리 시간
- 스크래핑: ~1-2분 (자동 종료 기능)
- Cloudinary 업로드: ~5-10분 (121개 미디어)
- **총 소요 시간**: ~10분

---

## 🏗️ 아키텍처

### 2단계 처리 방식

#### 1단계: 빠른 스크래핑
```javascript
// uploadToCloudinary: false (기본값)
await scrapeMetaAds({
  searchQuery: '시원스쿨',
  maxAds: 500,
  userId: userId,
  uploadToCloudinary: false  // 빠른 스크래핑
});
```

**결과**:
- 브라우저 열림 → 스크래핑 → 원본 URL 저장 → 브라우저 닫힘
- Meta 원본 URL이 ad_media 테이블에 저장
- 소요 시간: 1-2분

#### 2단계: Cloudinary 업로드
```javascript
// 별도 스크립트 실행
node upload-media-to-cloudinary.js
```

**결과**:
- ad_media에서 cloudinary_public_id가 NULL인 항목 조회
- Meta URL → Cloudinary 업로드
- media_url을 Cloudinary URL로 업데이트
- 소요 시간: 5-10분

---

## 📁 주요 파일

### 1. Cloudinary 서비스
**파일**: `backend/src/services/cloudinaryService.js`

**기능**:
```javascript
// 이미지 업로드
const result = await uploadImage(imageUrl, {
  folder: 'ads-library/images',
  adId: adId,
  position: 0
});

// 동영상 업로드
const result = await uploadVideo(videoUrl, {
  folder: 'ads-library/videos',
  adId: adId,
  position: 0
});
```

**반환값**:
- `url`: Cloudinary URL
- `publicId`: Cloudinary Public ID
- `format`, `width`, `height`, `bytes`
- `duration` (동영상만)

### 2. OCR 서비스 (주석처리)
**파일**: `backend/src/services/ocrService.js`

**기능** (추후 활성화 가능):
```javascript
const result = await extractTextFromImage(imageUrl, {
  lang: 'kor+eng',
  verbose: true
});
// Returns: { text, confidence, lang }
```

**상태**: 현재 주석처리
**이유**: 처리 시간이 오래 걸려 스크래핑 속도 저하

### 3. 업로드 스크립트
**파일**: `backend/upload-media-to-cloudinary.js`

**사용법**:
```bash
cd backend
node upload-media-to-cloudinary.js
```

**옵션**:
```javascript
uploadMediaToCloudinary({
  limit: 100,           // 한 번에 처리할 개수
  onlyPending: true     // cloudinary_public_id가 NULL인 것만
});
```

---

## 🗄️ 데이터베이스 스키마

### ad_media 테이블 컬럼

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | UUID | Primary Key |
| `ad_id` | UUID | ad_archives 외래 키 |
| `media_type` | TEXT | 'image' 또는 'video' |
| `media_url` | TEXT | **Cloudinary URL** ⭐ |
| `original_url` | TEXT | Meta 원본 URL |
| `cloudinary_public_id` | TEXT | Cloudinary Public ID |
| `position` | INTEGER | 광고 내 순서 |
| `metadata` | JSONB | width, height, format, bytes, duration |
| `ocr_text` | TEXT | OCR 추출 텍스트 (주석처리) |
| `ocr_confidence` | NUMERIC | OCR 정확도 (주석처리) |

### 마이그레이션
**파일**: `supabase/migrations/004_add_cloudinary_ocr_fields.sql`

```sql
ALTER TABLE ad_media
ADD COLUMN IF NOT EXISTS original_url TEXT,
ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT,
ADD COLUMN IF NOT EXISTS ocr_text TEXT,
ADD COLUMN IF NOT EXISTS ocr_confidence NUMERIC,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX idx_ad_media_cloudinary_id ON ad_media(cloudinary_public_id);
```

---

## 🔧 핵심 구현 로직

### 스크래퍼에서 미디어 저장

```javascript
// saveAdToSupabase 함수 내부
const mediaItems = [];

// 이미지 처리
for (const imageUrl of imageUrls) {
  if (uploadToCloudinary) {
    // Cloudinary 업로드
    const cloudinaryResult = await uploadMedia(imageUrl, 'image', { adId, position });
    mediaItems.push({
      ad_id: adId,
      media_type: 'image',
      media_url: cloudinaryResult.url,      // Cloudinary URL
      original_url: imageUrl,               // Meta URL
      cloudinary_public_id: cloudinaryResult.publicId,
      metadata: { width, height, format, bytes }
    });
  } else {
    // 원본 URL만 저장 (빠른 모드)
    mediaItems.push({
      ad_id: adId,
      media_type: 'image',
      media_url: imageUrl,
      original_url: imageUrl,
      position: position
    });
  }
}

// 동영상도 동일한 방식
```

### 별도 업로드 스크립트

```javascript
// 1. Cloudinary 업로드가 필요한 미디어 조회
const { data: mediaItems } = await supabase
  .from('ad_media')
  .select('id, ad_id, media_type, original_url, media_url, position')
  .is('cloudinary_public_id', null);  // 아직 업로드 안된 것만

// 2. 각 미디어 업로드
for (const media of mediaItems) {
  const sourceUrl = media.original_url || media.media_url;

  const cloudinaryResult = await uploadMedia(sourceUrl, media.media_type, {
    adId: media.ad_id,
    position: media.position
  });

  // 3. Supabase 업데이트
  await supabase
    .from('ad_media')
    .update({
      media_url: cloudinaryResult.url,
      original_url: sourceUrl,
      cloudinary_public_id: cloudinaryResult.publicId,
      metadata: { width, height, format, bytes, duration }
    })
    .eq('id', media.id);
}
```

---

## 🎯 Why Meta URL은 휘발성?

**문제**: Meta의 이미지/동영상 URL은 며칠 후 만료됨

**해결**: Cloudinary에 즉시 업로드하여 영구 보관

**플로우**:
```
Meta 스크래핑 → 원본 URL 저장 (며칠간 유효)
              ↓
         Cloudinary 업로드 (같은 날 또는 다음날)
              ↓
         영구 URL로 변경 ✅
```

---

## ⚠️ 트러블슈팅

### 이슈 1: original_url이 NULL인 항목들
**증상**: 12개 이미지의 original_url이 NULL
**원인**: 마이그레이션 이전에 생성된 레코드
**해결**:
```javascript
const sourceUrl = media.original_url || media.media_url;
```

### 이슈 2: OCR이 느림
**증상**: OCR 처리 시 브라우저 타임아웃
**원인**: 이미지당 5-10초 소요
**해결**: OCR 주석처리, 추후 별도 배치로 실행

### 이슈 3: Tesseract API 에러
**증상**: `logger is not a function`, `langsArr.map is not a function`
**원인**: Tesseract.recognize() API 잘못된 호출
**해결**:
```javascript
// Before (잘못됨)
Tesseract.recognize(imageUrl, { lang, logger })

// After (올바름)
Tesseract.recognize(imageUrl, lang, { logger })
```

---

## 📊 성능 최적화

### Before (Cloudinary 동시 실행)
- 스크래핑 + 업로드 동시 진행
- 브라우저 타임아웃 발생
- 실패 시 모든 작업 재시작

### After (2단계 분리)
- 1단계: 스크래핑 (1-2분) ✅
- 2단계: 업로드 (5-10분) ✅
- 각 단계 독립적으로 재실행 가능
- 전체 성공률 100%

---

## 🔮 OCR 활성화 방법 (추후)

### 1. upload-media-to-cloudinary.js 수정
```javascript
// 주석 해제
if (media.media_type === 'image') {
  console.log('   🔍 Running OCR...');
  const ocrResult = await extractTextFromImage(cloudinaryResult.url);

  updateData.ocr_text = ocrResult.text;
  updateData.ocr_confidence = ocrResult.confidence;
}
```

### 2. 별도 OCR 배치 스크립트 생성 (권장)
```javascript
// ocr-batch.js
const { data: images } = await supabase
  .from('ad_media')
  .select('id, media_url')
  .eq('media_type', 'image')
  .is('ocr_text', null);

for (const image of images) {
  const ocrResult = await extractTextFromImage(image.media_url);
  await supabase.from('ad_media').update({
    ocr_text: ocrResult.text,
    ocr_confidence: ocrResult.confidence
  }).eq('id', image.id);
}
```

---

## ✅ 검증 완료

### 테스트 결과
- ✅ 80개 광고 수집
- ✅ 121개 미디어 (이미지 100개, 동영상 21개)
- ✅ 100% Cloudinary 업로드 성공
- ✅ ad_media 테이블 정상 저장
- ✅ Cloudinary URL 정상 작동

### 검증 명령어
```bash
# 상태 확인
node check-media-status.js

# 미완료 항목 확인
node check-pending-media.js

# 업로드 실행
node upload-media-to-cloudinary.js
```

---

## 📝 다음 단계

1. **OCR 배치 처리** (선택사항)
   - 별도 스크립트로 OCR 실행
   - 백그라운드에서 천천히 처리

2. **Frontend 연동**
   - Cloudinary URL로 이미지/동영상 표시
   - OCR 텍스트 검색 기능

3. **Bull Queue 통합**
   - 스크래핑을 비동기 작업으로 처리
   - 진행 상황 실시간 표시

---

**작성**: 2026-02-03
**검증**: ✅ 완료
**상태**: 프로덕션 준비 완료
