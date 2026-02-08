import React from 'react';
import {
  VStack,
  Heading,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
} from '@chakra-ui/react';
import SectionContainer from '../components/SectionContainer';
import AnimatedSection from '../components/AnimatedSection';

export default function PricingFAQ() {
  const faqs = [
    {
      question: "어떤 플랫폼의 광고를 볼 수 있나요?",
      answer:
        "메타(페이스북, 인스타그램), 구글, 틱톡 등 주요 플랫폼의 광고를 모두 확인할 수 있습니다.",
    },
    {
      question: "무료 체험이 있나요?",
      answer: "14일 무료 체험을 제공합니다. 신용카드 등록 없이 모든 기능을 사용해볼 수 있습니다.",
    },
    {
      question: "어떤 결제 방식을 지원하나요?",
      answer: "신용카드, 체크카드, 계좌이체를 지원합니다. 해외 결제도 가능합니다.",
    },
    {
      question: "데이터는 얼마나 자주 업데이트되나요?",
      answer: "광고 데이터는 실시간으로 업데이트되며, 새로운 광고가 게시되면 즉시 확인할 수 있습니다.",
    },
    {
      question: "팀원과 함께 사용할 수 있나요?",
      answer: "네, 팀 플랜을 통해 여러 팀원이 함께 사용할 수 있으며, 권한 관리도 가능합니다.",
    },
  ];

  return (
    <SectionContainer id="pricing">
      <AnimatedSection>
        <VStack spacing="60px">
          <VStack spacing="16px" textAlign="center">
            <Heading
              fontSize={{ base: "32px", md: "40px", lg: "48px" }}
              fontWeight="700"
              color="landing.textDark"
            >
              자주 묻는 질문
            </Heading>
            <Text fontSize="lg" color="landing.textGray">
              지금 가격 보고 있는 데이터는 무엇인가요?
            </Text>
          </VStack>

          <Accordion allowToggle w="100%" maxW="800px" mx="auto">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                border="none"
                mb="16px"
                borderRadius="16px"
                bg="white"
                boxShadow="0px 4px 12px rgba(0, 0, 0, 0.05)"
              >
                <AccordionButton
                  p="24px"
                  borderRadius="16px"
                  _hover={{ bg: "gray.50" }}
                >
                  <Box flex="1" textAlign="left" fontWeight="600" fontSize="md">
                    {faq.question}
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4} pt="16px" px="24px" color="landing.textGray">
                  {faq.answer}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </VStack>
      </AnimatedSection>
    </SectionContainer>
  );
}
