import React from 'react';
import { VStack, HStack, Heading, Text, Box, Badge, Grid, Icon } from '@chakra-ui/react';
import { MdImage, MdRemoveRedEye, MdFolder } from 'react-icons/md';
import SectionContainer from '../components/SectionContainer';
import AnimatedSection from '../components/AnimatedSection';
import DashboardImage from '../components/DashboardImage';

export default function DashboardPreview() {
  const features = [
    {
      icon: MdImage,
      title: "이미지 검색 & 커뮤니티 ",
      titleHighlight: "검색",
      items: [
        "업종 및 무드 · 커뮤니티 등\n이미지로만 표현된 요소를 검색 가능",
        "선택 이미지 기반 유사 이미지 추천",
        "게재기간, 성격순 정렬과 다양한 필터"
      ],
      direction: "left",
      boxText: [
        "운영 중인 광고 사례 중심 데이터베이스",
        "재활용이 가능한 카피라이팅 & 포맷 분석"
      ]
    },
    {
      icon: MdRemoveRedEye,
      title: "경쟁사 ",
      titleHighlight: "모니터링 & 대시보드",
      items: [
        "기간 내 모든 브랜드 광고 자동 수집",
        "광고가 내려간 이후에도 확인 가능",
        "일자 별 게재 히스토리 및 통계 제공",
        "브랜드 광고 운영패턴 차트로 확인 가능"
      ],
      direction: "right",
      boxText: [
        "인스타·메타 브랜드 계정 자동 모니터링",
        "게재 광고 운영 패턴 대시보드"
      ]
    },
    {
      icon: MdFolder,
      title: "콘텐츠 ",
      titleHighlight: "& 추천 광고 큐레이션",
      items: [
        "찾은 콘텐츠는 저장 바로만 누르면\n콘텐츠 정보 및 성과와 함께 바로 저장",
        "인스타&메타 이미지 즉시 저장 가능",
        "매일 자동 업데이트되는 오늘의 추천 광고"
      ],
      direction: "left",
      boxText: [
        "업종별 광고 크리에이티브 분석",
        "이미지 하나로 유사 광고 자동 탐색"
      ]
    }
  ];

  return (
    <SectionContainer bg="white">
      <AnimatedSection>
        <VStack spacing="60px">
          {/* 섹션 헤더 */}
          <VStack spacing="16px" textAlign="center" maxW="1000px" mx="auto">
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
              마케터를 위한 생산성
            </Badge>
            <Heading
              fontSize={{ base: "24px", md: "28px", lg: "32px" }}
              fontWeight="700"
              color="landing.textDark"
              lineHeight="1.3"
            >
              <Text as="span" color="landing.primary">검색</Text>으로 도달하고, <Text as="span" color="landing.primary">모니터링</Text>으로 방향을 잡고, <Text as="span" color="landing.primary">보드</Text>로 쌓아가는
              <br />
              마케터를 위한 새로운 레퍼런스 탐색 방식
            </Heading>
            <Text fontSize="md" color="gray.600" pt="8px">
              찾아야 할 것이 막막한 순간부터, 원하는 레퍼런스를 만나, 전략으로 바꾸는 순간까지 제스트러리가 함께합니다.
            </Text>
          </VStack>

          {/* 기능 섹션들 */}
          <VStack spacing="60px" w="100%" align="center">
            {features.map((feature, index) => (
              <Grid
                key={index}
                gridTemplateColumns={{
                  base: "1fr",
                  lg: feature.direction === "left" ? "700px 340px" : "340px 700px"
                }}
                columnGap="40px"
                rowGap="60px"
                alignItems="center"
                w="fit-content"
              >
                {feature.direction === "left" ? (
                  <>
                    <Box
                      w="700px"
                      h="420px"
                      border="2px dashed"
                      borderColor="gray.300"
                      borderRadius="12px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bg="gray.50"
                    >
                      <Text color="gray.400" fontSize="sm">Image Area {index + 1}</Text>
                    </Box>
                    <Box
                      w="340px"
                      h="420px"
                      bg="white"
                      borderRadius="16px"
                      p="28px"
                      boxShadow="0px 2px 8px rgba(0, 0, 0, 0.06)"
                    >
                      <VStack align="start" spacing="20px">
                        <HStack spacing="12px">
                          <Box
                            w="48px"
                            h="48px"
                            borderRadius="12px"
                            bg="blue.50"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Icon as={feature.icon} w="24px" h="24px" color="landing.primary" />
                          </Box>
                          <Heading fontSize="lg" fontWeight="700" color="landing.textDark">
                            {feature.title}
                            <Text as="span" color="landing.primary">
                              {feature.titleHighlight}
                            </Text>
                          </Heading>
                        </HStack>
                        <VStack align="start" spacing="10px" w="100%">
                          {feature.items.map((item, idx) => (
                            <Text key={idx} fontSize="sm" color="gray.700" lineHeight="1.6" whiteSpace="pre-line">
                              {item}
                            </Text>
                          ))}
                        </VStack>
                        {feature.boxText && (
                          <Box
                            w="100%"
                            bgGradient="linear(to-r, blue.500, pink.500)"
                            borderRadius="12px"
                            p="20px"
                          >
                            <VStack align="start" spacing="8px">
                              {feature.boxText.map((text, idx) => (
                                <Text key={idx} fontSize="sm" color="white" fontWeight="500">
                                  {text}
                                </Text>
                              ))}
                            </VStack>
                          </Box>
                        )}
                      </VStack>
                    </Box>
                  </>
                ) : (
                  <>
                    <Box
                      w="340px"
                      h="420px"
                      bg="white"
                      borderRadius="16px"
                      p="28px"
                      boxShadow="0px 2px 8px rgba(0, 0, 0, 0.06)"
                      order={{ base: 2, lg: 1 }}
                    >
                      <VStack align="start" spacing="20px">
                        <HStack spacing="12px">
                          <Box
                            w="48px"
                            h="48px"
                            borderRadius="12px"
                            bg="blue.50"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Icon as={feature.icon} w="24px" h="24px" color="landing.primary" />
                          </Box>
                          <Heading fontSize="lg" fontWeight="700" color="landing.textDark">
                            {feature.title}
                            <Text as="span" color="landing.primary">
                              {feature.titleHighlight}
                            </Text>
                          </Heading>
                        </HStack>
                        <VStack align="start" spacing="10px" w="100%">
                          {feature.items.map((item, idx) => (
                            <Text key={idx} fontSize="sm" color="gray.700" lineHeight="1.6" whiteSpace="pre-line">
                              {item}
                            </Text>
                          ))}
                        </VStack>
                        {feature.boxText && (
                          <Box
                            w="100%"
                            bgGradient="linear(to-r, blue.500, pink.500)"
                            borderRadius="12px"
                            p="20px"
                          >
                            <VStack align="start" spacing="8px">
                              {feature.boxText.map((text, idx) => (
                                <Text key={idx} fontSize="sm" color="white" fontWeight="500">
                                  {text}
                                </Text>
                              ))}
                            </VStack>
                          </Box>
                        )}
                      </VStack>
                    </Box>
                    <Box order={{ base: 1, lg: 2 }}>
                      <Box
                        w="700px"
                        h="420px"
                        border="2px dashed"
                        borderColor="gray.300"
                        borderRadius="12px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bg="gray.50"
                      >
                        <Text color="gray.400" fontSize="sm">Image Area {index + 1}</Text>
                      </Box>
                    </Box>
                  </>
                )}
              </Grid>
            ))}
          </VStack>
        </VStack>
      </AnimatedSection>
    </SectionContainer>
  );
}
