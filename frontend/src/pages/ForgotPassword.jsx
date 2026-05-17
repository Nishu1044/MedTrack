import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import api from '../utils/axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" p={{ base: 4, md: 6 }}>
      <Box className="glass-card" p={{ base: 6, md: 10 }} maxWidth="420px" w="full">
        <VStack spacing={4} align="flex-start" w="full">
          <Heading size="lg">Forgot Password</Heading>
          {sent ? (
            <>
              <Text>
                If an account exists for <strong>{email}</strong>, a reset link has been sent.
                Check your inbox (and spam folder).
              </Text>
              <Text fontSize="sm" color="gray.500">
                The link expires in 1 hour.
              </Text>
              <Link to="/login" style={{ color: '#3182ce' }}>
                Back to login
              </Link>
            </>
          ) : (
            <>
              <Text>Enter your email and we'll send you a reset link.</Text>
              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <VStack spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </FormControl>
                  <Button type="submit" colorScheme="blue" width="full" isLoading={loading}>
                    Send reset link
                  </Button>
                </VStack>
              </form>
              <Text fontSize="sm">
                <Link to="/login" style={{ color: '#3182ce' }}>
                  Back to login
                </Link>
              </Text>
            </>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
