import React from 'react';
import { VStack, Heading, Text, SimpleGrid, Box, Badge, List, ListItem } from '@chakra-ui/react';
import SectionContainer from '../components/SectionContainer';
import AnimatedSection from '../components/AnimatedSection';

export default function Benefits() {
  const benefits = [
    {
      title: "찾는 방식을 바꿉니다",
      titleHighlight: "찾는 방식",
      subtitle: "키워드만이 아닌, 마케터의 관점에 맞는\n다양한 검색 방식을 제공합니다.",
      items: [
        "이미지로만 표현된 요소, 커피, 색상 기준 검색",
        "업종, 포맷, 성격, 게재 기간으로 분류해서 보기",
        "유사 이미지 및 추천 검색으로 추가 탐색 제공"
      ]
    },
    {
      title: "반복 탐색을 자동화합니다",
      titleHighlight: "반복 탐색을 자동화",
      subtitle: "메타 광고 라이브러리, 인스타그램\n이제 매번 계정을 찾아볼 필요가 없습니다.",
      items: [
        "브랜드 단위 자동 모니터링과 히스토리 대시보드",
        "한 번 모니터링 시작하면, 까진 광고도 자동 저장",
        "다른 마케터가 보는 경쟁사, 업종별 추천 제공"
      ]
    },
    {
      title: "레퍼런스를 바로 저장합니다",
      titleHighlight: "레퍼런스를 바로 저장",
      subtitle: "소재가 인사이트가 된 순간 콘텐츠를 저장해\n다시 까내 쓸 수 있도록 제공합니다.",
      items: [
        "광고·활슨 무엇이든 콜랙팅이 상관없이 저장",
        "주제별 보드 & 폴더 분류 (팀팀 기능 사용 가능)",
        "인스타 · 메타광 크롤 학공 프로그램 제공"
      ]
    }
  ];

  return (
    <SectionContainer bg="gray.50">
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
              이제는 헤맬 필요 없습니다
            </Badge>
            <Heading
              fontSize={{ base: "24px", md: "28px", lg: "32px" }}
              fontWeight="700"
              color="landing.textDark"
              lineHeight="1.3"
            >
              제스트러리는 마케터가{' '}
              <Text as="span" color="landing.primary">
                원하는 레퍼런스
              </Text>
              에
              <br />
              <Text as="span" color="landing.primary">
                가장 정확히 도달
              </Text>
              하는 새로운 방식을 제시합니다.
            </Heading>
          </VStack>

          {/* 혜택 카드 그리드 */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing="20px" w="100%" maxW="1200px" mx="auto">
            {benefits.map((benefit, index) => (
              <Box
                key={index}
                bg="white"
                borderRadius="12px"
                p="24px"
                border="1px solid"
                borderColor="gray.200"
                _hover={{ borderColor: "blue.200", transition: "all 0.3s" }}
                w="340px"
                h="310px"
              >
                <VStack align="center" spacing="16px" textAlign="center">
                  <Text fontSize="lg" fontWeight="700" color="landing.textDark">
                    {benefit.title.split(benefit.titleHighlight)[0]}
                    <Text as="span" color="landing.primary">
                      {benefit.titleHighlight}
                    </Text>
                    {benefit.title.split(benefit.titleHighlight)[1]}
                  </Text>

                  <Text fontSize="sm" color="gray.600" lineHeight="1.6" whiteSpace="pre-line">
                    {benefit.subtitle}
                  </Text>

                  <VStack align="stretch" spacing="8px" w="100%">
                    {benefit.items.map((item, idx) => (
                      <Box
                        key={idx}
                        bg="blue.50"
                        borderRadius="8px"
                        px="12px"
                        py="10px"
                        w="100%"
                      >
                        <Text fontSize="sm" color="landing.primary" fontWeight="500">
                          {item}
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </AnimatedSection>
    </SectionContainer>
  );
}
