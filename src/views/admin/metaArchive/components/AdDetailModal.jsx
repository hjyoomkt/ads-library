import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Image,
  Text,
  VStack,
  HStack,
  Badge,
  Divider,
  Box,
  SimpleGrid,
  Link,
  Flex,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { MdOpenInNew } from 'react-icons/md';
import Card from 'components/card/Card';

export default function AdDetailModal({ ad, isOpen, onClose }) {
  const textColorPrimary = useColorModeValue('secondaryGray.900', 'white');
  const textColorSecondary = useColorModeValue('gray.600', 'gray.400');
  const brandColor = useColorModeValue('brand.500', 'brand.400');
  const cardBg = useColorModeValue('white', 'navy.800');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const ocrBg = useColorModeValue('gray.50', 'navy.700');
  const idBg = useColorModeValue('gray.50', 'navy.700');

  if (!ad) return null;

  // 미디어를 비율에 따라 정렬 (정사각형 → 세로형 → 가로형)
  const sortedMedia = ad.ad_media ? [...ad.ad_media].sort((a, b) => {
    // metadata가 없으면 뒤로
    if (!a.metadata?.width || !a.metadata?.height) return 1;
    if (!b.metadata?.width || !b.metadata?.height) return -1;

    const ratioA = a.metadata.width / a.metadata.height;
    const ratioB = b.metadata.width / b.metadata.height;

    // 1:1에 가까운 순서 (정사각형 우선)
    const diffA = Math.abs(ratioA - 1);
    const diffB = Math.abs(ratioB - 1);

    return diffA - diffB;
  }) : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent maxH="90vh" overflowY="auto" bg={cardBg}>
        <ModalHeader
          fontSize="2xl"
          fontWeight="bold"
          color={textColorPrimary}
          borderBottom="1px"
          borderColor={borderColor}
        >
          {ad.advertiser_name}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6} pt={6}>
          <VStack align="start" spacing={5}>
            {/* 미디어를 가로로 나란히 표시 */}
            {sortedMedia.length > 0 && (
              <Card w="100%" p="20px" overflow="hidden">
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {sortedMedia.map((media, idx) => (
                    <Box key={idx} position="relative">
                      {media.media_type === 'video' ? (
                        <Box
                          as="video"
                          src={media.media_url}
                          controls
                          w="100%"
                          maxH="300px"
                          borderRadius="md"
                        />
                      ) : (
                        <Image
                          src={media.media_url}
                          alt={`Ad ${idx + 1}`}
                          w="100%"
                          maxH="300px"
                          objectFit="cover"
                          borderRadius="md"
                        />
                      )}

                      {media.extracted_text && (
                        <Box mt={2} p={2} bg={ocrBg} borderRadius="md">
                          <Text fontSize="xs" fontWeight="bold" mb={1} color={brandColor}>
                            OCR
                          </Text>
                          <Text fontSize="xs" color={textColorSecondary} noOfLines={2}>
                            {media.extracted_text}
                          </Text>
                        </Box>
                      )}
                    </Box>
                  ))}
                </SimpleGrid>
              </Card>
            )}

            <Card w="100%" p={5}>
              <VStack align="start" spacing={4}>
                <Box w="100%">
                  <Text fontWeight="bold" mb={2} color={textColorPrimary} fontSize="md">
                    Ad Text
                  </Text>
                  <Text color={textColorSecondary} lineHeight="tall">
                    {ad.ad_creative_body}
                  </Text>
                </Box>

                {ad.ad_creative_link_title && (
                  <Box w="100%">
                    <Text fontWeight="bold" mb={2} color={textColorPrimary} fontSize="md">
                      Link Title
                    </Text>
                    <Text color={textColorSecondary}>
                      {ad.ad_creative_link_title}
                    </Text>
                  </Box>
                )}

                {ad.ad_creative_link_description && (
                  <Box w="100%">
                    <Text fontWeight="bold" mb={2} color={textColorPrimary} fontSize="md">
                      Link Description
                    </Text>
                    <Text color={textColorSecondary}>
                      {ad.ad_creative_link_description}
                    </Text>
                  </Box>
                )}
              </VStack>
            </Card>

            <Card w="100%" p={5}>
              <Text fontWeight="bold" mb={4} color={textColorPrimary} fontSize="lg">
                Ad Statistics
              </Text>
              <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4} w="100%">
                {ad.platform_specific_data?.ad_archive_id && (
                  <Box>
                    <Text fontWeight="600" fontSize="sm" mb={2} color={textColorSecondary}>
                      Ad Archive ID
                    </Text>
                    <Text fontSize="sm" color={textColorPrimary} fontFamily="mono" fontWeight="500" noOfLines={1}>
                      {ad.platform_specific_data.ad_archive_id}
                    </Text>
                  </Box>
                )}

                <Box>
                  <Text fontWeight="600" fontSize="sm" mb={2} color={textColorSecondary}>
                    Platform
                  </Text>
                  <Badge colorScheme="brand" fontSize="sm" px={3} py={1}>
                    {ad.platform?.toUpperCase()}
                  </Badge>
                </Box>

                <Box>
                  <Text fontWeight="600" fontSize="sm" mb={2} color={textColorSecondary}>
                    Search Type
                  </Text>
                  <Badge colorScheme="gray" fontSize="sm" px={3} py={1}>
                    {ad.search_type}
                  </Badge>
                </Box>

                {ad.started_running_date && (
                  <Box>
                    <Text fontWeight="600" fontSize="sm" mb={2} color={textColorSecondary}>
                      Started Running
                    </Text>
                    <Text fontSize="sm" color={textColorPrimary} fontWeight="500">
                      {new Date(ad.started_running_date).toLocaleDateString()}
                    </Text>
                  </Box>
                )}

                {ad.last_shown_date && (
                  <Box>
                    <Text fontWeight="600" fontSize="sm" mb={2} color={textColorSecondary}>
                      Last Shown
                    </Text>
                    <Text fontSize="sm" color={textColorPrimary} fontWeight="500">
                      {new Date(ad.last_shown_date).toLocaleDateString()}
                    </Text>
                  </Box>
                )}

                {ad.impressions_min && (
                  <Box>
                    <Text fontWeight="600" fontSize="sm" mb={2} color={textColorSecondary}>
                      Impressions
                    </Text>
                    <Text fontSize="sm" color={textColorPrimary} fontWeight="500">
                      {ad.impressions_min.toLocaleString()} ~ {ad.impressions_max.toLocaleString()}
                    </Text>
                  </Box>
                )}

                {ad.spend_min && (
                  <Box>
                    <Text fontWeight="600" fontSize="sm" mb={2} color={textColorSecondary}>
                      Spend
                    </Text>
                    <Text fontSize="sm" color={textColorPrimary} fontWeight="500">
                      ${ad.spend_min.toLocaleString()} ~ ${ad.spend_max.toLocaleString()}
                    </Text>
                  </Box>
                )}
              </SimpleGrid>
            </Card>

            <Card w="100%" p={5}>
              <Text fontWeight="bold" mb={4} color={textColorPrimary} fontSize="lg">
                Links & References
              </Text>
              <VStack align="start" spacing={4} w="100%">
                {ad.platform_specific_data?.page_profile_uri && (
                  <Box w="100%">
                    <Text fontWeight="600" fontSize="sm" mb={2} color={textColorSecondary}>
                      Page URL
                    </Text>
                    <Link
                      href={ad.platform_specific_data.page_profile_uri}
                      isExternal
                      fontSize="sm"
                      color={brandColor}
                      _hover={{ textDecoration: 'underline' }}
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <Text noOfLines={1}>{ad.platform_specific_data.page_profile_uri}</Text>
                      <Icon as={MdOpenInNew} />
                    </Link>
                  </Box>
                )}

                {ad.ad_creative_link_url && (
                  <Box w="100%">
                    <Text fontWeight="600" fontSize="sm" mb={2} color={textColorSecondary}>
                      Landing URL
                    </Text>
                    <Link
                      href={ad.ad_creative_link_url}
                      isExternal
                      fontSize="sm"
                      color={brandColor}
                      _hover={{ textDecoration: 'underline' }}
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <Text noOfLines={1}>{ad.ad_creative_link_url}</Text>
                      <Icon as={MdOpenInNew} />
                    </Link>
                  </Box>
                )}
              </VStack>
            </Card>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
