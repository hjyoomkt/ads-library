import { useState, useEffect } from 'react';
import { Box, Progress, Text, HStack, Icon } from '@chakra-ui/react';
import { MdCheckCircle, MdError, MdHourglassEmpty } from 'react-icons/md';
import { getJobStatus } from 'services/apiService';
import Card from 'components/card/Card';

const statusIcons = {
  pending: MdHourglassEmpty,
  processing: MdHourglassEmpty,
  completed: MdCheckCircle,
  failed: MdError
};

const statusColors = {
  pending: 'gray',
  processing: 'blue',
  completed: 'green',
  failed: 'red'
};

const statusLabels = {
  pending: 'Waiting...',
  processing: 'Scraping in progress...',
  completed: 'Completed',
  failed: 'Failed'
};

export default function JobTracker({ jobId, onComplete }) {
  const [job, setJob] = useState(null);

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const status = await getJobStatus(jobId);
        setJob(status);

        if (status.status === 'completed') {
          clearInterval(interval);
          if (onComplete) {
            onComplete();
          }
        } else if (status.status === 'failed') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Failed to fetch job status:', error);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, onComplete]);

  if (!job) return null;

  return (
    <Card p={4}>
      <HStack justify="space-between" mb={2}>
        <HStack>
          <Icon
            as={statusIcons[job.status]}
            color={`${statusColors[job.status]}.500`}
            boxSize="20px"
          />
          <Text fontWeight="bold" fontSize="md">
            {statusLabels[job.status]}
          </Text>
        </HStack>
        <Text fontSize="sm" color="gray.600">
          {job.progress}%
        </Text>
      </HStack>

      <Progress
        value={job.progress}
        colorScheme={statusColors[job.status]}
        borderRadius="full"
        mb={2}
      />

      {job.totalAds > 0 && (
        <Text fontSize="sm" color="gray.600">
          {job.totalAds} ads saved
        </Text>
      )}

      {job.status === 'failed' && (
        <Text fontSize="sm" color="red.500" mt={2}>
          An error occurred during scraping. Please try again.
        </Text>
      )}
    </Card>
  );
}
