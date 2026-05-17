import { Box, Heading, Text, Button, VStack, Icon, Flex } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';

const NotFound = () => (
  <Flex minH="100vh" align="center" justify="center" p={{ base: 4, md: 6 }}>
    <Box className="glass-card" p={{ base: 8, md: 12 }} textAlign="center" maxW="500px" w="full">
      <VStack spacing={4}>
        <Flex
          w="80px"
          h="80px"
          borderRadius="2xl"
          bgGradient="linear(135deg, brand.500, accent.cyan)"
          align="center"
          justify="center"
          boxShadow="0 8px 24px rgba(139, 92, 246, 0.4)"
        >
          <Icon as={FaExclamationTriangle} boxSize={8} color="white" />
        </Flex>
        <Heading
          fontSize="6xl"
          bgGradient="linear(135deg, brand.700, accent.cyan)"
          bgClip="text"
          fontFamily="'Orbitron', sans-serif"
        >
          404
        </Heading>
        <Text color="gray.500" fontSize="lg">
          This page doesn't exist.
        </Text>
        <Button as={Link} to="/dashboard" colorScheme="blue" leftIcon={<FaHome />} size="lg" mt={2}>
          Back to Dashboard
        </Button>
      </VStack>
    </Box>
  </Flex>
);

export default NotFound;
