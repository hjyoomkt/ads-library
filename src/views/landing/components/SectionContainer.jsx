import React from 'react';
import { Box, Container } from '@chakra-ui/react';

export default function SectionContainer({
  children,
  bg = "white",
  py = { base: "60px", md: "80px", lg: "120px" },
  maxW = "1440px",
  ...rest
}) {
  return (
    <Box bg={bg} w="100%" py={py} {...rest}>
      <Container maxW={maxW} px={{ base: "20px", md: "40px", lg: "80px" }}>
        {children}
      </Container>
    </Box>
  );
}
