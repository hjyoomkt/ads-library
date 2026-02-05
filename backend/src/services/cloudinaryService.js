import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import { createWriteStream, unlinkSync } from 'fs';
import { pipeline } from 'stream/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import dotenv from 'dotenv';

dotenv.config();

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * URL에서 파일을 다운로드하여 임시 저장
 */
async function downloadFile(url, filename) {
  const tempPath = join(tmpdir(), filename);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.facebook.com/',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    }
  });

  await pipeline(response.data, createWriteStream(tempPath));
  return tempPath;
}

/**
 * 이미지를 Cloudinary에 업로드
 */
export async function uploadImage(imageUrl, options = {}) {
  const {
    folder = 'ads-library/images',
    adId = null,
    position = 0
  } = options;

  try {
    console.log(`  📤 Uploading image: ${imageUrl.substring(0, 60)}...`);

    // URL에서 직접 업로드 (Cloudinary가 URL fetch 지원)
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder,
      resource_type: 'image',
      public_id: adId ? `ad_${adId}_img_${position}` : undefined,
      overwrite: false,
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    console.log(`  ✅ Image uploaded: ${result.public_id}`);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes
    };

  } catch (error) {
    console.error(`  ❌ Image upload failed:`, error.message);

    // URL 직접 업로드 실패 시, 다운로드 후 재시도
    if (error.http_code === 400) {
      try {
        console.log(`  🔄 Retrying with download method...`);
        const tempFile = await downloadFile(imageUrl, `img_${Date.now()}.jpg`);

        const result = await cloudinary.uploader.upload(tempFile, {
          folder,
          resource_type: 'image',
          public_id: adId ? `ad_${adId}_img_${position}` : undefined
        });

        unlinkSync(tempFile);
        console.log(`  ✅ Image uploaded (retry): ${result.public_id}`);

        return {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes
        };
      } catch (retryError) {
        console.error(`  ❌ Retry failed:`, retryError.message);
        throw retryError;
      }
    }

    throw error;
  }
}

/**
 * 동영상을 Cloudinary에 업로드
 */
export async function uploadVideo(videoUrl, options = {}) {
  const {
    folder = 'ads-library/videos',
    adId = null,
    position = 0
  } = options;

  try {
    console.log(`  📤 Uploading video: ${videoUrl.substring(0, 60)}...`);

    // URL에서 직접 업로드
    const result = await cloudinary.uploader.upload(videoUrl, {
      folder,
      resource_type: 'video',
      public_id: adId ? `ad_${adId}_vid_${position}` : undefined,
      overwrite: false,
      eager: [
        { width: 300, height: 300, crop: 'pad', format: 'jpg' }
      ],
      eager_async: true
    });

    console.log(`  ✅ Video uploaded: ${result.public_id}`);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      duration: result.duration,
      bytes: result.bytes
    };

  } catch (error) {
    console.error(`  ❌ Video upload failed:`, error.message);

    // URL 직접 업로드 실패 시, 다운로드 후 재시도
    if (error.http_code === 400) {
      try {
        console.log(`  🔄 Retrying with download method...`);
        const tempFile = await downloadFile(videoUrl, `vid_${Date.now()}.mp4`);

        const result = await cloudinary.uploader.upload(tempFile, {
          folder,
          resource_type: 'video',
          public_id: adId ? `ad_${adId}_vid_${position}` : undefined
        });

        unlinkSync(tempFile);
        console.log(`  ✅ Video uploaded (retry): ${result.public_id}`);

        return {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          duration: result.duration,
          bytes: result.bytes
        };
      } catch (retryError) {
        console.error(`  ❌ Retry failed:`, retryError.message);
        throw retryError;
      }
    }

    throw error;
  }
}

/**
 * 미디어 URL 업로드 (이미지 또는 동영상 자동 감지)
 */
export async function uploadMedia(mediaUrl, mediaType, options = {}) {
  if (mediaType === 'video') {
    return uploadVideo(mediaUrl, options);
  } else {
    return uploadImage(mediaUrl, options);
  }
}

/**
 * Cloudinary 리소스 삭제
 */
export async function deleteMedia(publicId, resourceType = 'image') {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    console.log(`  🗑️  Deleted: ${publicId}`);
    return result;
  } catch (error) {
    console.error(`  ❌ Delete failed:`, error.message);
    throw error;
  }
}

export default {
  uploadImage,
  uploadVideo,
  uploadMedia,
  deleteMedia
};
