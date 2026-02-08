import React from 'react';
import {
  Box,
  Container,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Link,
  Divider,
  Flex,
  Image,
} from '@chakra-ui/react';
import { ZestDotLogo } from '../../../components/icons/Icons';

export default function Footer() {
  return (
    <Box as="footer" bg="navy.900" color="white" py="60px">
      <Container maxW="1440px" px={{ base: "20px", lg: "80px" }}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing="40px" mb="40px">
          {/* Column 1: 회사 정보 */}
          <VStack align="start" spacing="20px">
            <ZestDotLogo
              h='30px'
              w='150px'
              color='white'
            />
            <Text color="gray.400" fontSize="sm">
              광고 라이브러리로 경쟁사 분석을 시작하세요
            </Text>
          </VStack>

          {/* Column 2: 제품 */}
          <VStack align="start" spacing="16px">
            <Text fontWeight="600" fontSize="lg">
              제품
            </Text>
            <Link color="gray.400" _hover={{ color: "white" }} fontSize="sm">
              기능
            </Link>
            <Link color="gray.400" _hover={{ color: "white" }} fontSize="sm">
              가격
            </Link>
            <Link color="gray.400" _hover={{ color: "white" }} fontSize="sm">
              사례
            </Link>
            <Link color="gray.400" _hover={{ color: "white" }} fontSize="sm">
              업데이트
            </Link>
          </VStack>

          {/* Column 3: 리소스 */}
          <VStack align="start" spacing="16px">
            <Text fontWeight="600" fontSize="lg">
              리소스
            </Text>
            <Link color="gray.400" _hover={{ color: "white" }} fontSize="sm">
              블로그
            </Link>
            <Link color="gray.400" _hover={{ color: "white" }} fontSize="sm">
              가이드
            </Link>
            <Link color="gray.400" _hover={{ color: "white" }} fontSize="sm">
              문서
            </Link>
            <Link color="gray.400" _hover={{ color: "white" }} fontSize="sm">
              API
            </Link>
          </VStack>

          {/* Column 4: 회사 */}
          <VStack align="start" spacing="16px">
            <Text fontWeight="600" fontSize="lg">
              회사
            </Text>
            <Link color="gray.400" _hover={{ color: "white" }} fontSize="sm">
              소개
            </Link>
            <Link color="gray.400" _hover={{ color: "white" }} fontSize="sm">
              채용
            </Link>
            <Link color="gray.400" _hover={{ color: "white" }} fontSize="sm">
              문의
            </Link>
            <Link color="gray.400" _hover={{ color: "white" }} fontSize="sm">
              파트너
            </Link>
          </VStack>
        </SimpleGrid>

        <Divider borderColor="gray.700" mb="32px" />

        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align="center"
          gap="16px"
        >
          <Text color="gray.400" fontSize="sm">
            © 2026 ZEST DOT. All rights reserved.
          </Text>
          <HStack spacing="24px">
            <Link
              color="gray.400"
              _hover={{ color: "white" }}
              fontSize="sm"
            >
              개인정보처리방침
            </Link>
            <Link
              color="gray.400"
              _hover={{ color: "white" }}
              fontSize="sm"
            >
              이용약관
            </Link>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}
