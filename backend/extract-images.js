import fs from 'fs';

const ads = JSON.parse(fs.readFileSync('extracted-ads.json', 'utf-8'));

const allImages = [];

ads.forEach((ad, index) => {
  // cards에서 이미지 추출
  if (ad.cards && ad.cards.length > 0) {
    ad.cards.forEach((card, cardIndex) => {
      if (card.original_image_url) {
        allImages.push({
          ad_id: ad.ad_archive_id,
          page_name: ad.page_name,
          type: 'card_original',
          card_index: cardIndex,
          url: card.original_image_url
        });
      }
      if (card.resized_image_url) {
        allImages.push({
          ad_id: ad.ad_archive_id,
          page_name: ad.page_name,
          type: 'card_resized',
          card_index: cardIndex,
          url: card.resized_image_url
        });
      }
    });
  }

  // images 배열에서 추출
  if (ad.images && ad.images.length > 0) {
    ad.images.forEach((image, imgIndex) => {
      if (image.original_image_url) {
        allImages.push({
          ad_id: ad.ad_archive_id,
          page_name: ad.page_name,
          type: 'image_original',
          image_index: imgIndex,
          url: image.original_image_url
        });
      }
      if (image.resized_image_url) {
        allImages.push({
          ad_id: ad.ad_archive_id,
          page_name: ad.page_name,
          type: 'image_resized',
          image_index: imgIndex,
          url: image.resized_image_url
        });
      }
    });
  }
});

// 저장
fs.writeFileSync('image-urls.json', JSON.stringify(allImages, null, 2));

// 콘솔 출력
console.log(`\n📸 Total images extracted: ${allImages.length}\n`);

allImages.forEach((img, index) => {
  console.log(`[${index + 1}] ${img.type} - Ad: ${img.ad_id}`);
  console.log(`    ${img.url}\n`);
});

console.log(`✅ Saved to image-urls.json\n`);
