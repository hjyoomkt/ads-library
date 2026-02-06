import { useState } from 'react';
import {
  Box,
  Input,
  Button,
  HStack,
  useToast,
  Text,
  VStack,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Icon,
  Flex,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react';
import { MdKeyboardArrowDown, MdSearch, MdArrowForward, MdPalette, MdCake, MdCardGiftcard, MdCelebration, MdLocalOffer } from 'react-icons/md';
import Card from 'components/card/Card';
import { scrapeByKeyword, scrapeByAdvertiser } from 'services/apiService';
import { saveSearchHistory } from 'services/supabaseService';
import { useAuth } from 'contexts/AuthContext';

export default function SearchBar({ onScrapeStart, onSearchSaved }) {
  const { currentAdvertiserId } = useAuth();
  const [searchType, setSearchType] = useState('keyword');
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('meta');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const brandColor = useColorModeValue('brand.500', 'white');
  const borderColor = useColorModeValue('secondaryGray.100', 'whiteAlpha.100');
  const bgHover = useColorModeValue('secondaryGray.100', 'whiteAlpha.100');
  const inputBg = useColorModeValue('white', 'navy.700');
  const inputTextColor = useColorModeValue('secondaryGray.900', 'white');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!query.trim()) {
      toast({
        title: 'Search query required',
        description: 'Please enter a keyword or advertiser name',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setLoading(true);

    try {
      const trimmedQuery = query.trim();

      // 1. 스크래핑 시작 (백엔드)
      const scrapeFunc = searchType === 'keyword' ? scrapeByKeyword : scrapeByAdvertiser;
      const { jobId } = await scrapeFunc(trimmedQuery, platform);

      // 2. 검색 히스토리 저장 (프론트엔드 → Supabase 직접)
      if (currentAdvertiserId) {
        try {
          await saveSearchHistory(searchType, trimmedQuery, currentAdvertiserId);
        } catch (saveError) {
          console.error('Failed to save search history:', saveError);
          // 히스토리 저장 실패해도 검색은 계속 진행
        }
      } else {
        console.warn('No advertiser selected - search history not saved');
      }

      toast({
        title: `${trimmedQuery} 정보 수집중입니다`,
        description: `${searchType === 'keyword' ? '키워드' : '광고주'} 검색으로 광고 데이터를 수집하고 있습니다`,
        status: 'success',
        duration: 5000,
        isClosable: true
      });

      onScrapeStart(jobId);

      // 사이드바 새로고침
      if (onSearchSaved) {
        onSearchSaved();
      }

      setQuery('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start scraping',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const recommendedKeywords = [
    { icon: MdPalette, text: '화합력 그룹' },
    { icon: MdCake, text: '저장 디저트' },
    { icon: MdLocalOffer, text: '신규 기입 혜택' },
    { icon: MdCelebration, text: '신년 프로모션' },
    { icon: MdCardGiftcard, text: '설 선물세트' }
  ];

  return (
    <Box maxW="1200px" mx="auto" w="100%">
      <VStack spacing={6} align="stretch">
        {/* 큰 검색 박스 */}
        <Box
          as="form"
          onSubmit={handleSubmit}
          border="2px solid"
          borderColor="blue.500"
          borderRadius="20px"
          bg="transparent"
          overflow="hidden"
        >
          {/* 검색 입력 영역 */}
          <Box p="24px" pb="20px" bg="white">
            <Flex align="center" gap={3}>
              <InputGroup flex="1">
                <InputLeftElement pointerEvents="none" h="full" pl="8px">
                  <Icon as={MdSearch} w="24px" h="24px" color="blue.500" />
                </InputLeftElement>
                <Input
                  placeholder="신용카드 할인 이벤트, 여름 세일 프로모션, 무료 배송 혜택"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  size="lg"
                  h="56px"
                  border="none"
                  fontSize="md"
                  fontWeight="400"
                  pl="48px"
                  bg="transparent"
                  _focus={{ outline: 'none', boxShadow: 'none' }}
                  _placeholder={{ color: 'gray.400' }}
                />
              </InputGroup>

              <Button
                type="submit"
                bg={query.trim() ? "blue.500" : "gray.300"}
                color={query.trim() ? "white" : "gray.900"}
                fontWeight="600"
                fontSize="sm"
                rightIcon={<MdArrowForward />}
                _hover={{ bg: query.trim() ? 'blue.600' : 'gray.200' }}
                _active={{ bg: query.trim() ? 'blue.700' : 'gray.200' }}
                isLoading={loading}
                isDisabled={!query.trim()}
                loadingText="찾는 중..."
                px="24px"
                h="48px"
                borderRadius="12px"
                minW="140px"
                flexShrink={0}
                cursor={query.trim() ? 'pointer' : 'not-allowed'}
              >
                콘텐츠 찾기
              </Button>
            </Flex>
          </Box>

          {/* 키워드/매체 선택 드롭다운 - 회색 배경 */}
          <Box bg="gray.50" px="24px" py="16px">
            <Flex gap={3}>
              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<MdKeyboardArrowDown />}
                  bg="white"
                  border="1px solid"
                  borderColor="gray.200"
                  color={textColor}
                  fontWeight="500"
                  fontSize="sm"
                  _hover={{ bg: 'gray.50' }}
                  _active={{ bg: 'gray.50' }}
                  px="16px"
                  h="36px"
                  borderRadius="8px"
                  leftIcon={<Icon as={MdSearch} w="16px" h="16px" />}
                >
                  {searchType === 'keyword' ? 'Keyword' : 'Advertiser'}
                </MenuButton>
                <MenuList minW="auto" w="fit-content" px="8px" py="8px" zIndex={2000}>
                  <MenuItem
                    onClick={() => setSearchType('keyword')}
                    bg={searchType === 'keyword' ? brandColor : 'transparent'}
                    color={searchType === 'keyword' ? 'white' : textColor}
                    _hover={{
                      bg: searchType === 'keyword' ? brandColor : bgHover,
                    }}
                    fontWeight={searchType === 'keyword' ? '600' : '500'}
                    fontSize="sm"
                    px="12px"
                    py="8px"
                    borderRadius="8px"
                    justifyContent="center"
                    textAlign="center"
                    minH="auto"
                  >
                    Keyword
                  </MenuItem>
                  <MenuItem
                    onClick={() => setSearchType('advertiser')}
                    bg={searchType === 'advertiser' ? brandColor : 'transparent'}
                    color={searchType === 'advertiser' ? 'white' : textColor}
                    _hover={{
                      bg: searchType === 'advertiser' ? brandColor : bgHover,
                    }}
                    fontWeight={searchType === 'advertiser' ? '600' : '500'}
                    fontSize="sm"
                    px="12px"
                    py="8px"
                    borderRadius="8px"
                    justifyContent="center"
                    textAlign="center"
                    minH="auto"
                  >
                    Advertiser
                  </MenuItem>
                </MenuList>
              </Menu>

              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<MdKeyboardArrowDown />}
                  bg="white"
                  border="1px solid"
                  borderColor="gray.200"
                  color={textColor}
                  fontWeight="500"
                  fontSize="sm"
                  _hover={{ bg: 'gray.50' }}
                  _active={{ bg: 'gray.50' }}
                  px="16px"
                  h="36px"
                  borderRadius="8px"
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </MenuButton>
                <MenuList minW="auto" w="fit-content" px="8px" py="8px" zIndex={2000}>
                  {['meta', 'google', 'naver', 'kakao'].map((p) => (
                    <MenuItem
                      key={p}
                      onClick={() => setPlatform(p)}
                      bg={platform === p ? brandColor : 'transparent'}
                      color={platform === p ? 'white' : textColor}
                      _hover={{
                        bg: platform === p ? brandColor : bgHover,
                      }}
                      fontWeight={platform === p ? '600' : '500'}
                      fontSize="sm"
                      px="12px"
                      py="8px"
                      borderRadius="8px"
                      justifyContent="center"
                      textAlign="center"
                      minH="auto"
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            </Flex>
          </Box>
        </Box>

        {/* 추천 키워드 */}
        <Flex gap={2} flexWrap="wrap" justify="center">
          {recommendedKeywords.map((keyword, index) => (
            <Button
              key={index}
              size="sm"
              variant="outline"
              borderRadius="full"
              px={4}
              h="36px"
              bg="white"
              borderColor="gray.200"
              _hover={{ bg: 'gray.50', borderColor: 'gray.300' }}
              onClick={() => setQuery(keyword.text)}
              leftIcon={<Icon as={keyword.icon} w="16px" h="16px" />}
              fontWeight="500"
              fontSize="sm"
              color="gray.700"
            >
              {keyword.text}
            </Button>
          ))}
        </Flex>
      </VStack>
    </Box>
  );
}
