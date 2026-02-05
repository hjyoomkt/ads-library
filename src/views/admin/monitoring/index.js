import React, { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  SimpleGrid,
  Icon,
  Badge,
  useColorModeValue,
  Select,
} from '@chakra-ui/react';
import { MdAdd, MdKeyboardArrowDown } from 'react-icons/md';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import Card from 'components/card/Card';

// 샘플 데이터
const competitorData = [
  {
    id: 1,
    name: '메디큐브 - Medicube',
    logo: 'medicube',
    adsCount: 719,
    category: '뷰티',
    facebook: {
      id: '253332005052281',
      handle: '@medicubeofficial',
      verified: true,
    },
    instagram: {
      handle: '@medicube_korea',
      verified: true,
    },
  },
  {
    id: 2,
    name: '올리브영',
    logo: 'oliveyoung',
    adsCount: 195,
    category: '뷰티',
    facebook: {
      id: '217121317199664',
      handle: '@OLIVEYOUNG',
      verified: true,
    },
    instagram: {
      handle: '@oliveyoung_official',
      verified: true,
    },
  },
  {
    id: 3,
    name: '토리든',
    logo: 'torriden',
    adsCount: 118,
    category: '뷰티',
    facebook: {
      id: '733047486827750',
      handle: '@torriden.korea',
      verified: false,
    },
    instagram: {
      handle: '@torriden_official',
      verified: false,
    },
  },
];

const categories = [
  '전체',
  '뷰티',
  '패션',
  '식품',
  '홈·생활',
  '가전·디지털',
  '취미·반려동물',
  '건강',
  'IT 솔루션·SaaS',
  '커머스·쇼핑',
  '금융·핀테크',
  '교육',
  '커뮤니티·콘텐츠',
  '라이프스타일 서비스',
];

const Monitoring = () => {
  const [selectedCategory, setSelectedCategory] = useState('전체');

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorSecondary = useColorModeValue('secondaryGray.700', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const bgButton = useColorModeValue('white', 'whiteAlpha.100');
  const bgHover = useColorModeValue('secondaryGray.100', 'whiteAlpha.50');
  const bgActive = useColorModeValue('brand.500', 'brand.400');
  const cardBg = useColorModeValue('white', 'navy.800');

  const getCurrentDateTime = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${month}.${day} ${hours}:${minutes} 업데이트`;
  };

  const filteredCompetitors = selectedCategory === '전체'
    ? competitorData
    : competitorData.filter(c => c.category === selectedCategory);

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      {/* 헤더 섹션 */}
      <Flex justify="space-between" align="flex-start" mb="20px">
        <Box>
          <Text
            color="brand.500"
            fontSize="sm"
            fontWeight="500"
            mb="4px"
          >
            다른 마케터들은 이 경쟁사를 추가했어요
          </Text>
          <Flex align="center" gap="10px" mb="4px">
            <Text
              color={textColor}
              fontSize="2xl"
              fontWeight="700"
            >
              분야별 추천 경쟁사
            </Text>
            <Badge
              colorScheme="purple"
              fontSize="xs"
              px="8px"
              py="2px"
              borderRadius="full"
            >
              BETA
            </Badge>
          </Flex>
          <Text
            color={textColorSecondary}
            fontSize="sm"
            fontWeight="400"
          >
            {getCurrentDateTime()}
          </Text>
        </Box>

        {/* Meta 광고 라이브러리 셀렉터 */}
        <Flex align="center" gap="8px" minW="240px">
          <Icon as={FaFacebook} color="#1877F2" w="20px" h="20px" />
          <Select
            placeholder="Meta 광고 라이브러리"
            size="sm"
            borderRadius="10px"
            borderColor={borderColor}
            icon={<MdKeyboardArrowDown />}
            _focus={{ borderColor: 'brand.500' }}
          >
            <option>Meta 광고 라이브러리</option>
          </Select>
        </Flex>
      </Flex>

      {/* 카테고리 필터 */}
      <Flex
        mb="24px"
        gap="6px"
        flexWrap="wrap"
        pb="20px"
        borderBottom="1px solid"
        borderColor={borderColor}
      >
        {categories.map((category) => (
          <Button
            key={category}
            size="sm"
            variant={selectedCategory === category ? 'solid' : 'outline'}
            bg={selectedCategory === category ? 'blue.500' : 'white'}
            color={selectedCategory === category ? 'white' : 'gray.700'}
            borderColor={selectedCategory === category ? 'blue.500' : 'gray.200'}
            borderRadius="full"
            fontWeight="500"
            fontSize="13px"
            px="14px"
            py="6px"
            h="32px"
            _hover={{
              bg: selectedCategory === category ? 'blue.600' : 'gray.50',
              borderColor: selectedCategory === category ? 'blue.600' : 'gray.300',
            }}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </Flex>

      {/* 경쟁사 카드 리스트 */}
      <Flex direction="column" gap="16px">
        {filteredCompetitors.map((competitor) => (
          <Card
            key={competitor.id}
            bg={cardBg}
            p="20px"
            borderRadius="20px"
          >
            <Flex align="flex-start" justify="space-between" gap="20px">
              {/* 좌측: 로고 + 브랜드 정보 */}
              <Flex gap="12px" flex="1">
                <Box
                  w="48px"
                  h="48px"
                  borderRadius="8px"
                  bg="gray.100"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="700"
                  fontSize="xs"
                  color="gray.600"
                  flexShrink="0"
                >
                  {competitor.logo.substring(0, 2).toUpperCase()}
                </Box>

                <Box flex="1">
                  {/* 브랜드명과 게재 중이 같은 줄 */}
                  <Flex align="center" gap="12px" mb="8px">
                    <Text
                      color={textColor}
                      fontSize="md"
                      fontWeight="700"
                    >
                      {competitor.name}
                    </Text>
                    <Text
                      color="green.500"
                      fontSize="sm"
                      fontWeight="600"
                    >
                      {competitor.adsCount}개 게재 중
                    </Text>
                  </Flex>

                  {/* 소셜 미디어 정보 - 작게 */}
                  <Flex direction="column" gap="4px">
                    <Flex align="center" gap="6px">
                      <Icon as={FaFacebook} color="#1877F2" w="14px" h="14px" />
                      <Text fontSize="13px" color={textColorSecondary}>
                        {competitor.facebook.handle}
                      </Text>
                      {competitor.facebook.verified && (
                        <Box
                          as="span"
                          w="14px"
                          h="14px"
                          borderRadius="full"
                          bg="blue.500"
                          display="inline-flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text color="white" fontSize="9px">✓</Text>
                        </Box>
                      )}
                      <Text fontSize="12px" color={textColorSecondary}>
                        ID: {competitor.facebook.id}
                      </Text>
                    </Flex>
                    <Flex align="center" gap="6px">
                      <Icon as={FaInstagram} color="#E4405F" w="14px" h="14px" />
                      <Text fontSize="13px" color={textColorSecondary}>
                        {competitor.instagram.handle}
                      </Text>
                      {competitor.instagram.verified && (
                        <Box
                          as="span"
                          w="14px"
                          h="14px"
                          borderRadius="full"
                          bg="blue.500"
                          display="inline-flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text color="white" fontSize="9px">✓</Text>
                        </Box>
                      )}
                    </Flex>
                  </Flex>
                </Box>
              </Flex>

              {/* 우측: 모니터링에 추가 버튼 */}
              <Button
                size="sm"
                variant="ghost"
                color="brand.500"
                borderRadius="8px"
                fontWeight="500"
                fontSize="13px"
                leftIcon={<Icon as={MdAdd} w="16px" h="16px" />}
                _hover={{
                  bg: 'brand.50',
                }}
                flexShrink="0"
              >
                모니터링에 추가
              </Button>
            </Flex>
          </Card>
        ))}
      </Flex>

      {/* 데이터가 없을 때 */}
      {filteredCompetitors.length === 0 && (
        <Box
          textAlign="center"
          py="60px"
        >
          <Text color={textColorSecondary} fontSize="md">
            해당 카테고리에 추천할 경쟁사가 없습니다.
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default Monitoring;
