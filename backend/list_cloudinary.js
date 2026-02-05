import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function listFiles() {
  try {
    console.log('\n=== Cloudinary 파일 목록 ===\n');

    // 이미지 폴더
    const images = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'ads-library/images',
      max_results: 10
    });

    console.log(`이미지: ${images.resources.length}개`);
    images.resources.forEach((img, i) => {
      console.log(`${i + 1}. ${img.public_id}`);
      console.log(`   URL: ${img.secure_url}`);
      console.log(`   생성: ${img.created_at}`);
    });

    // 동영상 폴더
    const videos = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'ads-library/videos',
      max_results: 10,
      resource_type: 'video'
    });

    console.log(`\n동영상: ${videos.resources.length}개`);
    videos.resources.forEach((vid, i) => {
      console.log(`${i + 1}. ${vid.public_id}`);
      console.log(`   URL: ${vid.secure_url}`);
      console.log(`   생성: ${vid.created_at}`);
    });

  } catch (error) {
    console.error('에러:', error.message);
  }
}

listFiles();
