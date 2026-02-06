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
  WrapItem,
  Icon,
  Collapse,
  SimpleGrid
} from '@chakra-ui/react';
import { MdRefresh, MdSearch, MdBusiness, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { getSearchHistory, scrapeByKeyword, scrapeByAdvertiser } from 'services/apiService';
import Card from 'components/card/Card';

export default function SavedSearchesSidebar({
  onSearchClick,
  refreshTrigger,
  inline = false,
  onSearchHistoryLoaded,
  onCollapseChange
}) {
  const [searches, setSearches] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshingId, setRefreshingId] = useState(null);
  const toast = useToast();

  // 접기/펼치기 상태 (localStorage에서 복원)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('searchSidebarCollapsed');
    return saved === 'true';
  });

  // 상수 정의
  const EXPANDED_WIDTH = '300px';
  const COLLAPSED_WIDTH = '0px';
  const SIDEBAR_LEFT_POSITION = '70px'; // AdminIconSidebar 너비

  useEffect(() => {
    loadSearches();
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) {
      loadSearches();
    }
  }, [refreshTrigger]);

  // localStorage에 상태 저장 및 부모에 알림
  useEffect(() => {
    localStorage.setItem('searchSidebarCollapsed', isCollapsed);
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

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

  const handleSearchClick = (search) => {
    const searchKey = `${search.search_type}:${search.search_query}`;
    setSelectedId(searchKey);
    onSearchClick(search);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60); // 분 단위

    if (diff < 60) return `${diff}분 전`;
    if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
    if (diff < 10080) return `${Math.floor(diff / 1440)}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  // 검색 카드 컴포넌트
  const SearchCard = ({ search, isInline = false }) => {
    const searchKey = `${search.search_type}:${search.search_query}`;
    const isRefreshing = refreshingId === searchKey;
    const isSelected = selectedId === searchKey;

    return (
      <Card
        p={4}
        cursor="pointer"
        bg={isSelected ? 'blue.50' : 'white'}
        borderLeft="3px solid"
        borderLeftColor={isSelected ? 'brand.500' : 'transparent'}
        _hover={{
          bg: 'gray.50',
          transform: isInline ? 'none' : 'translateX(4px)',
          boxShadow: 'md'
        }}
        transition="all 0.2s"
        onClick={() => handleSearchClick(search)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSearchClick(search);
          }
        }}
        _focus={{
          outline: '2px solid',
          outlineColor: 'brand.500',
          outlineOffset: '2px'
        }}
      >
        {/* 아이콘 + 제목 */}
        <HStack spacing={3} mb={3}>
          <Box
            w="40px"
            h="40px"
            bg={search.search_type === 'keyword' ? 'blue.50' : 'purple.50'}
            borderRadius="10px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon
              as={search.search_type === 'keyword' ? MdSearch : MdBusiness}
              w="20px"
              h="20px"
              color={search.search_type === 'keyword' ? 'blue.500' : 'purple.500'}
            />
          </Box>

          <VStack align="start" spacing={0} flex="1" minW="0">
            <Text fontSize="md" fontWeight="bold" noOfLines={1}>
              {search.search_query}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {search.search_type === 'keyword' ? '키워드' : '광고주'}
            </Text>
          </VStack>
        </HStack>

        {/* 메타 정보 */}
        <HStack justify="space-between" mb={2}>
          <Badge colorScheme="green" fontSize="xs" fontWeight="600">
            {search.total_ads_count || 0} ads
          </Badge>

          {search.last_searched_at && (
            <Text fontSize="xs" color="gray.500">
              {formatDate(search.last_searched_at)}
            </Text>
          )}
        </HStack>

        {/* 새로고침 버튼 */}
        <HStack justify="flex-end">
          <Tooltip label="최신 광고 데이터 수집" placement="top" fontSize="xs">
            <IconButton
              icon={<MdRefresh />}
              size="xs"
              variant="ghost"
              colorScheme="blue"
              isLoading={isRefreshing}
              onClick={(e) => {
                e.stopPropagation();
                handleRefresh(search);
              }}
              aria-label="Refresh search"
            />
          </Tooltip>
        </HStack>
      </Card>
    );
  };

  // Inline 모드 (SearchBar 아래, xl 미만)
  if (inline) {
    return (
      <Card p="20px" mb={4}>
        <VStack spacing={3} align="stretch">
          <HStack justify="space-between">
            <Text fontSize="md" fontWeight="bold">
              검색 기록
            </Text>
            <Badge colorScheme="blue" fontSize="xs">
              {searches.length}
            </Badge>
          </HStack>

          {searches.length === 0 ? (
            <VStack spacing={4} py={8} px={4}>
              <Icon as={MdSearch} w="48px" h="48px" color="gray.300" />
              <Text fontSize="sm" color="gray.500" textAlign="center">
                검색 기록이 없습니다
              </Text>
              <Text fontSize="xs" color="gray.400" textAlign="center">
                키워드를 검색하여<br />경쟁사 모니터링을 시작하세요
              </Text>
            </VStack>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              {searches.map((search) => (
                <SearchCard
                  key={`${search.search_type}:${search.search_query}`}
                  search={search}
                  isInline
                />
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Card>
    );
  }

  // Fixed 사이드바 모드 (xl 이상)
  return (
    <>
      {/* 토글 버튼 - 항상 보임 */}
      <IconButton
        position="fixed"
        left={isCollapsed ? SIDEBAR_LEFT_POSITION : `calc(${SIDEBAR_LEFT_POSITION} + ${EXPANDED_WIDTH} - 15px)`}
        top="80px"
        icon={isCollapsed ? <MdChevronRight /> : <MdChevronLeft />}
        onClick={() => setIsCollapsed(!isCollapsed)}
        size="sm"
        bg="brand.500"
        color="white"
        borderRadius="full"
        boxShadow="lg"
        zIndex="1000"
        _hover={{
          bg: 'brand.600',
          transform: 'scale(1.1)'
        }}
        _active={{
          bg: 'brand.700'
        }}
        transition="left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        aria-label={isCollapsed ? "경쟁사 모니터링 펼치기" : "경쟁사 모니터링 접기"}
      />

      {/* 사이드바 콘텐츠 */}
      <Box
        position="fixed"
        left={SIDEBAR_LEFT_POSITION}
        top="60px"
        width={isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}
        height="calc(100vh - 60px)"
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        zIndex="999"
        overflow="hidden"
      >
        <Collapse in={!isCollapsed} animateOpacity>
          <Box
            width={EXPANDED_WIDTH}
            height="calc(100vh - 60px)"
            bg="white"
            borderRight="1px solid"
            borderColor="gray.200"
            overflowY="auto"
            p={4}
          >
            {/* 헤더 */}
            <HStack justify="space-between" mb={4}>
              <Text fontSize="lg" fontWeight="bold" color="secondaryGray.900">
                경쟁사 모니터링
              </Text>
              <Badge colorScheme="blue" fontSize="xs">
                {searches.length}
              </Badge>
            </HStack>

            {/* 검색 기록 카드 */}
            {searches.length === 0 ? (
              <VStack spacing={4} py={8} px={4}>
                <Icon as={MdSearch} w="48px" h="48px" color="gray.300" />
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  검색 기록이 없습니다
                </Text>
                <Text fontSize="xs" color="gray.400" textAlign="center">
                  키워드를 검색하여<br />경쟁사 모니터링을 시작하세요
                </Text>
              </VStack>
            ) : (
              <VStack spacing={3} align="stretch">
                {searches.map((search) => (
                  <SearchCard
                    key={`${search.search_type}:${search.search_query}`}
                    search={search}
                  />
                ))}
              </VStack>
            )}
          </Box>
        </Collapse>
      </Box>
    </>
  );
}
