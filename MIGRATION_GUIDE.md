# Migration 005: ad_archive_id 중복 문제 해결

## 문제점

### 이전 중복 판단 로직
```javascript
onConflict: 'platform,advertiser_name,ad_creative_body,started_running_date,user_id'
```

**문제:**
- Meta의 고유 ID(`ad_archive_id`)를 사용하지 않음
- 같은 광고주가 같은 텍스트로 같은 날 시작한 광고는 모두 **같은 광고로 간주**
- 실제로는 **다른 광고**인데 (타겟팅, 이미지, 영상 다름) 기존 데이터가 **덮어씌워짐**

### 예시
```
나이키가 2025-01-15에 "50% 할인" 광고 2개 집행:
  - 광고 A (ad_archive_id: 123): 남성용 신발 이미지
  - 광고 B (ad_archive_id: 456): 여성용 신발 이미지

이전: 광고 B가 광고 A를 덮어씌움 ❌
현재: 광고 A, B 모두 개별 저장 ✅
```

## 해결 방법

### 1. 데이터베이스 마이그레이션

Supabase SQL Editor에서 실행:

```sql
-- 파일: supabase/migrations/005_fix_ad_archive_id_uniqueness.sql
-- 전체 내용 복사해서 실행
```

**마이그레이션 내용:**
1. 기존 UNIQUE constraint 제거
2. `ad_archive_id` 컬럼 추가
3. 기존 데이터에서 `ad_archive_id` 추출 (JSONB → 별도 컬럼)
4. 새로운 UNIQUE constraint 설정: `(platform, ad_archive_id, user_id)`

### 2. 기존 데이터 확인

마이그레이션 후 검증:

```sql
-- 1. ad_archive_id가 추출되었는지 확인
SELECT platform, COUNT(*), COUNT(ad_archive_id)
FROM ad_archives
GROUP BY platform;

-- 예상 결과:
--  platform | count | count (ad_archive_id)
-- ----------+-------+----------------------
--  meta     |   100 |   100  ← 모두 추출되어야 함
```

```sql
-- 2. 중복 ad_archive_id 확인 (같은 user_id 내에서)
SELECT ad_archive_id, user_id, COUNT(*)
FROM ad_archives
WHERE platform = 'meta' AND ad_archive_id IS NOT NULL
GROUP BY ad_archive_id, user_id
HAVING COUNT(*) > 1;

-- 예상 결과: 0 rows (중복 없어야 함)
```

### 3. 중복 데이터 처리 (필요시)

만약 중복이 발견되면:

```sql
-- 중복 데이터 중 최신 것만 남기고 삭제
WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY platform, ad_archive_id, user_id
      ORDER BY created_at DESC
    ) as rn
  FROM ad_archives
  WHERE platform = 'meta' AND ad_archive_id IS NOT NULL
)
DELETE FROM ad_archives
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
```

## 변경 사항 요약

### 데이터베이스
- ✅ `ad_archive_id` 별도 컬럼 추가
- ✅ UNIQUE constraint 변경: `ad_archive_id` 기반
- ✅ 인덱스 추가: 성능 최적화

### 코드
- ✅ [metaAdLibrary.js:309-317](backend/src/scrapers/metaAdLibrary.js#L309-L317): `ad_archive_id` 기반 중복 체크
- ✅ [metaAdLibrary.js:364](backend/src/scrapers/metaAdLibrary.js#L364): `ad_archive_id` 별도 저장
- ✅ [metaAdLibrary.js:389](backend/src/scrapers/metaAdLibrary.js#L389): `onConflict` 조건 변경

### 동작 변경
**이전:**
```
Job 8 completed: 5 ads saved
→ 실제: 3개 새로 저장, 2개는 덮어씌워짐 ❌
```

**현재:**
```
✅ Save Results:
   New: 5
   Updated: 0
   Failed: 0

✅ Job 8 completed: 5 new, 0 updated
→ 5개 모두 개별 저장 ✅
```

## 마이그레이션 실행 순서

1. **백엔드 중지**
   ```bash
   # 현재 실행 중인 백엔드 중지 (Ctrl+C)
   ```

2. **데이터베이스 마이그레이션**
   - Supabase Dashboard → SQL Editor 열기
   - `005_fix_ad_archive_id_uniqueness.sql` 파일 내용 복사
   - 실행

3. **검증**
   ```sql
   -- 위의 검증 쿼리 실행
   ```

4. **백엔드 재시작**
   ```bash
   cd "c:\Users\REON\Desktop\새 폴더\ads-library\backend"
   npm start
   ```

5. **테스트**
   - 새 스크래핑 작업 실행
   - 같은 광고주, 같은 텍스트의 광고가 개별 저장되는지 확인

## 롤백 (문제 발생 시)

```sql
-- 1. 새로운 constraint 제거
DROP INDEX IF EXISTS unique_meta_ad_archive_id;
DROP INDEX IF EXISTS unique_other_platform_ads;

-- 2. 기존 constraint 복원
ALTER TABLE ad_archives
ADD CONSTRAINT ad_archives_platform_advertiser_name_ad_creative_body_start_key
UNIQUE(platform, advertiser_name, ad_creative_body, started_running_date, user_id);

-- 3. ad_archive_id 컬럼 제거 (선택사항)
ALTER TABLE ad_archives DROP COLUMN IF EXISTS ad_archive_id;
```

## 주의사항

- 마이그레이션 실행 중에는 스크래핑 작업을 중단해야 합니다
- 기존 데이터가 많으면 마이그레이션에 시간이 걸릴 수 있습니다
- 백업을 권장합니다 (Supabase Dashboard → Database → Backups)
