# 제스트러리 초대 이메일 발송 기능 구현

## 개요

ads-library(제스트러리) 프로젝트에 초대 시스템은 구축되어 있으나, 실제 이메일 발송 기능이 없어 초대 링크를 수동으로 복사/공유해야 하는 상태였습니다.
growth-dashboard에서 Resend API + Supabase Edge Function으로 동작 중인 이메일 발송 패턴을 ads-library에 동일하게 적용하였습니다.

---

## 변경 사항

### 1. Supabase Edge Function 생성 (신규)

**파일**: `supabase/functions/send-invite-email/index.ts`

growth-dashboard의 `send-invite-email` Edge Function을 기반으로 제스트러리 전용으로 생성하였습니다.

| 항목 | 값 |
|------|---|
| 발신자 | `제스트러리 <invite@library.zestdot.com>` |
| 제목 | `제스트러리 초대장` |
| 회원가입 URL | `https://library.zestdot.com/auth/sign-up?code={inviteCode}` |
| 만료 안내 | 초대 링크는 7일간 유효 |
| 지원 inviteType | `new_organization`, `new_brand`, `existing_member`, `new_agency` |

**동작 흐름**:
1. JWT 토큰 검증 (인증된 사용자만 호출 가능)
2. 요청 파싱 (`inviteCode`, `invitedEmail`, `inviteType`)
3. 회원가입 URL 생성
4. Resend API를 통해 HTML 이메일 발송
5. 성공/실패 응답 반환

**Supabase 배포 완료**: 프로젝트 `qpeflgaxnavvogsodjlq`에 `--no-verify-jwt` 옵션으로 배포됨

---

### 2. 프론트엔드 서비스 수정 (수정)

**파일**: `src/services/supabaseService.js`

#### 2-1. `sendInviteEmail()` 함수 추가

```javascript
export async function sendInviteEmail(emailData) {
  const { data, error } = await supabase.functions.invoke('send-invite-email', {
    body: emailData,
  });
  if (error) throw error;
  return data;
}
```

#### 2-2. `createInviteCode()` 함수 수정

DB에 초대 코드 insert 성공 후 `sendInviteEmail()`을 호출하도록 수정하였습니다.

```javascript
// Edge Function 호출하여 초대 이메일 발송
try {
  await sendInviteEmail({
    inviteCode: data.code,
    invitedEmail: inviteData.email,
    inviteType: inviteData.inviteType || 'existing_member',
  });
  console.log('Invite email sent successfully to:', inviteData.email);
} catch (emailError) {
  console.error('Failed to send invite email:', emailError);
  // 이메일 발송 실패해도 초대 코드는 정상 반환
}
```

**핵심**: 이메일 발송 실패 시에도 초대 코드는 정상 생성/반환됨 (try/catch 패턴)

---

## Supabase 환경변수 설정 (수동 완료 필요)

Supabase Dashboard > Edge Functions > Secrets:

| Secret | 값 | 상태 |
|--------|---|------|
| `RESEND_API_KEY` | ads-library용 Resend API Key | 설정 완료 |
| `APP_URL` | `https://library.zestdot.com` | 설정 완료 |

---

## 배포 체크리스트

- [x] Supabase Edge Function 배포 (`send-invite-email`)
- [x] Supabase 환경변수 설정 (`RESEND_API_KEY`, `APP_URL`)
- [x] Resend 도메인 인증 (`library.zestdot.com`)
- [ ] **프론트엔드 코드 프로덕션 배포** (`supabaseService.js` 변경분)

> **중요**: Edge Function은 Supabase에 배포 완료되었으나, 프론트엔드 코드(`supabaseService.js`)는 git push 및 프로덕션 배포가 필요합니다. 프로덕션의 `createInviteCode()`가 `sendInviteEmail()`을 호출하려면 변경된 코드가 반영되어야 합니다.

---

## 영향 범위

| 컴포넌트 | 설명 |
|----------|------|
| `InviteUserModal.jsx` | 기존 멤버/신규 클라이언트/하위 브랜드 초대 시 이메일 자동 발송 |
| `InviteAgencyModal.jsx` | 대행사 초대 시 이메일 자동 발송 |
| `createInviteCode()` | 초대 코드 생성 후 이메일 발송 연동 |

SQL 변경: 없음 (`invitation_codes` 테이블 기존 구조 그대로 사용)

---

## 참조

- growth-dashboard 참조 파일: `supabase/functions/send-invite-email/index.ts`
- growth-dashboard 참조 함수: `src/services/supabaseService.js` → `sendInviteEmail()`, `createInviteCode()`
