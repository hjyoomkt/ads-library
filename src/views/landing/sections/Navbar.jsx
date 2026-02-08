import React, { useState, useEffect } from 'react';
import {
  Flex,
  Box,
  HStack,
  Button,
  Link,
  Text,
  Icon,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  Container,
  useColorModeValue,
} from '@chakra-ui/react';
import { MdMenu, MdHome } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { ZestDotLogo } from '../../../components/icons/Icons';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      onClose();
    }
  };

  return (
    <Flex
      as="nav"
      position="fixed"
      top="0"
      left="0"
      right="0"
      zIndex="1000"
      bg="rgba(255, 255, 255, 0.95)"
      backdropFilter="blur(10px)"
      h="64px"
      borderBottom="1px solid"
      borderColor="gray.100"
      boxShadow={scrolled ? "sm" : "none"}
      transition="all 0.3s ease"
    >
      <Container maxW="1200px" px={{ base: "20px", lg: "40px" }}>
        <Flex justify="space-between" align="center" h="100%">
          {/* 왼쪽: 로고 */}
          <Flex align="center" cursor="pointer" onClick={() => scrollToSection('hero')}>
            <ZestDotLogo
              h='30px'
              w='150px'
              color={useColorModeValue('navy.700', 'landing.textDark')}
            />
          </Flex>

          {/* 중앙: 메뉴 링크 */}
          <HStack spacing="32px" display={{ base: "none", md: "flex" }}>
            <Text fontSize="sm" fontWeight="500" color="landing.textDark" cursor="pointer">
              홈
            </Text>
            <Link
              fontSize="sm"
              fontWeight="500"
              color="landing.primary"
              _hover={{ textDecoration: 'none', opacity: 0.8 }}
            >
              제스트러리
            </Link>
          </HStack>

          {/* 오른쪽: CTA 버튼 */}
          <HStack spacing="12px" display={{ base: "none", md: "flex" }}>
            <Button
              as="a"
              href="https://library.zestdot.com/auth/sign-in"
              variant="ghost"
              color="landing.textDark"
              size="sm"
              fontWeight="600"
              px="16px"
              h="36px"
              _hover={{ bg: "gray.100" }}
            >
              로그인
            </Button>
            <Button
              as="a"
              href="https://library.zestdot.com/auth/sign-up"
              bg="landing.primary"
              color="white"
              size="sm"
              borderRadius="8px"
              fontWeight="600"
              px="20px"
              h="36px"
              _hover={{ bg: "landing.primaryDark" }}
            >
              시작하기
            </Button>
          </HStack>

          {/* 모바일 햄버거 메뉴 */}
          <IconButton
            aria-label="Open menu"
            icon={<MdMenu />}
            onClick={onOpen}
            display={{ base: "flex", md: "none" }}
            variant="ghost"
            fontSize="24px"
          />
        </Flex>
      </Container>

      {/* 모바일 드로어 메뉴 */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerBody pt="80px">
            <VStack spacing="24px" align="stretch">
              <Text fontSize="md" fontWeight="500">
                홈
              </Text>
              <Link fontSize="md" fontWeight="500" color="landing.primary">
                제스트러리
              </Link>
              <Button
                bg="landing.primary"
                color="white"
                borderRadius="8px"
                fontWeight="600"
                w="100%"
              >
                시작하기
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Flex>
  );
}
