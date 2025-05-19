import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      toast({
        title: 'Account created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
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
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <Box p={8} maxWidth="400px" borderWidth={1} borderRadius={8} boxShadow="lg">
        <VStack spacing={4} align="flex-start" w="full">
          <VStack spacing={1} align={['center', 'flex-start']} w="full">
            <Heading>Sign Up</Heading>
            <Text>Create your account</Text>
            <Text>Please use password more than 6 characters</Text>
          </VStack>

          <FormControl>
            <FormLabel>Name</FormLabel>
            <Input
              rounded="md"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Email</FormLabel>
            <Input
              rounded="md"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input
              rounded="md"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>

          <Button
            rounded="md"
            colorScheme="blue"
            width="full"
            onClick={handleSubmit}
            isLoading={loading}
          >
            Sign Up
          </Button>

          <Text>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'blue' }}>
              Login
            </Link>
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default Signup; 