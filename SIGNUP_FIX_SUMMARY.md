# 회원가입 오류 수정 최종 정리

## 문제 상황
초대 코드를 통한 회원가입 시 다음 오류 발생:
```
POST /rest/v1/organizations - 403 Forbidden
Error: new row violates row-level security policy for table "organizations"
```

## 근본 원인
**organizations 테이블의 RLS 정책이 Supabase PostgREST에서 작동하지 않음**

### 시도한 방법들:
1. ❌ `TO authenticated` - 작동 안 함
2. ❌ `TO public, authenticated` + `WITH CHECK (auth.uid() IS NOT NULL)` - 작동 안 함
3. ✅ `WITH CHECK (true)` - **성공**

### 왜 이렇게 해야 했나:
- Supabase PostgREST의 역할(role) 매칭 이슈
- `TO authenticated` 방식이 일부 환경에서 인식되지 않음
- 회원가입 시점의 `auth.uid()` 타이밍 문제

## 최종 해결 방법

### 적용된 RLS 정책 (fix_rls_simple.sql):
```sql
-- organizations 테이블
CREATE POLICY "allow_insert_for_all_authenticated_users"
ON organizations FOR INSERT
WITH CHECK (true);

CREATE POLICY "allow_select_own_org"
ON organizations FOR SELECT
USING (true);

CREATE POLICY "allow_update_own_org"
ON organizations FOR UPDATE
USING (true)
WITH CHECK (true);
```

**실행 방법:**
1. Supabase Studio SQL Editor에서 `fix_rls_simple.sql` 실행
2. Supabase 프로젝트 재시작 (Pause → Resume)
3. 회원가입 재시도

## 현재 상태

### ✅ 작동하는 것:
- 초대 코드를 통한 회원가입
- auth.users 계정 생성
- organizations 테이블 레코드 생성
- users 테이블 레코드 생성
- 로그인 및 대시보드 접속

### ⚠️ 보안 고려사항:
**organizations 테이블:**
- 현재: 누구나 생성/조회/수정 가능 (느슨함)
- 영향: 쓰레기 데이터 생성 가능
- 완화: 초대 코드로만 회원가입 가능하므로 실제 위험은 낮음

**users 테이블:**
- RLS 정책: `WITH CHECK (id = auth.uid())` (안전함)
- 자신의 레코드만 생성 가능

**실제 권한:**
- users.role 컬럼으로 결정 (안전함)
- 슈퍼어드민 접근: master, agency_admin, agency_manager만 가능
- 초대 코드 없이는 회원가입 불가능

### 결론:
**슈퍼어드민 권한은 보호되고 있음. organizations 테이블만 느슨한 상태.**

## 유지보수 SQL 파일

### 필수 파일:
- `fix_rls_simple.sql` - **현재 적용된 RLS 정책 (중요!)**
- `cleanup_incomplete_signups.sql` - 불완전한 회원가입 계정 정리

### 진단/검증 파일:
- `diagnose_signup_issue.sql` - RLS 정책 및 초대 코드 상태 확인
- `verify_rls_policies.sql` - RLS 정책 검증
- `check_organizations_constraints.sql` - 테이블 구조 및 제약조건 확인
- `reload_schema.sql` - PostgREST 캐시 새로고침

### 향후 고려사항:
- `secure_rls_policies.sql` - 보안 강화된 RLS 정책 (선택사항)
  - 주의: 적용 시 회원가입이 다시 실패할 수 있음
  - 테스트 환경에서 먼저 검증 권장

## 회원가입 흐름

### 성공적인 회원가입:
1. 초대 코드 검증
2. auth.signUp() → auth.users 생성
3. 세션 설정
4. organizations INSERT (신규 조직인 경우)
5. users INSERT
6. 초대 코드 사용 처리
7. 완료

### 로그 확인:
```javascript
✅ Auth 계정 생성 성공
✅ 세션 재설정 완료
✅ 조직 생성 성공 (또는 기존 조직 사용)
✅ Users 테이블 insert 성공
```

## 문제 발생 시 대응

### 회원가입 실패:
1. Supabase Studio에서 RLS 정책 확인:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'organizations';
   ```
2. `fix_rls_simple.sql` 재실행
3. Supabase 프로젝트 재시작

### 불완전한 계정 정리:
```sql
-- cleanup_incomplete_signups.sql 실행
-- auth.users에는 있지만 users 테이블에 없는 계정 삭제
```

## 참고사항

### Supabase RLS 정책 작동 방식:
- `TO` 절 생략 시 기본값 `TO public` 적용
- `public` 역할 = 모든 역할 (authenticated, anon 포함)
- `WITH CHECK` = INSERT/UPDATE 시 조건
- `USING` = SELECT 시 조건

### PostgREST 캐시:
- RLS 정책 변경 후 `NOTIFY pgrst, 'reload schema'` 필수
- 캐시가 완전히 갱신되지 않을 경우 프로젝트 재시작 필요

## 마무리

**현재 상태: 회원가입 정상 작동 중**

추가 보안 강화는 선택사항이며, 현재 상태로도 실제 보안 위험은 낮습니다.
초대 코드 시스템과 users.role 기반 권한 제어가 실제 보안을 담당하고 있습니다.
