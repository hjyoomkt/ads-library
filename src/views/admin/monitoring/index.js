import React, { useState, useEffect } from 'react';
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
  Spinner,
  useToast,
} from '@chakra-ui/react';
import { MdAdd, MdKeyboardArrowDown, MdSearch, MdBusiness } from 'react-icons/md';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import Card from 'components/card/Card';
import { getPopularSearches, saveSearchHistory } from 'services/apiService';
import { useAuth } from 'contexts/AuthContext';

const Monitoring = () => {
  const { currentAdvertiserId } = useAuth();
  const [competitorData, setCompetitorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const toast = useToast();

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorSecondary = useColorModeValue('secondaryGray.700', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const bgButton = useColorModeValue('white', 'whiteAlpha.100');
  const bgHover = useColorModeValue('secondaryGray.100', 'whiteAlpha.50');
  const bgActive = useColorModeValue('brand.500', 'brand.400');
  const cardBg = useColorModeValue('white', 'navy.800');

  // 인기 검색어 로드
  useEffect(() => {
    loadPopularSearches();
  }, []);

  const loadPopularSearches = async () => {
    try {
      setLoading(true);
      const data = await getPopularSearches(20);
      setCompetitorData(data);
    } catch (error) {
      console.error('Failed to load popular searches:', error);
      toast({
        title: '데이터 로드 실패',
        description: error.message || '인기 검색어를 불러오는데 실패했습니다',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${month}.${day} ${hours}:${minutes} 업데이트`;
  };

  const handleAddToMonitoring = async (search) => {
    if (!currentAdvertiserId) {
      toast({
        title: '브랜드 선택 필요',
        description: '브랜드를 먼저 선택해주세요',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    const searchKey = `${search.search_type}:${search.search_query}`;
    setAddingId(searchKey);

    try {
      await saveSearchHistory(search.search_type, search.search_query, currentAdvertiserId);

      toast({
        title: '모니터링에 추가됨',
        description: `"${search.search_query}"을(를) 모니터링 목록에 추가했습니다`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      // 중복 에러는 무시
      if (error.message && error.message.includes('already')) {
        toast({
          title: '이미 추가됨',
          description: '이미 모니터링 중인 검색어입니다',
          status: 'info',
          duration: 3000,
          isClosable: true
        });
      } else {
        toast({
          title: '추가 실패',
          description: error.message || '모니터링 추가에 실패했습니다',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      }
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      {/* 헤더 섹션 - 중앙 정렬 */}
      <Flex direction="column" align="center" mb="40px" textAlign="center">
        <Text
          bgGradient="linear(to-r, brand.500, purple.500)"
          bgClip="text"
          fontSize="lg"
          fontWeight="600"
          mb="0px"
          letterSpacing="tight"
        >
          다른 마케터들은 이 경쟁사를 추가했어요
        </Text>
        <Flex align="center" gap="12px" mb="2px">
          <Text
            color={textColor}
            fontSize="4xl"
            fontWeight="700"
          >
            분야별 추천 경쟁사
          </Text>
          <Badge
            colorScheme="purple"
            fontSize="sm"
            px="10px"
            py="3px"
            borderRadius="full"
            border="1px solid"
            borderColor="purple.500"
            bg="white"
            color="purple.500"
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
      </Flex>

      {/* 로딩 상태 */}
      {loading && (
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" color="brand.500" thickness="4px" />
        </Flex>
      )}

      {/* 경쟁사 카드 리스트 */}
      {!loading && (
        <Flex direction="column" gap="16px">
          {competitorData.map((search) => {
            const searchKey = `${search.search_type}:${search.search_query}`;
            const isAdding = addingId === searchKey;

            return (
              <Card
                key={searchKey}
                bg={cardBg}
                p="16px"
                borderRadius="12px"
              >
                <Flex align="flex-start" justify="space-between" gap="16px">
                  {/* 좌측: 아이콘 + 검색어 정보 */}
                  <Flex gap="10px" flex="1" align="flex-start">
                    {/* 아이콘 - 작게 */}
                    <Box
                      w="32px"
                      h="32px"
                      borderRadius="8px"
                      bg="gray.100"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink="0"
                      mt="2px"
                    >
                      <Icon
                        as={search.search_type === 'keyword' ? MdSearch : MdBusiness}
                        w="18px"
                        h="18px"
                        color="gray.600"
                      />
                    </Box>

                    <Box flex="1">
                      {/* 1줄: 브랜드명 + 게재중 배지 */}
                      <Flex align="center" gap="8px" mb="6px">
                        <Text
                          color={textColor}
                          fontSize="md"
                          fontWeight="700"
                          lineHeight="1.2"
                        >
                          {search.search_query}
                        </Text>
                        <Badge
                          colorScheme="green"
                          fontSize="xs"
                          px={2}
                          py={0.5}
                          borderRadius="4px"
                        >
                          {search.total_ads_count}개 게재 중
                        </Badge>
                      </Flex>

                      {/* 2줄: 타입 배지 + 통계 정보 */}
                      <Flex align="center" gap="6px" mb="4px">
                        <Badge
                          colorScheme={search.search_type === 'keyword' ? 'blue' : 'purple'}
                          fontSize="10px"
                          px={2}
                          py={0.5}
                          borderRadius="4px"
                        >
                          {search.search_type === 'keyword' ? 'Keyword' : 'Advertiser'}
                        </Badge>
                        <Text fontSize="12px" color={textColorSecondary}>
                          {search.unique_users_count}명이 모니터링 중
                        </Text>
                        <Text fontSize="12px" color={textColorSecondary}>
                          • 총 {search.search_count}회 검색됨
                        </Text>
                      </Flex>

                      {/* 3줄: Meta 아이콘 */}
                      <Flex align="center" gap="6px">
                        <Icon as={FaFacebook} color="#1877F2" w="14px" h="14px" />
                        <Text fontSize="12px" color={textColorSecondary}>
                          Meta 광고 라이브러리
                        </Text>
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
                    onClick={() => handleAddToMonitoring(search)}
                    isLoading={isAdding}
                    loadingText="추가 중"
                  >
                    모니터링에 추가
                  </Button>
                </Flex>
              </Card>
            );
          })}
        </Flex>
      )}

      {/* 데이터가 없을 때 */}
      {!loading && competitorData.length === 0 && (
        <Box
          textAlign="center"
          py="60px"
        >
          <Icon as={MdSearch} w="64px" h="64px" color="gray.300" mb="16px" />
          <Text color={textColor} fontSize="lg" fontWeight="600" mb="8px">
            추천할 경쟁사가 없습니다
          </Text>
          <Text color={textColorSecondary} fontSize="md">
            다른 사용자들이 검색한 브랜드가 없거나<br />
            아직 광고 데이터가 수집되지 않았습니다.
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default Monitoring;
