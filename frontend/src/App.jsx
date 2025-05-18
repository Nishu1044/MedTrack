import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ChakraProvider, Box, Flex, Button, useDisclosure } from '@chakra-ui/react';
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

const Layout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, logout } = useAuth();

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Medications', path: '/medications' },
    { label: 'Log Doses', path: '/doses' },
    { label: 'Adherence', path: '/adherence' },
    { label: 'Reports', path: '/reports' },
  ];

  return (
    <Box minH="100vh" w="100%">
      <Flex
        as="nav"
        align="center"
        justify="space-between"
        wrap="wrap"
        padding={{ base: 4, md: 6 }}
        bg="blue.500"
        color="white"
        w="100%"
        overflowX="auto"
      >
        <Button
          display={{ base: 'block', md: 'none' }}
          onClick={onOpen}
          variant="ghost"
          color="white"
          size="sm"
        >
          <HamburgerIcon />
        </Button>

        <Box
          display={{ base: 'none', md: 'flex' }}
          width={{ base: 'full', md: 'auto' }}
          alignItems="center"
          flexGrow={1}
        >
          {menuItems.map((item) => (
            <Button
              key={item.path}
              as={Link}
              to={item.path}
              variant="ghost"
              color="white"
              mr={4}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Button 
          variant="ghost" 
          color="white" 
          onClick={logout}
          size={{ base: 'sm', md: 'md' }}
          display={{ base: 'none', md: 'inline-flex' }}
        >
          Logout
        </Button>
      </Flex>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menu</DrawerHeader>
          <DrawerBody>
            <Flex direction="column">
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  as={Link}
                  to={item.path}
                  variant="ghost"
                  justifyContent="flex-start"
                  mb={2}
                  size={{ base: 'sm', md: 'md' }}
                  onClick={onClose}
                >
                  {item.label}
                </Button>
              ))}
              <Button
                mt={4}
                colorScheme="red"
                variant="solid"
                onClick={() => { logout(); onClose(); }}
                display={{ base: 'block', md: 'none' }}
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
    </Routes>
  );
};

const App = () => {
  return (
    <ChakraProvider>
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
