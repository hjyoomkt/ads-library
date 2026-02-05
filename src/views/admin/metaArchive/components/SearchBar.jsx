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
  Flex
} from '@chakra-ui/react';
import { MdKeyboardArrowDown } from 'react-icons/md';
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
        title: 'Scraping started',
        description: `Job ID: ${jobId}`,
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

  return (
    <Card p='20px' mb='20px'>
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="bold" color={textColor}>
          Search & Scrape Ads
        </Text>
        <Box as="form" onSubmit={handleSubmit}>
          <Flex align='center' gap='12px' flexWrap='wrap'>
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<MdKeyboardArrowDown />}
                bg={inputBg}
                border='1px solid'
                borderColor={borderColor}
                color={textColor}
                fontWeight='500'
                fontSize='sm'
                _hover={{ bg: bgHover }}
                _active={{ bg: bgHover }}
                px='16px'
                h='36px'
                borderRadius='12px'
                minW='120px'
              >
                {searchType === 'keyword' ? 'Keyword' : 'Advertiser'}
              </MenuButton>
              <MenuList minW='auto' w='fit-content' px='8px' py='8px' zIndex={2000}>
                <MenuItem
                  onClick={() => setSearchType('keyword')}
                  bg={searchType === 'keyword' ? brandColor : 'transparent'}
                  color={searchType === 'keyword' ? 'white' : textColor}
                  _hover={{
                    bg: searchType === 'keyword' ? brandColor : bgHover,
                  }}
                  fontWeight={searchType === 'keyword' ? '600' : '500'}
                  fontSize='sm'
                  px='12px'
                  py='8px'
                  borderRadius='8px'
                  justifyContent='center'
                  textAlign='center'
                  minH='auto'
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
                  fontSize='sm'
                  px='12px'
                  py='8px'
                  borderRadius='8px'
                  justifyContent='center'
                  textAlign='center'
                  minH='auto'
                >
                  Advertiser
                </MenuItem>
              </MenuList>
            </Menu>

            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<MdKeyboardArrowDown />}
                bg={inputBg}
                border='1px solid'
                borderColor={borderColor}
                color={textColor}
                fontWeight='500'
                fontSize='sm'
                _hover={{ bg: bgHover }}
                _active={{ bg: bgHover }}
                px='16px'
                h='36px'
                borderRadius='12px'
                minW='120px'
              >
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </MenuButton>
              <MenuList minW='auto' w='fit-content' px='8px' py='8px' zIndex={2000}>
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
                    fontSize='sm'
                    px='12px'
                    py='8px'
                    borderRadius='8px'
                    justifyContent='center'
                    textAlign='center'
                    minH='auto'
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>

            <Input
              placeholder={
                searchType === 'keyword'
                  ? 'e.g. delivery, coupon'
                  : 'e.g. Coupang, Baemin'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              size='sm'
              h='36px'
              bg={inputBg}
              color={inputTextColor}
              borderColor={borderColor}
              borderRadius='12px'
              fontSize='sm'
              fontFamily='DM Sans'
              fontWeight='500'
              flex='1'
              minW='200px'
              _focus={{ borderColor: brandColor }}
            />

            <Button
              type="submit"
              bg={brandColor}
              color='white'
              fontWeight='500'
              fontSize='sm'
              _hover={{ opacity: 0.9 }}
              _active={{ opacity: 0.8 }}
              isLoading={loading}
              loadingText="Searching..."
              px='16px'
              h='36px'
              borderRadius='12px'
              minW='120px'
            >
              Search
            </Button>
          </Flex>
        </Box>
      </VStack>
    </Card>
  );
}
