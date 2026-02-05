import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  IconButton,
  useToast,
  Tooltip,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { MdRefresh, MdSearch, MdBusiness } from 'react-icons/md';
import { getSearchHistory, scrapeByKeyword, scrapeByAdvertiser } from 'services/apiService';
import Card from 'components/card/Card';

export default function SavedSearchesSidebar({ onSearchClick, refreshTrigger, inline = false, onSearchHistoryLoaded }) {
  const [searches, setSearches] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshingId, setRefreshingId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    loadSearches();
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) {
      loadSearches();
    }
  }, [refreshTrigger]);

  const loadSearches = async () => {
    try {
      console.log('🔍 Loading search history...');
      const data = await getSearchHistory();
      console.log('✅ Search history loaded:', data);
      setSearches(data);

      // 부모 컴포넌트에 검색 기록 개수와 쿼리 목록 전달
      if (onSearchHistoryLoaded) {
        const searchQueries = data.map(s => s.search_query);
        onSearchHistoryLoaded(data.length, searchQueries);
      }
    } catch (error) {
      console.error('❌ Failed to load search history:', error);
      toast({
        title: '검색 기록 로드 실패',
        description: error.message || '데이터를 불러오는데 실패했습니다',
        status: 'error',
        duration: 5000,
        isClosable: true
      });

      // 에러 시에도 0으로 알림
      if (onSearchHistoryLoaded) {
        onSearchHistoryLoaded(0, []);
      }
    }
  };

  const handleRefresh = async (search) => {
    try {
      setRefreshingId(`${search.search_type}:${search.search_query}`);

      const scrapeFunc = search.search_type === 'keyword' ? scrapeByKeyword : scrapeByAdvertiser;
      const { jobId } = await scrapeFunc(search.search_query, 'meta');

      toast({
        title: '업데이트 시작',
        description: `Job ID: ${jobId}`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      // 잠시 후 새로고침
      setTimeout(() => {
        loadSearches();
        setRefreshingId(null);
      }, 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      setRefreshingId(null);
    }
  };

  // Inline 모드 (SearchBar 아래)
  if (inline) {
    return (
      <Card p="20px">
        <VStack spacing={3} align="stretch">
          <Text fontSize="md" fontWeight="bold">
            Search History
          </Text>

          {searches.length === 0 ? (
            <Text fontSize="sm" color="gray.500" textAlign="center" py={2}>
              검색 기록이 없습니다
            </Text>
          ) : (
            <Wrap spacing={2}>
              {searches.map((search) => {
                const searchKey = `${search.search_type}:${search.search_query}`;
                const isRefreshing = refreshingId === searchKey;

                return (
                  <WrapItem key={searchKey}>
                    <Card
                      p={3}
                      cursor="pointer"
                      bg={selectedId === searchKey ? 'blue.50' : 'white'}
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => {
                        setSelectedId(searchKey);
                        onSearchClick(search);
                      }}
                      minW="200px"
                    >
                      <HStack spacing={2} mb={2}>
                        <Text fontSize="lg">
                          {search.search_type === 'keyword' ? <MdSearch /> : <MdBusiness />}
                        </Text>
                        <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
                          {search.search_query}
                        </Text>
                      </HStack>

                      <HStack justify="space-between" spacing={1}>
                        <Badge colorScheme="blue" fontSize="xs">
                          {search.total_ads_count || 0} ads
                        </Badge>

                        <Tooltip
                          label="연동/업데이트"
                          fontSize="xs"
                          placement="top"
                        >
                          <IconButton
                            icon={<MdRefresh />}
                            size="xs"
                            variant="ghost"
                            isLoading={isRefreshing}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRefresh(search);
                            }}
                            aria-label="Refresh"
                          />
                        </Tooltip>
                      </HStack>
                    </Card>
                  </WrapItem>
                );
              })}
            </Wrap>
          )}
        </VStack>
      </Card>
    );
  }

  // Fixed 사이드바 모드 (xl 이상)
  return (
    <>
      <Box
        position="fixed"
        left="250px"
        top={{ base: '130px', md: '100px', xl: '100px' }}
        w="200px"
        h="calc(100vh - 100px)"
        bg="white"
        borderRight="1px"
        borderColor="gray.200"
        p={3}
        overflowY="auto"
        zIndex="1"
      >
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="bold">
              Search History
            </Text>
          </HStack>

          {searches.length === 0 ? (
            <Card p={4} textAlign="center">
              <Text fontSize="sm" color="gray.500">
                검색 기록이 없습니다. 키워드를 검색해보세요.
              </Text>
            </Card>
          ) : (
            <VStack spacing={2} align="stretch">
              {searches.map((search) => {
                const searchKey = `${search.search_type}:${search.search_query}`;
                const isRefreshing = refreshingId === searchKey;

                return (
                  <Card
                    key={searchKey}
                    p={3}
                    cursor="pointer"
                    bg={selectedId === searchKey ? 'blue.50' : 'white'}
                    _hover={{ bg: 'gray.50' }}
                    onClick={() => {
                      setSelectedId(searchKey);
                      onSearchClick(search);
                    }}
                  >
                    <HStack justify="space-between" mb={2}>
                      <HStack flex="1" minW="0">
                        <Text fontSize="lg">
                          {search.search_type === 'keyword' ? <MdSearch /> : <MdBusiness />}
                        </Text>
                        <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
                          {search.search_query}
                        </Text>
                      </HStack>
                    </HStack>

                    <HStack justify="space-between" spacing={1}>
                      <Badge colorScheme="blue" fontSize="xs">
                        {search.total_ads_count || 0} ads
                      </Badge>

                      <Tooltip
                        label="연동/업데이트: 최신 광고 데이터를 다시 수집합니다"
                        fontSize="xs"
                        placement="top"
                      >
                        <IconButton
                          icon={<MdRefresh />}
                          size="xs"
                          variant="ghost"
                          isLoading={isRefreshing}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRefresh(search);
                          }}
                          aria-label="Refresh"
                        />
                      </Tooltip>
                    </HStack>

                    {search.last_searched_at && (
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Last: {new Date(search.last_searched_at).toLocaleDateString()}
                      </Text>
                    )}
                  </Card>
                );
              })}
            </VStack>
          )}
        </VStack>
      </Box>

    </>
  );
}
