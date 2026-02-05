import { uploadMedia } from './src/services/cloudinaryService.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('\n=== Cloudinary 설정 확인 ===');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '설정됨' : '❌ 없음');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '설정됨' : '❌ 없음');

// 테스트 이미지 URL (Meta 광고 이미지)
const testImageUrl = 'https://scontent-icn2-1.xx.fbcdn.net/v/t39.35426-6/586546639_1587616018896799_7607556742069293182_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=a90e1e&_nc_ohc=xt4FbKQXpUcQ7kNvgFWMfxZ&_nc_zt=14&_nc_ht=scontent-icn2-1.xx&_nc_gid=AYU5aHKLtKdUSwz9qe_gJYO&oh=00_AYCg9sQqMYfI-p8iLYBCBkRVDfpuXiONLc7pFu4P7_Y6Bg&oe=67A28FA4';

console.log('\n=== Cloudinary 업로드 테스트 ===');
console.log('테스트 이미지:', testImageUrl.substring(0, 80) + '...');

try {
  const result = await uploadMedia(testImageUrl, 'image', {
    adId: 'test',
    position: 0
  });

  console.log('\n✅ 업로드 성공!');
  console.log('URL:', result.url);
  console.log('Public ID:', result.publicId);
  console.log('크기:', `${result.width}x${result.height}`);
  console.log('포맷:', result.format);
  console.log('용량:', `${Math.round(result.bytes / 1024)}KB`);

} catch (error) {
  console.log('\n❌ 업로드 실패!');
  console.log('에러:', error.message);
  console.log('상세:', error);
}
