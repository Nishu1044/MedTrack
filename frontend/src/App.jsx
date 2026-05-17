import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { ChakraProvider, ColorModeScript, Box, Flex, Button, Text, useDisclosure, useColorModeValue } from '@chakra-ui/react';
import theme from './theme';
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AddMedication from './pages/AddMedication';
import MedicationList from './pages/MedicationList';
import DoseLogging from './pages/DoseLogging';
import AdherenceDashboard from './pages/AdherenceDashboard';
import Reports from './pages/Reports';
import EditMedication from './pages/EditMedication';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

const Logo = () => {
  const gradient = useColorModeValue(
    'linear(135deg, brand.700, accent.cyan)',
    'linear(135deg, brand.300, accent.cyan)'
  );
  return (
    <Flex align="center" gap={2}>
      <Box
        w="36px"
        h="36px"
        borderRadius="xl"
        bgGradient="linear(135deg, brand.400, accent.cyan)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        boxShadow="0 4px 14px rgba(139, 92, 246, 0.4)"
      >
        <Text fontFamily="'Orbitron', sans-serif" fontWeight="800" color="white" fontSize="lg">
          M
        </Text>
      </Box>
      <Text
        fontFamily="'Orbitron', sans-serif"
        fontWeight="700"
        fontSize={{ base: 'lg', md: 'xl' }}
        bgGradient={gradient}
        bgClip="text"
        letterSpacing="0.05em"
      >
        MEDTRACK
      </Text>
    </Flex>
  );
};

const Layout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Medications', path: '/medications' },
    { label: 'Log Doses', path: '/doses' },
    { label: 'Adherence', path: '/adherence' },
    { label: 'Reports', path: '/reports' },
    { label: 'Settings', path: '/settings' },
  ];

  const isActive = (path) => location.pathname === path;
  const activeBg = useColorModeValue('rgba(139, 92, 246, 0.12)', 'rgba(255, 255, 255, 0.12)');
  const activeColor = useColorModeValue('brand.700', 'gray.50');
  const inactiveColor = useColorModeValue('gray.700', 'gray.200');
  const drawerBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(20, 20, 26, 0.95)');
  const drawerBorder = useColorModeValue('rgba(255,255,255,0.6)', 'rgba(255,255,255,0.10)');

  return (
    <Box minH="100vh" w="100%">
      <Flex
        as="nav"
        align="center"
        justify="space-between"
        position="sticky"
        top={0}
        zIndex={10}
        px={{ base: 4, md: 8 }}
        py={3}
        className="glass-strong"
      >
        <Flex align="center" gap={4} flex="1">
          <Button
            display={{ base: 'inline-flex', md: 'none' }}
            onClick={onOpen}
            variant="ghost"
            size="sm"
            aria-label="Open menu"
          >
            <HamburgerIcon />
          </Button>
          <Logo />
        </Flex>

        <Flex
          display={{ base: 'none', md: 'flex' }}
          align="center"
          gap={1}
          flex="2"
          justify="center"
        >
          {menuItems.map((item) => (
            <Button
              key={item.path}
              as={Link}
              to={item.path}
              variant="ghost"
              size="sm"
              fontFamily="'Rajdhani', sans-serif"
              fontWeight="600"
              letterSpacing="0.05em"
              color={isActive(item.path) ? activeColor : inactiveColor}
              bg={isActive(item.path) ? activeBg : 'transparent'}
              _hover={{ bg: activeBg, color: activeColor }}
            >
              {item.label}
            </Button>
          ))}
        </Flex>

        <Flex flex="1" justify="flex-end">
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            display={{ base: 'none', md: 'inline-flex' }}
          >
            Logout
          </Button>
        </Flex>
      </Flex>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay backdropFilter="blur(6px)" bg="rgba(0,0,0,0.4)" />
        <DrawerContent
          bg={drawerBg}
          backdropFilter="blur(20px) saturate(180%)"
          borderRight={`1px solid ${drawerBorder}`}
        >
          <DrawerCloseButton />
          <DrawerHeader>
            <Logo />
          </DrawerHeader>
          <DrawerBody>
            <Flex direction="column" gap={2}>
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  as={Link}
                  to={item.path}
                  variant="ghost"
                  justifyContent="flex-start"
                  size="md"
                  fontFamily="'Rajdhani', sans-serif"
                  fontWeight="600"
                  color={isActive(item.path) ? activeColor : inactiveColor}
                  bg={isActive(item.path) ? activeBg : 'transparent'}
                  onClick={onClose}
                >
                  {item.label}
                </Button>
              ))}
              <Button
                mt={4}
                colorScheme="red"
                onClick={() => { logout(); onClose(); }}
              >
                Logout
              </Button>
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Box>{children}</Box>
    </Box>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" /> : <Login />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/dashboard" /> : <Signup />}
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Navigate to="/dashboard" />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/medications"
        element={
          <ProtectedRoute>
            <Layout>
              <MedicationList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/medications/add"
        element={
          <ProtectedRoute>
            <Layout>
              <AddMedication />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/medications/edit/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <EditMedication />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doses"
        element={
          <ProtectedRoute>
            <Layout>
              <DoseLogging />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/adherence"
        element={
          <ProtectedRoute>
            <Layout>
              <AdherenceDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster position="top-right" />
      </AuthProvider>
    </ChakraProvider>
  );
};

export default App;
