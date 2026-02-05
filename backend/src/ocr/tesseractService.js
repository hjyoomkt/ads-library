import Tesseract from 'tesseract.js';

export async function extractTextFromImage(imageUrl) {
  try {
    const { data: { text, confidence } } = await Tesseract.recognize(
      imageUrl,
      'kor+eng',
      {
        logger: info => {
          if (info.status === 'recognizing text') {
            console.log(`🔍 OCR Progress: ${Math.round(info.progress * 100)}%`);
          }
        }
      }
    );

    return {
      text: text.trim(),
      confidence: Math.round(confidence * 100) / 100
    };

  } catch (error) {
    console.error(`❌ OCR error for ${imageUrl}:`, error.message);
    return {
      text: '',
      confidence: 0
    };
  }
}
