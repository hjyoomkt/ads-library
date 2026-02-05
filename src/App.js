import './assets/css/App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import {} from 'react-router-dom';
import AuthLayout from './layouts/auth';
import AdminLayout from './layouts/admin';
import SuperAdminLayout from './layouts/superadmin';
import ClientAdminLayout from './layouts/clientadmin';
import RTLLayout from './layouts/rtl';
import {
  ChakraProvider,
  Center,
  Spinner,
  // extendTheme
} from '@chakra-ui/react';
import initialTheme from './theme/theme'; //  { themeGreen }
import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HelmetProvider } from 'react-helmet-async';
// Chakra imports

function RoleBasedRedirect() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="brand.500"
          size="xl"
        />
      </Center>
    );
  }

  // If not authenticated, redirect to sign-in
  if (!user) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  // Redirect based on role for authenticated users
  if (role === 'master' || role === 'agency_admin' || role === 'agency_manager') {
    return <Navigate to="/superadmin" replace />;
  } else if (role === 'advertiser_admin' || role === 'advertiser_staff' || role === 'viewer') {
    return <Navigate to="/clientadmin" replace />;
  }

  // Fallback: if user is authenticated but has an unknown role, send to general admin
  return <Navigate to="/admin" replace />;
}

export default function Main() {
  // eslint-disable-next-line
  const [currentTheme, setCurrentTheme] = useState(initialTheme);
  return (
    <HelmetProvider>
      <ChakraProvider theme={currentTheme}>
        <AuthProvider>
          <Routes>
            <Route path="auth/*" element={<AuthLayout />} />
            <Route
              path="admin/*"
              element={
                <AdminLayout theme={currentTheme} setTheme={setCurrentTheme} />
              }
            />
            <Route
              path="superadmin/*"
              element={
                <SuperAdminLayout theme={currentTheme} setTheme={setCurrentTheme} />
              }
            />
            <Route
              path="clientadmin/*"
              element={
                <ClientAdminLayout theme={currentTheme} setTheme={setCurrentTheme} />
              }
            />
            <Route
              path="rtl/*"
              element={
                <RTLLayout theme={currentTheme} setTheme={setCurrentTheme} />
              }
            />
            <Route path="/" element={<RoleBasedRedirect />} />
          </Routes>
        </AuthProvider>
      </ChakraProvider>
    </HelmetProvider>
  );
}
