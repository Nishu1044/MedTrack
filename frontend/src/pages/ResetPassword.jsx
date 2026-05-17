import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
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
  useToast,
} from '@chakra-ui/react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../utils/axios';

const PasswordInput = ({ value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <InputGroup>
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        pr="3rem"
      />
      <InputRightElement width="3rem" h="full">
        <IconButton
          aria-label={show ? 'Hide password' : 'Show password'}
          icon={show ? <FaEyeSlash /> : <FaEye />}
          size="sm"
          variant="ghost"
          color="brand.500"
          onClick={() => setShow((v) => !v)}
        />
      </InputRightElement>
    </InputGroup>
  );
};

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  if (!token) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" p={{ base: 4, md: 6 }}>
        <Box className="glass-card" p={{ base: 6, md: 10 }} maxWidth="420px" w="full">
          <VStack spacing={3} align="flex-start">
            <Heading size="md">Invalid reset link</Heading>
            <Text>This link is missing a reset token. Request a new one.</Text>
            <Link to="/forgot-password" style={{ color: '#3182ce' }}>Request a new link</Link>
          </VStack>
        </Box>
      </Box>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: 'Password must be at least 8 characters', status: 'error', duration: 3000 });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Passwords do not match', status: 'error', duration: 3000 });
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast({
        title: 'Password reset',
        description: 'You can now log in with your new password.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Reset failed',
        description: error.response?.data?.message || 'Try requesting a new reset link.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" p={4}>
      <Box className="glass-card" p={{ base: 6, md: 10 }} maxWidth="420px" w="full">
        <VStack spacing={4} align="flex-start" w="full">
          <Heading size="lg">Reset Password</Heading>
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>New password</FormLabel>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Min 8 characters.
                </Text>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Confirm password</FormLabel>
                <PasswordInput
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                />
              </FormControl>
              <Button type="submit" colorScheme="blue" width="full" isLoading={loading}>
                Reset password
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Box>
  );
};

export default ResetPassword;
