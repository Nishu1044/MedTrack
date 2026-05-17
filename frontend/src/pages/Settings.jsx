import { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Switch,
  Input,
  Button,
  Text,
  Flex,
  Divider,
  Icon,
  useToast,
  useColorMode,
} from '@chakra-ui/react';
import {
  FaUserAlt,
  FaGlobe,
  FaBell,
  FaMoon,
  FaSun,
  FaCog,
  FaSave,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const browserTz = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

const Row = ({ icon, title, subtitle, children, color = 'brand.500' }) => (
  <Flex
    align={{ base: 'flex-start', md: 'center' }}
    direction={{ base: 'column', md: 'row' }}
    justify="space-between"
    gap={4}
    py={3}
  >
    <HStack spacing={3} flex="1" align="flex-start">
      <Flex
        w="40px"
        h="40px"
        borderRadius="lg"
        bgGradient={`linear(135deg, ${color}, accent.cyan)`}
        align="center"
        justify="center"
        flexShrink={0}
      >
        <Icon as={icon} boxSize={4} color="white" />
      </Flex>
      <Box flex="1">
        <Text fontWeight="600" fontFamily="'Rajdhani', sans-serif" fontSize="md">
          {title}
        </Text>
        {subtitle && (
          <Text fontSize="xs" color="gray.500" mt={0.5}>
            {subtitle}
          </Text>
        )}
      </Box>
    </HStack>
    <Box w={{ base: 'full', md: 'auto' }}>{children}</Box>
  </Flex>
);

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || browserTz());
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notificationsEnabled !== false
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const result = await updateProfile({ name, timezone, notificationsEnabled });
    setSaving(false);
    toast({
      title: result.success ? 'Settings saved' : 'Save failed',
      description: result.success ? undefined : result.error,
      status: result.success ? 'success' : 'error',
      duration: 2500,
      isClosable: true,
    });
  };

  return (
    <Box w="full" maxW="800px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 8 }}>
      {/* Hero */}
      <Box className="glass-card" p={{ base: 5, md: 6 }} mb={6} position="relative" overflow="hidden">
        <Icon
          as={FaCog}
          position="absolute"
          right={{ base: '-10px', md: '20px' }}
          top="10px"
          boxSize={{ base: '90px', md: '120px' }}
          color="brand.300"
          opacity={0.18}
          transform="rotate(15deg)"
        />
        <Flex align="center" gap={4} position="relative" zIndex={1}>
          <Flex
            w={{ base: '52px', md: '64px' }}
            h={{ base: '52px', md: '64px' }}
            borderRadius="2xl"
            bgGradient="linear(135deg, brand.500, accent.cyan)"
            align="center"
            justify="center"
            boxShadow="0 8px 24px rgba(139, 92, 246, 0.4)"
          >
            <Icon as={FaCog} boxSize={{ base: 6, md: 7 }} color="white" />
          </Flex>
          <Box>
            <Heading
              fontSize={{ base: 'xl', md: '2xl' }}
              bgGradient="linear(135deg, brand.700, accent.cyan)"
              bgClip="text"
            >
              Settings
            </Heading>
            <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.500" mt={1}>
              Manage your profile, preferences, and appearance.
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Profile section */}
      <Box className="glass-card" p={{ base: 5, md: 6 }} mb={6}>
        <Heading
          size="sm"
          fontFamily="'Rajdhani', sans-serif"
          letterSpacing="0.1em"
          textTransform="uppercase"
          mb={4}
          color="brand.500"
        >
          PROFILE
        </Heading>

        <VStack spacing={4} align="stretch" divider={<Divider borderColor="rgba(167, 139, 250, 0.15)" />}>
          <Row icon={FaUserAlt} title="Name" subtitle="How we'll address you">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="md"
              maxW={{ base: 'full', md: '300px' }}
            />
          </Row>

          <Row icon={FaUserAlt} title="Email" subtitle="Cannot be changed" color="#94a3b8">
            <Input
              value={user?.email || ''}
              isReadOnly
              opacity={0.7}
              size="md"
              maxW={{ base: 'full', md: '300px' }}
            />
          </Row>

          <Row
            icon={FaGlobe}
            title="Timezone"
            subtitle="Used to schedule doses correctly"
            color="#06b6d4"
          >
            <HStack w={{ base: 'full', md: 'auto' }}>
              <Input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                size="md"
                maxW={{ base: 'full', md: '220px' }}
              />
              <Button
                onClick={() => setTimezone(browserTz())}
                variant="outline"
                size="md"
                whiteSpace="nowrap"
              >
                Auto
              </Button>
            </HStack>
          </Row>
        </VStack>
      </Box>

      {/* Preferences */}
      <Box className="glass-card" p={{ base: 5, md: 6 }} mb={6}>
        <Heading
          size="sm"
          fontFamily="'Rajdhani', sans-serif"
          letterSpacing="0.1em"
          textTransform="uppercase"
          mb={4}
          color="brand.500"
        >
          PREFERENCES
        </Heading>

        <VStack spacing={4} align="stretch" divider={<Divider borderColor="rgba(167, 139, 250, 0.15)" />}>
          <Row
            icon={FaBell}
            title="Email reminders"
            subtitle="Get an email ~5–15 min before each scheduled dose"
            color="#10b981"
          >
            <Switch
              isChecked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              colorScheme="purple"
              size="lg"
            />
          </Row>

          <Row
            icon={colorMode === 'dark' ? FaMoon : FaSun}
            title="Appearance"
            subtitle={colorMode === 'dark' ? 'Dark gaming mode' : 'Light glassmorphism mode'}
            color={colorMode === 'dark' ? '#7c3aed' : '#f59e0b'}
          >
            <FormControl display="flex" alignItems="center" justifyContent={{ base: 'flex-start', md: 'flex-end' }}>
              <FormLabel mb={0} mr={3} fontSize="sm" color="gray.500">
                {colorMode === 'dark' ? 'Dark' : 'Light'}
              </FormLabel>
              <Switch
                isChecked={colorMode === 'dark'}
                onChange={toggleColorMode}
                colorScheme="purple"
                size="lg"
              />
            </FormControl>
          </Row>
        </VStack>
      </Box>

      <Button
        colorScheme="blue"
        size="lg"
        onClick={save}
        isLoading={saving}
        loadingText="Saving"
        leftIcon={<FaSave />}
        w="full"
      >
        Save Profile Changes
      </Button>
    </Box>
  );
};

export default Settings;
