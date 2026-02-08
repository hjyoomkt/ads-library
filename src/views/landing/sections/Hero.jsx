import React from 'react';
import {
  VStack,
  Heading,
  Text,
  Box,
  InputGroup,
  Input,
  InputLeftElement,
  InputRightElement,
  Button,
  Icon,
  Badge,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { MdSearch, MdGpsFixed, MdTrendingUp, MdFastfood, MdGroup } from 'react-icons/md';
import SectionContainer from '../components/SectionContainer';
import AnimatedSection from '../components/AnimatedSection';
import DashboardImage from '../components/DashboardImage';

export default function Hero() {
  return (
    <Box
      id="hero"
      w="100%"
      pt="100px"
      pb="60px"
    >
      <SectionContainer maxW="1200px" py="0">
        <AnimatedSection>
          <VStack spacing="40px" align="center" textAlign="center">
            {/* 메인 헤드라인 */}
            <VStack spacing="8px" maxW="900px">
              <Heading
                as="h1"
                fontSize={{ base: "24px", md: "28px", lg: "32px" }}
                fontWeight="700"
                lineHeight="1.3"
                color="landing.textDark"
                letterSpacing="-0.02em"
              >
                업종별 광고 현황, 한눈에 모아볼 수 있나요?
              </Heading>

              <Heading
                as="h2"
                fontSize={{ base: "24px", md: "28px", lg: "32px" }}
                fontWeight="700"
                lineHeight="1.3"
                letterSpacing="-0.02em"
              >
                찾고싶을 때{' '}
                <Text as="span" color="landing.primary">
                  찾아지는
                </Text>{' '}
                콘텐츠 레퍼런스,{' '}
                <Text as="span" color="landing.primary">
                  제스트러리
                </Text>
              </Heading>

              <Text fontSize="md" color="gray.600" pt="8px">
                마케터가 보고 싶은 레퍼런스에 가장 빠르게 도달하는 방법
              </Text>
            </VStack>

            {/* 검색 바 */}
            <Box w="100%" maxW="800px">
              <InputGroup size="lg">
                <InputLeftElement h="60px" pl="20px">
                  <Icon as={MdSearch} w="20px" h="20px" color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="레퍼런스 검색하기"
                  borderRadius="16px"
                  h="60px"
                  bg="white"
                  border="1px solid"
                  borderColor="gray.200"
                  fontSize="md"
                  pl="56px"
                  pr="120px"
                  _placeholder={{ color: "gray.400" }}
                  _focus={{
                    borderColor: "landing.primary",
                    boxShadow: "0 0 0 1px var(--chakra-colors-landing-primary)",
                  }}
                />
                <InputRightElement h="60px" pr="8px" w="auto">
                  <Button
                    bg="landing.primary"
                    color="white"
                    borderRadius="12px"
                    h="44px"
                    px="16px"
                    fontSize="md"
                    fontWeight="600"
                    _hover={{ bg: "landing.primaryDark" }}
                  >
                    <Icon as={MdSearch} w="24px" h="24px" />
                  </Button>
                </InputRightElement>
              </InputGroup>
            </Box>

            {/* 4개 배지 */}
            <Wrap spacing="12px" justify="center">
              <WrapItem>
                <Badge
                  bg="white"
                  borderRadius="20px"
                  px="16px"
                  py="8px"
                  fontSize="xs"
                  fontWeight="500"
                  color="landing.textDark"
                  border="1px solid"
                  borderColor="gray.200"
                  display="flex"
                  alignItems="center"
                  gap="6px"
                >
                  <Icon as={MdGpsFixed} w="14px" h="14px" />
                  개별적 광고스 콘텐츠
                </Badge>
              </WrapItem>
              <WrapItem>
                <Badge
                  bg="white"
                  borderRadius="20px"
                  px="16px"
                  py="8px"
                  fontSize="xs"
                  fontWeight="500"
                  color="landing.textDark"
                  border="1px solid"
                  borderColor="gray.200"
                  display="flex"
                  alignItems="center"
                  gap="6px"
                >
                  <Icon as={MdTrendingUp} w="14px" h="14px" />
                  26 FW 버전 트레드
                </Badge>
              </WrapItem>
              <WrapItem>
                <Badge
                  bg="white"
                  borderRadius="20px"
                  px="16px"
                  py="8px"
                  fontSize="xs"
                  fontWeight="500"
                  color="landing.textDark"
                  border="1px solid"
                  borderColor="gray.200"
                  display="flex"
                  alignItems="center"
                  gap="6px"
                >
                  <Icon as={MdFastfood} w="14px" h="14px" />
                  연도 F&B 코콘텐츠
                </Badge>
              </WrapItem>
              <WrapItem>
                <Badge
                  bg="white"
                  borderRadius="20px"
                  px="16px"
                  py="8px"
                  fontSize="xs"
                  fontWeight="500"
                  color="landing.textDark"
                  border="1px solid"
                  borderColor="gray.200"
                  display="flex"
                  alignItems="center"
                  gap="6px"
                >
                  <Icon as={MdGroup} w="14px" h="14px" />
                  커머스_금액 인스타트
                </Badge>
              </WrapItem>
            </Wrap>

            {/* 제품 스크린샷 */}
            <Box w="100%" pt="40px">
              <DashboardImage
                src={require('../../../assets/img/landing/main01.png')}
                alt="제스트러리 제품 스크린샷"
                borderRadius="16px"
                boxShadow="0px 20px 60px rgba(0, 0, 0, 0.15)"
              />
            </Box>
          </VStack>
        </AnimatedSection>
      </SectionContainer>
    </Box>
  );
}
