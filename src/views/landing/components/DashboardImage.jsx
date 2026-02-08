import React from 'react';
import { Box, Image } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

export default function DashboardImage({
  src,
  alt,
  borderRadius = "24px",
  boxShadow = "0px 20px 40px rgba(0, 0, 0, 0.1)",
  ...rest
}) {
  return (
    <MotionBox
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      overflow="hidden"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      {...rest}
    >
      <Image
        src={src}
        alt={alt}
        w="100%"
        h="auto"
        loading="lazy"
        fallbackSrc="https://via.placeholder.com/1200x800?text=Dashboard+Preview"
      />
    </MotionBox>
  );
}
