import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: false,  // 브라우저 보기
  slowMo: 1000  // 천천히 실행
});

const page = await browser.newPage();

await page.goto('https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=nike&search_type=keyword_unordered&media_type=all');

console.log('\n⏸️  Browser is open. Check the page manually!');
console.log('광고 카드를 찾아서 F12로 개발자 도구를 열고');
console.log('광고 요소의 클래스나 구조를 확인하세요.\n');
console.log('60초 후 자동으로 닫힙니다...\n');

await page.waitForTimeout(60000);

await browser.close();
console.log('Done!');
