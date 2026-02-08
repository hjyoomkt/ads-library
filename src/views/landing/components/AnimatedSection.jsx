import React from 'react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div;

export default function AnimatedSection({ children, delay = 0 }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </MotionDiv>
  );
}
