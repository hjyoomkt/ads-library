import React from 'react';
import { Box } from '@chakra-ui/react';
import { Helmet } from 'react-helmet-async';

// 섹션 컴포넌트 import
import Navbar from './sections/Navbar';
import Hero from './sections/Hero';
import FeaturesStats from './sections/FeaturesStats';
import Benefits from './sections/Benefits';
import DashboardPreview from './sections/DashboardPreview';
import CreatorFeatures from './sections/CreatorFeatures';
import PricingFAQ from './sections/PricingFAQ';
import Footer from './sections/Footer';

export default function LandingPage() {
  return (
    <Box overflowX="hidden">
      <Helmet>
        <title>광고 라이브러리 | 경쟁사 광고 분석 도구 - ZEST DOT</title>
        <meta
          name="description"
          content="메타, 구글, 틱톡의 광고를 한 곳에서 검색하고 분석하세요. 경쟁사 분석, 크리에이티브 인사이트, 광고 트렌드 파악까지."
        />
        <meta property="og:title" content="광고 라이브러리 | 경쟁사 광고 분석 도구 - ZEST DOT" />
        <meta
          property="og:description"
          content="메타, 구글, 틱톡의 광고를 한 곳에서 검색하고 분석하세요."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://library.zestdot.com" />
      </Helmet>

      {/* 네비게이션 바 (고정) */}
      <Navbar />

      {/* 모든 섹션 */}
      <Hero />
      <FeaturesStats />
      <Benefits />
      <DashboardPreview />
      <CreatorFeatures />
      <PricingFAQ />
      <Footer />
    </Box>
  );
}
