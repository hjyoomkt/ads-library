import React from 'react';
import { VStack, Heading, Text, SimpleGrid, Box, Badge, Icon } from '@chakra-ui/react';
import { MdSearch, MdLightbulb, MdRemoveRedEye, MdBookmark } from 'react-icons/md';
import SectionContainer from '../components/SectionContainer';
import AnimatedSection from '../components/AnimatedSection';

export default function FeaturesStats() {
  const problems = [
    {
      title: "왜 검색해도, 원하는 광고는 안 나올까요?",
      titleHighlight: "원하는 광고는",
      description: "키워드 중심 검색은\n마케터가 보고 싶은 '무드·카피·포맷'을 이해하지 못합니다.",
      icon: MdSearch
    },
    {
      title: "지난 광고는 때를 놓치면 볼 수 없어요.",
      titleHighlight: "지난 광고는",
      description: "지난 시즌 광고, 이제와 보고 싶어도 어디에서도 찾을 수 없죠.\n꺼진 광고는 어디에도 남지 않습니다.",
      icon: MdLightbulb
    },
    {
      title: "경쟁사 광고 보려면, 매번 일일이 검색해야 하고요.",
      titleHighlight: "경쟁사 광고",
      description: "내 업종의 경쟁사를 찾기도 쉽지 않은데,\n반복되는 모니터링은 필요 이상으로 많은 시간을 빼앗습니다.",
      icon: MdRemoveRedEye
    },
    {
      title: "유사한 사례까지 전부 모아보고 싶은데, 방법이 없죠",
      titleHighlight: "유사한 사례까지",
      description: "눈 여기저기 올어진 업종별, 타깃 중심 광고를\n하나하나 다시 찾아봐야만 해요.",
      icon: MdBookmark
    }
  ];

  return (
    <SectionContainer id="features" bg="white">
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
              콘텐츠 레퍼런스는 왜 내가 원할 때 안 보일까요?
            </Badge>
            <Heading
              fontSize={{ base: "24px", md: "28px", lg: "32px" }}
              fontWeight="700"
              color="landing.textDark"
              lineHeight="1.3"
            >
              레퍼런스를{' '}
              <Text as="span" color="landing.primary">
                찾는 일
              </Text>
              , 생각보다 많은 시간을 빼앗겼죠
            </Heading>
            <Text fontSize="md" color="gray.600" pt="8px">
              이미지를 찾고, 광고를 뒤지고, 저장하고 정리하는 데 하루의 절반이 사라집니다.
            </Text>
          </VStack>

          {/* 문제점 카드 그리드 */}
          <SimpleGrid
            columns={{ base: 1, md: 2 }}
            spacing="20px"
            w="100%"
            maxW="900px"
            mx="auto"
          >
            {problems.map((problem, index) => (
              <Box
                key={index}
                bg="white"
                borderRadius="12px"
                p="20px"
                border="1px solid"
                borderColor="blue.200"
                boxShadow="0px 2px 8px rgba(99, 102, 241, 0.1)"
                _hover={{ boxShadow: "0px 4px 12px rgba(99, 102, 241, 0.15)", transition: "all 0.3s" }}
                w="420px"
                h="200px"
              >
                <VStack align="start" spacing="10px">
                  <Box
                    w="44px"
                    h="44px"
                    borderRadius="10px"
                    bg="blue.50"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={problem.icon} w="22px" h="22px" color="landing.primary" />
                  </Box>
                  <Text fontSize="md" fontWeight="700" color="landing.textDark" lineHeight="1.3">
                    {problem.title.split(problem.titleHighlight)[0]}
                    <Text as="span" color="landing.primary">
                      {problem.titleHighlight}
                    </Text>
                    {problem.title.split(problem.titleHighlight)[1]}
                  </Text>
                  <Text fontSize="sm" color="gray.600" lineHeight="1.5" whiteSpace="pre-line">
                    {problem.description}
                  </Text>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </AnimatedSection>
    </SectionContainer>
  );
}
