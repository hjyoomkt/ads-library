import cloudinary from 'cloudinary';
import axios from 'axios';
import sharp from 'sharp';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function downloadAndUploadImage(imageUrl, adId, position) {
  try {
    // 이미지 다운로드
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    // Sharp로 이미지 최적화
    const buffer = await sharp(response.data)
      .resize(1200, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Cloudinary 업로드
    return new Promise((resolve, reject) => {
      cloudinary.v2.uploader.upload_stream(
        {
          folder: 'meta-ads',
          public_id: `${adId}_${position}`,
          resource_type: 'image',
          overwrite: true
        },
        (error, result) => {
          if (error) reject(error);
          else resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        }
      ).end(buffer);
    });

  } catch (error) {
    console.error(`❌ Image upload error for ${imageUrl}:`, error.message);
    throw error;
  }
}
