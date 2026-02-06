import { useState, useEffect } from 'react';
import { Box, Text, VStack, Icon, Spinner, useColorModeValue } from '@chakra-ui/react';
import { MdCheckCircle, MdError } from 'react-icons/md';
import { getJobStatus } from 'services/apiService';

export default function JobTracker({ jobId, onComplete }) {
  const [job, setJob] = useState(null);
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorSecondary = useColorModeValue('secondaryGray.600', 'gray.400');

  useEffect(() => {
    if (!jobId) return;

    let interval;
    let isCompleted = false; // 완료 플래그

    const checkStatus = async () => {
      if (isCompleted) return true; // 이미 완료되었으면 더 이상 체크하지 않음

      try {
        const status = await getJobStatus(jobId);
        setJob(status);

        if (status.status === 'completed') {
          isCompleted = true; // 완료 플래그 설정
          if (onComplete) {
            onComplete();
          }
          return true; // 완료됨
        } else if (status.status === 'failed') {
          isCompleted = true;
          return true; // 실패함
        }
        return false; // 계속 진행
      } catch (error) {
        console.error('Failed to fetch job status:', error);
        isCompleted = true;
        return true; // 에러 발생 시 중단
      }
    };

    const startTracking = async () => {
      // 초기 상태를 pending으로 설정
      setJob({ status: 'pending', progress: 0, totalAds: 0 });

      // 첫 번째 상태 확인
      const shouldStop = await checkStatus();

      // 완료되지 않았으면 계속 확인
      if (!shouldStop) {
        interval = setInterval(async () => {
          const stop = await checkStatus();
          if (stop && interval) {
            clearInterval(interval);
          }
        }, 2000);
      }
    };

    startTracking();

    return () => {
      isCompleted = true; // cleanup 시 완료 플래그 설정
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [jobId]); // onComplete dependency 제거

  if (!job) return null;

  // Completed 상태 - 완료되면 이것만 표시
  if (job.status === 'completed') {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        py="40px"
      >
        <VStack spacing={4}>
          <Icon
            as={MdCheckCircle}
            color="green.500"
            boxSize="48px"
          />
          <VStack spacing={1}>
            <Text
              color={textColor}
              fontSize="lg"
              fontWeight="600"
            >
              크리에이티브 수집이 완료되었습니다
            </Text>
            {job.totalAds > 0 && (
              <Text
                color={textColorSecondary}
                fontSize="sm"
              >
                총 {job.totalAds}개의 광고를 수집했습니다
              </Text>
            )}
          </VStack>
        </VStack>
      </Box>
    );
  }

  // Failed 상태
  if (job.status === 'failed') {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        py="40px"
      >
        <VStack spacing={4}>
          <Icon
            as={MdError}
            color="red.500"
            boxSize="48px"
          />
          <VStack spacing={1}>
            <Text
              color={textColor}
              fontSize="lg"
              fontWeight="600"
            >
              수집 중 오류가 발생했습니다
            </Text>
            <Text
              color={textColorSecondary}
              fontSize="sm"
            >
              다시 시도해주세요
            </Text>
          </VStack>
        </VStack>
      </Box>
    );
  }

  // 그 외 모든 상태 (pending, processing, 기타) - 완료되기 전까지는 계속 수집중 표시
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      py="40px"
    >
      <VStack spacing={4}>
        <Spinner
          size="xl"
          color="brand.500"
          thickness="4px"
          speed="0.8s"
        />
        <VStack spacing={1}>
          <Text
            color={textColor}
            fontSize="lg"
            fontWeight="600"
          >
            데이터 수집중
          </Text>
          <Text
            color={textColorSecondary}
            fontSize="sm"
          >
            조금만 기다려주세요
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
}
