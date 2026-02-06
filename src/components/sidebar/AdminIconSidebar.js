import React from 'react';
import { Box, VStack, IconButton, Tooltip } from '@chakra-ui/react';
import { NavLink, useLocation } from 'react-router-dom';

export default function AdminIconSidebar(props) {
  const { routes } = props;
  const location = useLocation();

  // Filter routes for /admin layout and not hidden
  const adminRoutes = routes.filter(
    (route) => route.layout === '/admin' && !route.hidden
  );

  // Check if route is active
  const isRouteActive = (route) => {
    return location.pathname === route.layout + route.path;
  };

  return (
    <Box
      position="fixed"
      left="0"
      top="0"
      w="70px"
      h="100vh"
      bg="brand.500"
      zIndex="1001"
      boxShadow="lg"
      display={{ base: 'none', xl: 'flex' }}
      flexDirection="column"
      alignItems="center"
      pt="20px"
    >
      <VStack spacing={4} w="100%">
        {adminRoutes.map((route) => {
          const isActive = isRouteActive(route);

          return (
            <Tooltip
              label={route.name}
              placement="right"
              key={route.path}
              fontSize="sm"
              bg="gray.700"
              color="white"
              px={3}
              py={2}
              borderRadius="md"
            >
              <IconButton
                as={NavLink}
                to={route.layout + route.path}
                icon={route.icon}
                variant="ghost"
                color="white"
                size="lg"
                w="50px"
                h="50px"
                bg={isActive ? 'whiteAlpha.300' : 'transparent'}
                _hover={{
                  bg: 'whiteAlpha.200',
                  transform: 'scale(1.05)',
                }}
                _active={{
                  bg: 'whiteAlpha.400',
                }}
                transition="all 0.2s"
                aria-label={route.name}
              />
            </Tooltip>
          );
        })}
      </VStack>
    </Box>
  );
}
