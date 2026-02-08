import React from 'react';
import {
  VStack,
  Box,
  Heading,
  Text,
  Icon,
  SimpleGrid,
  Badge,
  HStack,
} from '@chakra-ui/react';
import { MdEmail, MdGroup, MdFolder } from 'react-icons/md';
import SectionContainer from '../components/SectionContainer';
import AnimatedSection from '../components/AnimatedSection';

export default function CreatorFeatures() {
  const solutions = [
    {
      badge: "Feature 1",
      icon: MdEmail,
      title: "광고 인사이트 검색",
      description: "업종 · 무드 · 커뮤니티별 광고 검색\n이미지 중심 크리에이티브 조회\n텍스트 없던 광고도 이미지로 검색"
    },
    {
      badge: "Feature 2",
      icon: MdGroup,
      title: "이미지 기반 광고 라이브러리",
      description: "선택한 광고와 유사한 유닛 큐레이션\n게재 기간 · 성격 · 퍼포먼스 필터\n광고 유형 · 카피 · 디자인 패턴 가이드"
    },
    {
      badge: "Feature 3",
      icon: MdFolder,
      title: "광고 경쟁 분석 & 인사이트",
      description: "라이벌 광고를 이미지로 비교·분석\n잘 되는 광고의 구조 빠르게 파악\n아이디어 고갈 없이 광고 테스트 설계"
    }
  ];

  return (
    <SectionContainer bg="gray.50" py={{ base: "80px", md: "120px" }}>
      <AnimatedSection>
        <VStack spacing="60px">
          {/* 섹션 헤더 */}
          <VStack spacing="16px" textAlign="center" maxW="900px" mx="auto">
            <Badge
              bg="white"
              color="landing.primary"
              borderRadius="24px"
              px="20px"
              py="8px"
              fontSize="sm"
              fontWeight="600"
              border="2px solid"
              borderColor="landing.primary"
            >
              광고 인사이트
            </Badge>
            <Heading
              fontSize={{ base: "24px", md: "28px", lg: "32px" }}
              fontWeight="700"
              color="landing.textDark"
              lineHeight="1.3"
            >
              광고 레퍼런스를 <Text as="span" color="landing.primary">인사이트</Text>로 전환하는<br />
              크리에이티브의 <Text as="span" color="landing.primary">방향</Text>을 제시합니다
            </Heading>
            <Text fontSize="md" color="gray.600" pt="8px">
              막막하게 흩어진 광고 속에서 의미 있는 레퍼런스를 찾고, 실행 가능한 전략으로 정리하는 과정까지 함께합니다.
            </Text>
          </VStack>

          {/* 3개 솔루션 카드 */}
          <Box position="relative" w="100%" maxW="1100px" mx="auto" mb="130px">
            <SimpleGrid
              columns={{ base: 1, md: 3 }}
              spacing="24px"
              w="100%"
            >
              {solutions.map((solution, index) => (
                <Box
                  key={index}
                  bg="white"
                  borderRadius="20px"
                  p="32px"
                  pt="50px"
                  boxShadow="0px 4px 20px rgba(0, 0, 0, 0.06)"
                  position="relative"
                  _hover={{ transform: "translateY(-8px)", transition: "all 0.3s" }}
                >
                  {/* 배지 - 왼쪽 상단 */}
                  <Badge
                    position="absolute"
                    top="20px"
                    left="20px"
                    bg="landing.primary"
                    color="white"
                    borderRadius="12px"
                    px="16px"
                    py="6px"
                    fontSize="xs"
                    fontWeight="600"
                  >
                    {solution.badge}
                  </Badge>

                  {/* 아이콘 - 카드 위로 튀어나옴 */}
                  <Box
                    position="absolute"
                    top="-30px"
                    right="20px"
                    w="70px"
                    h="70px"
                    borderRadius="16px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0px 4px 12px rgba(0, 0, 0, 0.1)"
                  >
                    <Icon as={solution.icon} w="36px" h="36px" color="landing.primary" />
                  </Box>

                  <VStack align="start" spacing="16px" h="100%">
                    {/* 제목 */}
                    <Heading
                      fontSize="xl"
                      fontWeight="700"
                      color="landing.primary"
                      mt="20px"
                    >
                      {solution.title}
                    </Heading>

                    {/* 구분선 */}
                    <Box w="100%" h="1px" bg="gray.200" />

                    {/* 설명 */}
                    <Text
                      fontSize="sm"
                      color="gray.600"
                      lineHeight="1.7"
                      whiteSpace="pre-line"
                    >
                      {solution.description}
                    </Text>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>

            {/* 카드 하단 연결선 */}
            <svg
              width="100%"
              height="120"
              viewBox="0 0 1100 120"
              style={{ position: 'absolute', bottom: '-130px', left: '0', display: 'block' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* 왼쪽 원과 선 */}
              <circle cx="175" cy="10" r="8" fill="#3D5AFE" />
              <line x1="175" y1="18" x2="175" y2="50" stroke="#3D5AFE" strokeWidth="2.5" />

              {/* 중앙 원과 선 */}
              <circle cx="550" cy="10" r="8" fill="#3D5AFE" />
              <line x1="550" y1="18" x2="550" y2="50" stroke="#3D5AFE" strokeWidth="2.5" />

              {/* 오른쪽 원과 선 */}
              <circle cx="925" cy="10" r="8" fill="#3D5AFE" />
              <line x1="925" y1="18" x2="925" y2="50" stroke="#3D5AFE" strokeWidth="2.5" />

              {/* 가로 연결선 */}
              <line x1="175" y1="50" x2="925" y2="50" stroke="#3D5AFE" strokeWidth="2.5" />

              {/* 중앙에서 Goal로 연결 */}
              <line x1="550" y1="50" x2="550" y2="130" stroke="#3D5AFE" strokeWidth="2.5" />
            </svg>
          </Box>

          {/* 하단 Goal 섹션 */}
          <Box
            w="100%"
            maxW="1100px"
            mx="auto"
            bg="landing.primary"
            borderRadius="24px"
            p={{ base: "40px", md: "60px" }}
            position="relative"
            overflow="hidden"
            mt="280px"
          >
            <VStack spacing="20px" align="center" textAlign="center">
              <Text
                fontSize="xl"
                fontWeight="700"
                color="white"
                textTransform="uppercase"
              >
                Goal
              </Text>
              <Heading
                fontSize={{ base: "24px", md: "32px" }}
                fontWeight="700"
                color="white"
                lineHeight="1.5"
              >
                업종별 성과형 크리에이티브를 한눈에<br />
                퍼포먼스 광고 크리에이티브 도구
              </Heading>
            </VStack>
          </Box>
        </VStack>
      </AnimatedSection>
    </SectionContainer>
  );
}
