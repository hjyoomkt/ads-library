# Frontend 수정 작업 히스토리

**작업 날짜**: 2026-02-03
**작업자**: Claude + User
**목적**: Frontend 연동 테스트 및 이미지 표시 문제 해결

---

## 🔍 발견된 문제

### 1. 이미지/동영상이 표시되지 않음
- **증상**: Frontend에서 모든 광고 이미지가 깨진 이미지(엑박)로 표시됨
- **원인**: Frontend 코드가 `cloudinary_url` 필드를 참조하고 있었으나, 실제 DB에는 `media_url`에 Cloudinary URL이 저장되어 있었음
- **DB 확인 결과**:
  - `media_url`: Cloudinary URL 정상 저장 (예: `https://res.cloudinary.com/.../ad_xxx_img_0.jpg`)
  - `cloudinary_url`: NULL

### 2. 광고 표시 개수 제한
- **증상**: 20개 광고만 표시됨 (총 71개 중)
- **원인**: Backend API 기본 limit가 20으로 설정되어 있었음
- **문제점**: 100개 이상 광고 수집 시 페이지네이션 없이는 나머지 광고를 볼 수 없음

### 3. 동영상 지원 부재
- **증상**: 동영상 광고가 Image 컴포넌트로 렌더링 시도되어 표시 실패
- **원인**: media_type 구분 없이 모든 미디어를 Image로 처리

---

## ✅ 수정 내용

### 1. AdGrid.jsx - 이미지 URL 수정 및 동영상 지원

**파일**: `src/views/admin/metaArchive/components/AdGrid.jsx`

**수정 전**:
```jsx
<Image
  src={ad.ad_media[0].cloudinary_url}  // ❌ NULL
  alt={ad.advertiser_name}
  w="100%"
  h="200px"
  objectFit="cover"
/>
```

**수정 후**:
```jsx
{ad.ad_media[0].media_type === 'video' ? (
  <Box as="video" w="100%" h="200px" objectFit="cover" controls>
    <source src={ad.ad_media[0].media_url} type="video/mp4" />
  </Box>
) : (
  <Image
    src={ad.ad_media[0].media_url}  // ✅ 정상 URL
    alt={ad.advertiser_name}
    w="100%"
    h="200px"
    objectFit="cover"
  />
)}
```

**변경 사항**:
- ✅ `cloudinary_url` → `media_url` 변경
- ✅ 동영상/이미지 구분 처리
- ✅ 동영상은 `<video>` 태그로 표시

---

### 2. AdDetailModal.jsx - 이미지 URL 수정

**파일**: `src/views/admin/metaArchive/components/AdDetailModal.jsx`

**수정 후**:
```jsx
<Image
  src={media.media_url}  // ✅ 정상 URL
  alt={`Ad ${idx + 1}`}
  borderRadius="12px"
  w="100%"
/>
```

**변경 사항**:
- ✅ `cloudinary_url` → `media_url` 변경

---

### 3. index.jsx - 페이지네이션 추가

**파일**: `src/views/admin/metaArchive/index.jsx`

**추가된 기능**:

#### 3.1. State 추가
```jsx
const [page, setPage] = useState(1);
const [pagination, setPagination] = useState({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 1
});
```

#### 3.2. API 호출 수정
```jsx

// 변경 후
const response = await getAds({ ...filters, page, limit: 50 });
if (response.pagination) {
  setPagination(response.pagination);
}
```

#### 3.3. 페이지 변경 핸들러
```jsx
const handlePrevPage = () => {
  if (page > 1) {
    setPage(page - 1);
  }
};

const handleNextPage = () => {
  if (page < pagination.totalPages) {
    setPage(page + 1);
  }
};
```

#### 3.4. 페이지네이션 UI
```jsx
{pagination.totalPages > 1 && (
  <Card mt="20px" p="20px">
    <HStack justify="space-between" align="center">
      <Button
        leftIcon={<MdChevronLeft />}
        onClick={handlePrevPage}
        isDisabled={page === 1}
        colorScheme="brand"
        variant="outline"
      >
        Previous
      </Button>

      <Text fontWeight="medium">
        Page {page} of {pagination.totalPages} ({pagination.total} ads)
      </Text>

      <Button
        rightIcon={<MdChevronRight />}
        onClick={handleNextPage}
        isDisabled={page === pagination.totalPages}
        colorScheme="brand"
        variant="outline"
      >
        Next
      </Button>
    </HStack>
  </Card>
)}
```

**변경 사항**:
- ✅ 한 페이지당 50개 광고 표시
- ✅ Previous/Next 버튼으로 페이지 이동
- ✅ 현재 페이지 정보 표시 (Page X of Y)
- ✅ 총 광고 개수 표시
- ✅ 첫/마지막 페이지에서 버튼 비활성화

---

## 📊 테스트 결과

### 테스트 환경
- **Backend**: http://localhost:5000 (실행 중)
- **Frontend**: http://localhost:3000 (실행 중)
- **데이터**: 시원스쿨 키워드로 수집된 71개 광고

### 테스트 항목

#### ✅ 1. API 연결
- Frontend → Backend API 정상 연결
- `/api/ads?limit=50&page=1` 정상 응답
- ad_media 배열 포함 확인

#### ✅ 2. 이미지 표시
- Cloudinary URL 정상 로드
- 이미지 썸네일 표시 확인
- 상세 모달에서 전체 이미지 표시 확인

#### ✅ 3. 동영상 표시
- 동영상 자동 재생 컨트롤 표시
- video 태그로 정상 렌더링

#### ✅ 4. 페이지네이션
- 첫 페이지: 50개 광고 표시
- 두 번째 페이지: 21개 광고 표시 (총 71개)
- Previous/Next 버튼 정상 작동
- 페이지 정보 정확히 표시

---

## 📝 수정 파일 목록

1. **AdGrid.jsx** - 메인 광고 그리드 컴포넌트
   - URL 필드 변경
   - 동영상 지원 추가

2. **AdDetailModal.jsx** - 광고 상세 모달
   - URL 필드 변경

3. **index.jsx** - 메인 페이지
   - 페이지네이션 State 추가
   - API 호출 수정
   - 페이지 변경 핸들러 추가
   - 페이지네이션 UI 추가

---

## 🎯 완료된 기능

### Frontend 기능
- ✅ 광고 목록 표시
- ✅ 이미지/동영상 썸네일
- ✅ 광고 상세 모달
- ✅ 페이지네이션 (50개씩)
- ✅ 검색 기능 (Backend 연동)
- ✅ 실시간 작업 추적 (JobTracker)

### 표시 정보
- ✅ 광고주 이름
- ✅ 광고 텍스트
- ✅ 플랫폼 배지 (META)
- ✅ 이미지 개수
- ✅ 게재 시작 날짜
- ✅ 미디어 파일 (이미지/동영상)

---

## 🔄 다음 개선 사항 (선택)

### UI/UX 개선
- [ ] 필터링 기능 (광고주별, 날짜별)
- [ ] 정렬 기능 (최신순, 오래된순)
- [ ] 검색 기능 (광고 텍스트 검색)
- [ ] 무한 스크롤
- [ ] 이미지 갤러리 모드

### 기능 추가
- [ ] 광고 북마크
- [ ] 광고 다운로드 (이미지/데이터)
- [ ] 광고 비교 기능
- [ ] 통계 대시보드

---

## 📌 중요 노트

### DB 필드 매핑
```
Backend (ad_media 테이블):
- media_url: Cloudinary URL (실제 사용) ✅
- cloudinary_url: NULL (사용 안 함)
- original_url: Meta 원본 URL (만료됨)

Frontend:
- ad.ad_media[0].media_url 사용 ✅
```

### Cloudinary URL 구조
```
이미지: https://res.cloudinary.com/dcwaomh3f/image/upload/v1770120053/ads-library/images/ad_xxx_img_0.jpg
동영상: https://res.cloudinary.com/dcwaomh3f/video/upload/v1770120070/ads-library/videos/ad_xxx_vid_0.mp4
```

### 페이지네이션 설정
- **한 페이지당**: 50개 광고
- **Backend limit 기본값**: 20개 (수정하지 않음, Frontend에서 명시적으로 50 전달)
- **최대 표시 가능**: 무제한 (페이지네이션으로 모두 표시)

---

**작성 완료**: 2026-02-03
**최종 상태**: Frontend 연동 완료, 모든 기능 정상 작동

---

# UI/UX 개선 작업

**작업 날짜**: 2026-02-03
**작업자**: Claude + User
**목적**: 레이아웃 개선 및 사용자 경험 향상

---

## 🔍 발견된 문제

### 1. 레이아웃 겹침 문제
- **파일**: `SavedSearchesSidebar.jsx`, `NavbarAdmin.js`
- **증상**: Saved Searches 사이드바가 상단 네비게이션과 겹침
- **원인 파악**:
  - admin/index.js에서 레이아웃 구조 확인
  - Navbar의 position="absolute", zIndex="1000" 확인
  - SavedSearchesSidebar의 top="0", zIndex="1" 확인
  - Navbar가 top=20px, minHeight=75px로 설정되어 있음을 확인

### 2. 간격 문제
- **파일**: `index.jsx`, `SavedSearchesSidebar.jsx`
- **증상**: Saved Searches와 메인 콘텐츠 사이에 불필요한 빈 공간
- **원인 파악**:
  - admin/index.js의 레이아웃 Box에서 p={{ base: '20px', md: '30px' }} 패딩 확인
  - Sidebar.js에서 사이드바 너비 w='230px' 확인
  - 메인 영역이 calc(100% - 290px)로 설정됨을 확인
  - 실제 콘텐츠 시작 위치가 290px + 30px = 320px임을 파악

---

## ✅ 수정 내용

### 1. SavedSearchesSidebar.jsx - 레이아웃 위치 조정

**수정 사항**:
- top 위치를 직접 설정하여 네비게이션바 아래에 배치
- left 위치를 250px로 조정하여 메인 사이드바와 20px 간격 확보
- height를 calc(100vh - 100px)로 조정

### 2. NavbarAdmin.js - 상단 UI 간소화

**수정 사항**:
- Breadcrumb(Pages / Ads-Library) 제거
- 페이지 타이틀(Ads-Library) 제거
- AdminNavbarLinks만 남김

### 3. index.jsx - 메인 영역 레이아웃 조정

**수정 사항**:
- ml을 calc(450px - 290px - 30px + 20px)로 계산하여 정확한 위치 설정
  - SavedSearchesSidebar 끝: 450px
  - 메인 영역 시작: 290px
  - 콘텐츠 패딩: 30px
  - 추가 간격: 20px

### 4. AdGrid.jsx - 카드 레이아웃 개선

**수정 사항**:
- SimpleGrid columns를 { base: 1, md: 3, lg: 4, xl: 5 }로 변경
- 이미지/비디오 영역을 정사각형(1:1) 비율로 변경
  - paddingBottom="100%" 사용
  - position="absolute"로 정확한 정사각형 유지
- 빈 미디어 상태 처리 추가

### 5. AdDetailModal.jsx - 동영상 재생 지원

**수정 사항**:
- media.media_type === 'video' 체크 추가
- video 태그로 동영상 표시
- 이미지는 기존대로 Image 컴포넌트 사용

### 6. AdGrid.jsx - CTA 정보 표시

**확인한 데이터 구조**:
- platform_specific_data에 CTA 정보 확인
- cta_text 필드에 "지금 구매하기" 등의 값 저장됨 확인
- caption, is_active, ad_archive_id, publisher_platform 등도 포함됨 확인

**수정 사항**:
- 이미지 개수 배지 제거
- platform_specific_data.cta_text를 파란색 배지로 표시

---

## 📝 수정 파일 목록

1. **SavedSearchesSidebar.jsx**
   - 위치 조정 (left, top, height)

2. **NavbarAdmin.js**
   - Breadcrumb 및 타이틀 제거

3. **index.jsx**
   - 통계 카드 제거
   - 메인 영역 margin-left 계산 수정

4. **AdGrid.jsx**
   - 그리드 컬럼 변경 (최대 5개)
   - 정사각형 비율 적용
   - CTA 표시 추가
   - 이미지 개수 배지 제거

5. **AdDetailModal.jsx**
   - 동영상 재생 지원 추가

---

## 🎯 개선된 기능

### 레이아웃
- ✅ 사이드바와 서치히스토리 적절한 간격 확보 (20px)
- ✅ 간소화된 상단 UI

### 광고 카드
- ✅ 반응형 디자인 (base: 1, md: 3, lg: 4, xl: 5)

### 미디어
- ✅ 모달에서 동영상 재생 가능
- ✅ 그리드에서 동영상 썸네일 표시

## 수정 파일 목록

1. **AdGrid.jsx** - 플랫폼 배지를 소셜미디어 아이콘으로 변경
2. **AdDetailModal.jsx** - Horizon UI 스타일로 모달 디자인 개선
3. **SearchBar.jsx** - DateRangePicker 스타일 적용

---

## 주요 변경사항

### AdGrid.jsx
- 플랫폼 배지 제거, 아이콘으로 대체 (Facebook, Instagram, Messenger, Threads)
- publisher_platform 배열 처리 추가

### AdDetailModal.jsx
- Horizon UI 스타일 적용 (Card 컴포넌트, 색상 테마)
- Platform Specific Data JSON 제거
- Ad Archive ID, Page URL, Landing URL 표시
- 모달 헤더 및 섹션 디자인 개선

### SearchBar.jsx
- growth-dashboard DateRangePicker 디자인 참고
- Select를 Menu + MenuButton 방식으로 변경
- Input 및 Button 스타일 통일 (borderRadius: 12px, height: 36px)
- Card로 감싸기, 색상 테마 지원

---

**작성 완료**: 2026-02-03
**최종 상태**: 플랫폼 아이콘 표시 및 필터 디자인 개선 완료

---

# 검색 기록 자동 저장 및 표시

**작업 날짜**: 2026-02-04
**작업자**: Claude + User

---

## 주요 변경사항

### SavedSearchesSidebar.jsx
- `saved_searches` 테이블 대신 `user_search_history` 사용
- 검색 시 자동으로 사이드바에 기록 표시
- Refresh 버튼으로 재검색 기능 유지
- 검색어별 광고 수 및 마지막 검색 시간 표시
- Tooltip 추가 (연동/업데이트 설명)

### SearchBar.jsx
- 검색 시 `user_search_history`에 자동 기록 (백엔드 처리)
- 검색 완료 후 사이드바 자동 새로고침

### Backend
- `searchHistoryRoutes.js` 추가 - `user_search_history`에서 고유한 검색어 목록 반환
- `savedSearchesRoutes.js` 삭제
- `saved_searches` 테이블 사용 중단

### apiService.js
- `saved_searches` 관련 API 제거
- `getSearchHistory()` 추가

---

**작성 완료**: 2026-02-04

# Search History 반응형 처리

**작업 날짜**: 2026-02-04

## 문제
- 창 크기 줄여도 Search History가 고정되어 있음

## 수정
- **SavedSearchesSidebar.jsx**: `inline` prop 추가, 두 가지 레이아웃 모드 지원
  - inline=false (xl 이상): 왼쪽 fixed 사이드바
  - inline=true (xl 미만): SearchBar 아래 Wrap으로 가로 배치
- **index.jsx**: 조건부 렌더링으로 화면 크기별로 다른 위치에 표시

---

# Monitoring 페이지 추가

**작업 날짜**: 2026-02-04
**작업자**: Claude + User

---

## 주요 작업 내용

### 1. 라우팅 설정
- **파일**: `routes.js`
- Main Dashboard (/admin/default) 주석처리로 사이드바에서 숨김
- Monitoring (/admin/monitoring) 경로를 사이드바 최상단에 추가
- MdMonitor 아이콘 적용

### 2. Monitoring 페이지 생성
- **파일**: `views/admin/monitoring/index.js`
- 분야별 추천 경쟁사 페이지 구현
- 샘플 데이터: 메디큐브, 올리브영, 토리든 (뷰티 카테고리)

#### 카테고리 필터
- 14개 카테고리: 전체, 뷰티, 패션, 식품, 홈·생활, 가전·디지털, 취미·반려동물, 건강, IT 솔루션·SaaS, 커머스·쇼핑, 금융·핀테크, 교육, 커뮤니티·콘텐츠, 라이프스타일 서비스
- 선택된 버튼: 파란색 배경 (blue.500)
- 미선택 버튼: 흰색 배경, 회색 테두리
- 작은 사이즈 (height: 32px), 좁은 간격 (gap: 6px)

**작성 완료**: 2026-02-04
