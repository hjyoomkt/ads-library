import React from 'react';
import { Navigate } from 'react-router-dom';

import { Icon } from '@chakra-ui/react';
import {
  MdBarChart,
  MdPerson,
  MdHome,
  MdLock,
  MdOutlineShoppingCart,
  MdAdsClick,
  MdMonitor,
  MdSecurity,
  MdBusiness,
} from 'react-icons/md';

// Admin Imports
import MainDashboard from 'views/admin/default';
import NFTMarketplace from 'views/admin/marketplace';
import Profile from 'views/admin/profile';
import DataTables from 'views/admin/dataTables';
import MetaArchive from 'views/admin/metaArchive';
import Monitoring from 'views/admin/monitoring';

// SuperAdmin Imports
import SuperAdminDashboard from 'views/superadmin/default';

// ClientAdmin Imports
import ClientAdminDashboard from 'views/clientadmin/default';

// Auth Imports
import SignInCentered from 'views/auth/signIn';
import SignUp from 'views/auth/signUp';
import ForgotPassword from 'views/auth/forgotPassword';
import ResetPassword from 'views/auth/resetPassword';

const routes = [
  {
    name: 'Main Home',
    layout: '/admin',
    path: '/monitoring',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: <Monitoring />,
  },
  {
    layout: '/admin',
    path: '/default',
    component: <Navigate to="/admin/monitoring" replace />,
    hidden: true,
  },
  // {
  //   name: 'Main Dashboard',
  //   layout: '/admin',
  //   path: '/default',
  //   icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
  //   component: <MainDashboard />,
  // },
  {
    name: 'Ads-Library',
    layout: '/admin',
    path: '/ads-library',
    icon: <Icon as={MdAdsClick} width="20px" height="20px" color="inherit" />,
    component: <MetaArchive />,
  },
  {
    name: 'NFT Marketplace',
    layout: '/admin',
    path: '/nft-marketplace',
    icon: (
      <Icon
        as={MdOutlineShoppingCart}
        width="20px"
        height="20px"
        color="inherit"
      />
    ),
    component: <NFTMarketplace />,
    secondary: true,
  },
  {
    name: 'Data Tables',
    layout: '/admin',
    icon: <Icon as={MdBarChart} width="20px" height="20px" color="inherit" />,
    path: '/data-tables',
    component: <DataTables />,
    hidden: true, // 사이드바에서 숨김
  },
  {
    name: 'Profile',
    layout: '/admin',
    path: '/profile',
    icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
    component: <Profile />,
  },
  {
    name: '슈퍼어드민',
    layout: '/superadmin',
    path: '',
    icon: <Icon as={MdSecurity} width="20px" height="20px" color="inherit" />,
    component: <SuperAdminDashboard />,
    requiresPermission: 'superadmin', // 권한 체크 플래그
    showInSidebar: true, // AdminIconSidebar에 표시
  },
  {
    name: '브랜드어드민',
    layout: '/clientadmin',
    path: '',
    icon: <Icon as={MdBusiness} width="20px" height="20px" color="inherit" />,
    component: <ClientAdminDashboard />,
    requiresPermission: 'brandadmin', // 권한 체크 플래그
    showInSidebar: true, // AdminIconSidebar에 표시
  },
  {
    name: 'Sign In',
    layout: '/auth',
    path: '/sign-in',
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
    component: <SignInCentered />,
    hidden: true, // 사이드바에서 숨김
  },
  {
    name: 'Sign Up',
    layout: '/auth',
    path: '/sign-up',
    icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
    component: <SignUp />,
    hidden: true, // 사이드바에서 숨김
  },
  {
    name: 'Forgot Password',
    layout: '/auth',
    path: '/forgot-password',
    component: <ForgotPassword />,
    hidden: true, // 사이드바에서 숨김
  },
  {
    name: 'Reset Password',
    layout: '/auth',
    path: '/reset-password',
    component: <ResetPassword />,
    hidden: true, // 사이드바에서 숨김
  },
];

export default routes;
