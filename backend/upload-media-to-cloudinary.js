import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { uploadMedia } from './src/services/cloudinaryService.js';
import { extractTextFromImage } from './src/services/ocrService.js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * ad_media 테이블의 미디어를 Cloudinary에 업로드하고 OCR 실행
 */
async function uploadMediaToCloudinary(options = {}) {
  const {
    limit = 100,  // 한 번에 처리할 미디어 개수
    onlyPending = true  // cloudinary_public_id가 없는 것만 처리
  } = options;

  console.log('\n🚀 Starting Cloudinary upload process\n');
  console.log('─'.repeat(60));

  try {
    // 1. 업로드가 필요한 미디어 조회
    let query = supabase
      .from('ad_media')
      .select('id, ad_id, media_type, original_url, media_url, position')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (onlyPending) {
      query = query.is('cloudinary_public_id', null);
    }

    const { data: mediaItems, error } = await query;

    if (error) {
      console.error('❌ Error fetching media:', error);
      return;
    }

    console.log(`📦 Found ${mediaItems.length} media items to process\n`);

    if (mediaItems.length === 0) {
      console.log('✅ No media items need processing!');
      return;
    }

    // 2. 각 미디어 처리
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < mediaItems.length; i++) {
      const media = mediaItems[i];
      const sourceUrl = media.original_url || media.media_url;

      console.log(`\n[${i + 1}/${mediaItems.length}] Processing ${media.media_type}...`);
      console.log(`   Media ID: ${media.id}`);
      console.log(`   URL: ${sourceUrl?.substring(0, 60)}...`);

      try {
        // Cloudinary 업로드
        const cloudinaryResult = await uploadMedia(
          sourceUrl,
          media.media_type,
          {
            adId: media.ad_id,
            position: media.position
          }
        );

        // 업데이트할 데이터
        const updateData = {
          media_url: cloudinaryResult.url,
          original_url: sourceUrl,
          cloudinary_public_id: cloudinaryResult.publicId,
          metadata: {
            width: cloudinaryResult.width,
            height: cloudinaryResult.height,
            format: cloudinaryResult.format,
            bytes: cloudinaryResult.bytes,
            ...(cloudinaryResult.duration && { duration: cloudinaryResult.duration })
          }
        };

        // 이미지인 경우 OCR 실행 (주석처리 - 추후 활성화)
        // if (media.media_type === 'image') {
        //   console.log('   🔍 Running OCR...');
        //   const ocrResult = await extractTextFromImage(cloudinaryResult.url);

        //   updateData.ocr_text = ocrResult.text;
        //   updateData.ocr_confidence = ocrResult.confidence;

        //   console.log(`   ✅ OCR completed (${ocrResult.confidence.toFixed(1)}% confidence)`);
        //   if (ocrResult.text.length > 0) {
        //     console.log(`   📝 Extracted ${ocrResult.text.length} characters`);
        //   }
        // }

        // Supabase 업데이트
        const { error: updateError } = await supabase
          .from('ad_media')
          .update(updateData)
          .eq('id', media.id);

        if (updateError) {
          console.error(`   ❌ Supabase update failed:`, updateError.message);
          failCount++;
        } else {
          console.log(`   ✅ Updated successfully`);
          successCount++;
        }

      } catch (error) {
        console.error(`   ❌ Processing failed:`, error.message);
        failCount++;

        // 에러 정보를 metadata에 저장
        await supabase
          .from('ad_media')
          .update({
            metadata: {
              upload_error: error.message,
              upload_attempted_at: new Date().toISOString()
            }
          })
          .eq('id', media.id);
      }

      // 진행률 표시
      if ((i + 1) % 10 === 0) {
        console.log(`\n📊 Progress: ${i + 1}/${mediaItems.length} (${successCount} success, ${failCount} failed)`);
      }
    }

    // 3. 최종 결과
    console.log('\n' + '─'.repeat(60));
    console.log('📊 Final Results:');
    console.log(`   Total processed: ${mediaItems.length}`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   Success rate: ${((successCount / mediaItems.length) * 100).toFixed(1)}%`);

    if (successCount > 0) {
      console.log('\n✅ Cloudinary upload completed!');
    }

  } catch (error) {
    console.error('\n❌ Process failed:', error);
    console.error(error.stack);
  }

  console.log('\n' + '─'.repeat(60));
  console.log('✅ Process completed!\n');
}

// 실행
uploadMediaToCloudinary({
  limit: 100,  // 한 번에 100개씩 처리
  onlyPending: true  // cloudinary_public_id가 없는 것만
});
