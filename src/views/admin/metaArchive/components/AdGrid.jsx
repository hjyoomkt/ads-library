import { SimpleGrid, Box, Image, Text, Badge, HStack, VStack, Icon } from '@chakra-ui/react';
import Card from 'components/card/Card';
import { FaFacebook, FaInstagram, FaFacebookMessenger, FaThreads } from 'react-icons/fa6';
import { MdDevices } from 'react-icons/md';

const getPlatformIcon = (publisherPlatform) => {
  if (!publisherPlatform) return { icon: MdDevices, color: '#718096' };

  const platform = typeof publisherPlatform === 'string'
    ? publisherPlatform.toLowerCase()
    : String(publisherPlatform).toLowerCase();

  switch (platform) {
    case 'facebook':
      return { icon: FaFacebook, color: '#1877F2' };
    case 'instagram':
      return { icon: FaInstagram, color: '#E4405F' };
    case 'messenger':
      return { icon: FaFacebookMessenger, color: '#0084FF' };
    case 'threads':
      return { icon: FaThreads, color: '#000000' };
    case 'audience_network':
      return { icon: MdDevices, color: '#4267B2' };
    default:
      return { icon: MdDevices, color: '#718096' };
  }
};

// 1:1 비율에 가장 가까운 이미지 선택 (정사각형 우선)
const selectBestMedia = (mediaArray) => {
  if (!mediaArray || mediaArray.length === 0) return null;

  // 이미지만 필터링
  const images = mediaArray.filter(m => m.media_type === 'image');
  if (images.length === 0) return mediaArray[0]; // 이미지 없으면 첫 번째 미디어(비디오 등)

  // metadata가 있는 이미지만 선택
  const imagesWithMetadata = images.filter(m => m.metadata?.width && m.metadata?.height);

  if (imagesWithMetadata.length === 0) return images[0]; // metadata 없으면 첫 번째 이미지

  // 1:1 비율에 가장 가까운 이미지 찾기
  let bestImage = imagesWithMetadata[0];
  let minRatioDiff = Math.abs((imagesWithMetadata[0].metadata.width / imagesWithMetadata[0].metadata.height) - 1);

  imagesWithMetadata.forEach(img => {
    const ratio = img.metadata.width / img.metadata.height;
    const ratioDiff = Math.abs(ratio - 1); // 1:1 비율과의 차이

    if (ratioDiff < minRatioDiff) {
      minRatioDiff = ratioDiff;
      bestImage = img;
    }
  });

  return bestImage;
};

export default function AdGrid({ ads, onAdClick }) {
  if (!ads || ads.length === 0) {
    return (
      <Card p="40px" textAlign="center">
        <VStack spacing={3}>
          <Text color="gray.500" fontSize="lg" fontWeight="medium">
            검색 결과가 없습니다
          </Text>
          <Text color="gray.400" fontSize="sm">
            다른 키워드나 광고주 이름으로 검색해보세요
          </Text>
        </VStack>
      </Card>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 3, lg: 4, xl: 5 }} gap="20px">
      {ads.map((ad) => {
        const selectedMedia = selectBestMedia(ad.ad_media);

        return (
        <Card
          key={ad.id}
          p="0"
          cursor="pointer"
          onClick={() => onAdClick(ad)}
          _hover={{ transform: 'translateY(-4px)', shadow: 'xl' }}
          transition="all 0.2s"
          overflow="hidden"
        >
          <Box
            position="relative"
            width="100%"
            paddingBottom="100%"
            bg="gray.100"
            overflow="hidden"
          >
            {selectedMedia ? (
              <>
                {selectedMedia.media_type === 'video' ? (
                  <Box
                    as="video"
                    position="absolute"
                    top="0"
                    left="0"
                    width="100%"
                    height="100%"
                    objectFit="cover"
                    controls
                  >
                    <source src={selectedMedia.media_url} type="video/mp4" />
                  </Box>
                ) : (
                  <Image
                    src={selectedMedia.media_url}
                    alt={ad.advertiser_name}
                    position="absolute"
                    top="0"
                    left="0"
                    width="100%"
                    height="100%"
                    objectFit="cover"
                  />
                )}
              </>
            ) : (
              <Box
                position="absolute"
                top="0"
                left="0"
                width="100%"
                height="100%"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="gray.50"
              >
                <Text color="gray.400" fontSize="sm">No media</Text>
              </Box>
            )}
          </Box>

          <VStack align="stretch" p="20px" spacing={3}>
            <VStack align="start" spacing={2}>
              <Text fontSize="md" fontWeight="bold" noOfLines={1}>
                {ad.advertiser_name}
              </Text>
              {ad.platform_specific_data?.publisher_platform && (
                <HStack spacing={1}>
                  {(Array.isArray(ad.platform_specific_data.publisher_platform)
                    ? ad.platform_specific_data.publisher_platform
                    : [ad.platform_specific_data.publisher_platform]
                  ).map((platform, idx) => {
                    const { icon, color } = getPlatformIcon(platform);
                    return (
                      <Icon
                        key={idx}
                        as={icon}
                        boxSize="18px"
                        color={color}
                      />
                    );
                  })}
                </HStack>
              )}
            </VStack>

            <Text fontSize="sm" color="gray.600" noOfLines={3}>
              {ad.ad_creative_body}
            </Text>

            <HStack spacing={2} flexWrap="wrap">
              {ad.started_running_date && (
                <Badge colorScheme="green" fontSize="xs">
                  {new Date(ad.started_running_date).toLocaleDateString()}
                </Badge>
              )}
              {ad.platform_specific_data?.cta_text && (
                <Badge colorScheme="blue" fontSize="xs">
                  {ad.platform_specific_data.cta_text}
                </Badge>
              )}
            </HStack>
          </VStack>
        </Card>
        );
      })}
    </SimpleGrid>
  );
}
