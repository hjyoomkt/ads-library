import { Box, Flex, Grid, useDisclosure, HStack, Button, Text, VStack } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { getAds } from 'services/apiService';
import { useAuth } from 'contexts/AuthContext';
import SearchBar from './components/SearchBar';
import AdGrid from './components/AdGrid';
import AdDetailModal from './components/AdDetailModal';
import JobTracker from './components/JobTracker';
import SavedSearchesSidebar from './components/SavedSearchesSidebar';
import Card from 'components/card/Card';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

export default function MetaArchive() {
  const { user } = useAuth();
  const [ads, setAds] = useState(null);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [selectedAd, setSelectedAd] = useState(null);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [refreshSidebar, setRefreshSidebar] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [searchHistoryCount, setSearchHistoryCount] = useState(null);
  const [userSearchQueries, setUserSearchQueries] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    // 사용자가 검색하거나 저장된 검색을 클릭했을 때만 광고 로드
    if (hasInteracted) {
      loadAds();
    }
  }, [filters, page, hasInteracted]);

  const loadAds = async () => {
    try {
      const response = await getAds({ ...filters, page, limit: 50 });
      setAds(response.ads || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Failed to load ads:', error);
    }
  };

  const handleScrapeStart = (jobId) => {
    setCurrentJobId(jobId);
  };

  const handleSearchSaved = () => {
    // SavedSearchesSidebar를 새로고침하기 위해 state 업데이트
    setRefreshSidebar(prev => prev + 1);
  };

  const handleJobComplete = () => {
    loadAds();
    // Job 완료 시에도 사이드바 새로고침 (광고 수가 업데이트될 수 있음)
    setRefreshSidebar(prev => prev + 1);
  };

  const handleAdClick = (ad) => {
    setSelectedAd(ad);
    onOpen();
  };

  const handleSearchHistoryLoaded = (count, searchQueries = []) => {
    setSearchHistoryCount(count);
    setUserSearchQueries(searchQueries);

    // 검색 기록이 있으면 자동으로 해당 검색들의 광고만 표시
    if (count > 0 && searchQueries.length > 0) {
      setHasInteracted(true);
      // 사용자가 검색했던 쿼리들로 필터 설정
      setFilters({ searchQueries });
    }
  };

  const handleSavedSearchClick = (search) => {
    setHasInteracted(true);
    setFilters({
      search: search.search_query,
      platform: search.platform_filter
    });
    setPage(1);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < pagination.totalPages) {
      setPage(page + 1);
    }
  };

  // 동적 마진 계산
  const calculateMarginLeft = () => {
    const ICON_SIDEBAR_WIDTH = 70; // AdminIconSidebar
    const SEARCH_SIDEBAR_EXPANDED = 300; // SavedSearchesSidebar 펼침
    const SEARCH_SIDEBAR_COLLAPSED = 0; // SavedSearchesSidebar 접음
    const SPACING = -60;

    const searchSidebarWidth = isSidebarCollapsed
      ? SEARCH_SIDEBAR_COLLAPSED
      : SEARCH_SIDEBAR_EXPANDED;

    return `${ICON_SIDEBAR_WIDTH + searchSidebarWidth + SPACING}px`;
  };

  return (
    <Box>
      {/* xl 이상: 왼쪽 고정 사이드바 */}
      <Box display={{ base: 'none', xl: 'block' }}>
        <SavedSearchesSidebar
          onSearchClick={handleSavedSearchClick}
          refreshTrigger={refreshSidebar}
          onSearchHistoryLoaded={handleSearchHistoryLoaded}
          onCollapseChange={setIsSidebarCollapsed}
        />
      </Box>

      <Box
        ml={{
          base: '0px',
          xl: calculateMarginLeft()
        }}
        pt={{ base: '130px', md: '80px', xl: '80px' }}
        transition="margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        <Box mb="20px">
          <SearchBar
            onScrapeStart={(jobId) => {
              setHasInteracted(true);
              handleScrapeStart(jobId);
            }}
            onSearchSaved={handleSearchSaved}
          />
        </Box>

        {/* xl 미만: SearchBar 아래에 Search History 표시 */}
        <Box display={{ base: 'block', xl: 'none' }} mb="20px">
          <SavedSearchesSidebar
            onSearchClick={handleSavedSearchClick}
            refreshTrigger={refreshSidebar}
            inline={true}
            onSearchHistoryLoaded={handleSearchHistoryLoaded}
          />
        </Box>

        {currentJobId && (
          <Box mb="20px">
            <JobTracker jobId={currentJobId} onComplete={handleJobComplete} />
          </Box>
        )}

        {!hasInteracted ? (
          <Card p="40px" textAlign="center">
            <VStack spacing={4}>
              <Text color="gray.500" fontSize="lg" fontWeight="medium">
                수집된 광고가 없습니다
              </Text>
              <Text color="gray.400" fontSize="sm">
                검색을 실행하거나 저장된 검색을 선택해주세요
              </Text>
            </VStack>
          </Card>
        ) : (
          <AdGrid ads={ads || []} onAdClick={handleAdClick} />
        )}

        {pagination.totalPages > 1 && (
          <Card mt="20px" p="20px">
            <HStack justify="space-between" align="center">
              <Button
                leftIcon={<MdChevronLeft />}
                onClick={handlePrevPage}
                isDisabled={page === 1}
                colorScheme="brand"
                variant="outline"
              >
                Previous
              </Button>

              <Text fontWeight="medium">
                Page {page} of {pagination.totalPages} ({pagination.total} ads)
              </Text>

              <Button
                rightIcon={<MdChevronRight />}
                onClick={handleNextPage}
                isDisabled={page === pagination.totalPages}
                colorScheme="brand"
                variant="outline"
              >
                Next
              </Button>
            </HStack>
          </Card>
        )}

        <AdDetailModal ad={selectedAd} isOpen={isOpen} onClose={onClose} />
      </Box>
    </Box>
  );
}
