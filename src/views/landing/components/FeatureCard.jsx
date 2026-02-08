import React from 'react';
import { Flex, Text, Icon, Box } from '@chakra-ui/react';
import Card from 'components/card/Card';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

export default function FeatureCard({
  icon,
  title,
  description,
  iconBg = "landing.primary",
  iconColor = "white",
}) {
  return (
    <MotionCard
      borderRadius="24px"
      boxShadow="0px 12px 32px rgba(0, 0, 0, 0.08)"
      p="32px"
      bg="white"
      whileHover={{
        y: -4,
        boxShadow: "0px 16px 40px rgba(0, 0, 0, 0.12)",
      }}
      transition={{ duration: 0.3 }}
    >
      <Flex direction="column" align="start">
        <Box bg={iconBg} p="16px" borderRadius="16px" mb="20px">
          <Icon as={icon} w="32px" h="32px" color={iconColor} />
        </Box>
        <Text fontWeight="700" fontSize="xl" mb="12px" color="landing.textDark">
          {title}
        </Text>
        <Text fontWeight="400" fontSize="md" color="landing.textGray">
          {description}
        </Text>
      </Flex>
    </MotionCard>
  );
}
