// 검색어 유효성 검증 함수 테스트
function validateSearchQuery(query) {
  if (!query || !query.trim()) {
    return { valid: false, error: 'Search query is required' };
  }

  const trimmed = query.trim();

  // 깨진 인코딩 감지 (제어 문자, 대체 문자 등)
  const hasInvalidChars = /[\uFFFD\u0000-\u001F\u007F-\u009F]/.test(trimmed);
  if (hasInvalidChars) {
    return { valid: false, error: 'Invalid characters detected. Please use valid Korean, English, or numbers only.' };
  }

  // 너무 짧거나 긴 검색어
  if (trimmed.length < 2) {
    return { valid: false, error: 'Search query must be at least 2 characters' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Search query must be less than 100 characters' };
  }

  // 유효한 문자만 포함 (한글, 영문, 숫자, 공백, 일부 특수문자)
  const validPattern = /^[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318Fa-zA-Z0-9\s\-_.&]+$/;
  if (!validPattern.test(trimmed)) {
    return { valid: false, error: 'Search query contains invalid characters. Please use Korean, English, numbers, spaces, or basic punctuation only.' };
  }

  return { valid: true, query: trimmed };
}

// 테스트 케이스
const testCases = [
  { input: '시원스쿨', expected: true, description: '유효한 한글' },
  { input: 'Nike', expected: true, description: '유효한 영문' },
  { input: '나이키 신발', expected: true, description: '한글 + 공백' },
  { input: 'Starbucks Coffee', expected: true, description: '영문 + 공백' },
  { input: 'ABC-123', expected: true, description: '영문 + 숫자 + 하이픈' },
  { input: '�ÿ�����', expected: false, description: '깨진 인코딩' },
  { input: 'a', expected: false, description: '너무 짧음' },
  { input: '', expected: false, description: '빈 문자열' },
  { input: '   ', expected: false, description: '공백만' },
  { input: 'test\u0000invalid', expected: false, description: '제어 문자 포함' },
  { input: 'Hello\uFFFDWorld', expected: false, description: '대체 문자 포함' }
];

console.log('\n=== 검색어 유효성 검증 테스트 ===\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = validateSearchQuery(testCase.input);
  const success = result.valid === testCase.expected;

  if (success) {
    console.log(`✅ Test ${index + 1}: ${testCase.description}`);
    console.log(`   입력: "${testCase.input}"`);
    console.log(`   결과: ${result.valid ? 'PASS' : 'REJECT'}`);
    if (!result.valid) {
      console.log(`   이유: ${result.error}`);
    }
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: ${testCase.description}`);
    console.log(`   입력: "${testCase.input}"`);
    console.log(`   예상: ${testCase.expected ? 'PASS' : 'REJECT'}, 실제: ${result.valid ? 'PASS' : 'REJECT'}`);
    if (!result.valid) {
      console.log(`   이유: ${result.error}`);
    }
    failed++;
  }
  console.log();
});

console.log(`\n=== 결과 ===`);
console.log(`통과: ${passed}/${testCases.length}`);
console.log(`실패: ${failed}/${testCases.length}`);
