import React from 'react';
import { VStack, Icon, Text } from '@chakra-ui/react';
import Card from 'components/card/Card';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

export default function IconCard({
  icon,
  value,
  label,
  iconColor = "landing.primary",
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
      <VStack spacing="16px" align="center">
        <Icon as={icon} w="48px" h="48px" color={iconColor} />
        <Text fontWeight="700" fontSize="3xl" color="landing.textDark">
          {value}
        </Text>
        <Text fontWeight="400" fontSize="md" color="landing.textGray" textAlign="center">
          {label}
        </Text>
      </VStack>
    </MotionCard>
  );
}
