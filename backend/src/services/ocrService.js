import Tesseract from 'tesseract.js';
import axios from 'axios';

/**
 * 이미지 URL에서 텍스트 추출 (OCR)
 */
export async function extractTextFromImage(imageUrl, options = {}) {
  const {
    lang = 'kor+eng',  // 한국어 + 영어
    verbose = false
  } = options;

  try {
    if (verbose) {
      console.log(`  🔍 OCR processing: ${imageUrl.substring(0, 60)}...`);
    }

    // Tesseract로 OCR 실행
    const tesseractOptions = {};

    if (verbose) {
      tesseractOptions.logger = (m) => {
        if (m.status === 'recognizing text') {
          console.log(`    Progress: ${Math.round(m.progress * 100)}%`);
        }
      };
    }

    const { data } = await Tesseract.recognize(imageUrl, lang, tesseractOptions);

    const text = data.text.trim();
    const confidence = data.confidence;

    if (verbose) {
      console.log(`  ✅ OCR completed (confidence: ${confidence.toFixed(1)}%)`);
      console.log(`  📝 Text length: ${text.length} chars`);
    }

    return {
      text,
      confidence,
      lang: data.lang
    };

  } catch (error) {
    console.error(`  ❌ OCR failed:`, error.message);
    return {
      text: '',
      confidence: 0,
      error: error.message
    };
  }
}

/**
 * 여러 이미지에서 텍스트 일괄 추출
 */
export async function extractTextFromImages(imageUrls, options = {}) {
  const results = [];

  for (let i = 0; i < imageUrls.length; i++) {
    console.log(`\n📄 Processing image ${i + 1}/${imageUrls.length}`);
    const result = await extractTextFromImage(imageUrls[i], { ...options, verbose: true });
    results.push({
      url: imageUrls[i],
      ...result
    });
  }

  return results;
}

/**
 * OCR 텍스트에서 유용한 정보 추출
 */
export function extractKeywords(ocrText) {
  if (!ocrText || ocrText.length < 10) {
    return [];
  }

  // 간단한 키워드 추출 (추후 개선 가능)
  const lines = ocrText.split('\n').filter(line => line.trim().length > 3);
  const keywords = [];

  // 숫자+단위 패턴 (예: "50% 할인", "10,000원")
  const pricePattern = /[\d,]+[%원$€]/g;
  const prices = ocrText.match(pricePattern) || [];
  keywords.push(...prices);

  // 짧은 문구 (5-30자)
  const shortPhrases = lines.filter(line => {
    const len = line.trim().length;
    return len >= 5 && len <= 30;
  });
  keywords.push(...shortPhrases.slice(0, 5));

  return [...new Set(keywords)];
}

export default {
  extractTextFromImage,
  extractTextFromImages,
  extractKeywords
};
