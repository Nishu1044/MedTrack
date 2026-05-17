import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  VStack,
  Heading,
  Text,
  Flex,
  useToast,
} from '@chakra-ui/react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Logo = () => (
  <Flex align="center" gap={2} justify="center" mb={2}>
    <Box
      w="48px"
      h="48px"
      borderRadius="2xl"
      bgGradient="linear(135deg, brand.400, accent.cyan)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      boxShadow="0 8px 24px rgba(139, 92, 246, 0.45)"
    >
      <Text fontFamily="'Orbitron', sans-serif" fontWeight="800" color="white" fontSize="2xl">
        M
      </Text>
    </Box>
    <Text
      fontFamily="'Orbitron', sans-serif"
      fontWeight="700"
      fontSize="2xl"
      bgGradient="linear(135deg, brand.700, accent.cyan)"
      bgClip="text"
      letterSpacing="0.08em"
    >
      MEDTRACK
    </Text>
  </Flex>
);

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await signup(email, password, name);
    setLoading(false);

    if (result.success) {
      toast({ title: 'Account created', status: 'success', duration: 2000, isClosable: true });
      navigate('/dashboard');
    } else {
      toast({
        title: 'Signup failed',
        description: result.error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" p={{ base: 4, md: 6 }}>
      <Box className="glass-card" w="full" maxW="420px" p={{ base: 6, md: 10 }}>
        <form onSubmit={handleSubmit}>
          <VStack spacing={5} align="stretch">
            <Logo />

            <VStack spacing={1} textAlign="center">
              <Heading size="lg">
                Create account
              </Heading>
              <Text fontSize="sm" color="gray.600">
                Track meds, get reminders, never miss a dose.
              </Text>
            </VStack>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="600">
                Name
              </FormLabel>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                size="lg"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="600">
                Email
              </FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                size="lg"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="600">
                Password
              </FormLabel>
              <InputGroup size="lg">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  pr="3rem"
                />
                <InputRightElement width="3rem" h="full">
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                    size="sm"
                    variant="ghost"
                    color="brand.500"
                    onClick={() => setShowPassword((v) => !v)}
                  />
                </InputRightElement>
              </InputGroup>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Min 8 characters.
              </Text>
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              isLoading={loading}
              loadingText="Creating account"
              w="full"
              mt={2}
            >
              Sign Up
            </Button>

            <Text fontSize="sm" textAlign="center" color="gray.600">
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#7c3aed', fontWeight: 600 }}>
                Login
              </Link>
            </Text>
          </VStack>
        </form>
      </Box>
    </Flex>
  );
};

export default Signup;
