import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Flex,
  HStack,
  VStack,
  SimpleGrid,
  useToast,
  Spinner,
  Center,
  Icon,
  CircularProgress,
  CircularProgressLabel,
  Badge,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
  FaPills,
  FaCapsules,
  FaHeartbeat,
  FaChartLine,
  FaPlus,
  FaCheckCircle,
  FaFileMedicalAlt,
  FaClipboardList,
  FaClock,
  FaBolt,
} from 'react-icons/fa';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { categorizeMedication } from '../utils/medicationInsights';
import AnatomyBody from '../components/AnatomyBody';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

// ============================================================================
// Hero — animated floating decorations
// ============================================================================
const FloatingIcon = ({ icon, top, right, bottom, left, size, color, opacity, delay = 0, duration = 4, rotate }) => (
  <MotionBox
    position="absolute"
    top={top}
    right={right}
    bottom={bottom}
    left={left}
    pointerEvents="none"
    initial={{ y: 0, rotate: rotate || 0 }}
    animate={{ y: [0, -14, 0], rotate: rotate || 0 }}
    transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
  >
    <Icon as={icon} boxSize={size} color={color} opacity={opacity} />
  </MotionBox>
);

const PulseIcon = ({ icon, top, right, bottom, left, size, color, opacity }) => (
  <MotionBox
    position="absolute"
    top={top}
    right={right}
    bottom={bottom}
    left={left}
    pointerEvents="none"
    initial={{ scale: 1 }}
    animate={{ scale: [1, 1.15, 1] }}
    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
  >
    <Icon as={icon} boxSize={size} color={color} opacity={opacity} />
  </MotionBox>
);

// ============================================================================
// Stat card
// ============================================================================
const StatCard = ({ icon, label, value, helper, gradient, iconColor, index = 0 }) => (
  <MotionBox
    className="glass-card"
    p={{ base: 4, md: 6 }}
    position="relative"
    overflow="hidden"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.08 }}
  >
    <Flex justify="space-between" align="flex-start" gap={4}>
      <Box flex="1">
        <Text
          fontSize={{ base: 'xs', md: 'sm' }}
          fontFamily="'Rajdhani', sans-serif"
          fontWeight="600"
          letterSpacing="0.1em"
          textTransform="uppercase"
          opacity={0.7}
        >
          {label}
        </Text>
        <Heading
          fontSize={{ base: '3xl', md: '4xl' }}
          mt={1}
          fontFamily="'Orbitron', sans-serif"
          bgGradient={gradient}
          bgClip="text"
        >
          {value}
        </Heading>
        {helper && (
          <Text fontSize="xs" opacity={0.6} mt={1}>
            {helper}
          </Text>
        )}
      </Box>
      <MotionFlex
        w={{ base: '44px', md: '56px' }}
        h={{ base: '44px', md: '56px' }}
        borderRadius="2xl"
        bgGradient={gradient}
        align="center"
        justify="center"
        boxShadow={`0 6px 20px ${iconColor}`}
        flexShrink={0}
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        <Icon as={icon} boxSize={{ base: 5, md: 6 }} color="white" />
      </MotionFlex>
    </Flex>
  </MotionBox>
);

// ============================================================================
// Quick action tile
// ============================================================================
const ActionTile = ({ icon, label, gradient, onClick, index = 0 }) => (
  <MotionBox
    as="button"
    onClick={onClick}
    className="glass-card"
    p={{ base: 4, md: 5 }}
    textAlign="left"
    cursor="pointer"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: 0.25 + index * 0.06 }}
    whileHover={{ y: -4 }}
    whileTap={{ scale: 0.98 }}
  >
    <HStack spacing={3}>
      <Flex
        w="44px"
        h="44px"
        borderRadius="xl"
        bgGradient={gradient}
        align="center"
        justify="center"
        flexShrink={0}
      >
        <Icon as={icon} boxSize={5} color="white" />
      </Flex>
      <Box>
        <Text
          fontFamily="'Rajdhani', sans-serif"
          fontWeight="700"
          fontSize={{ base: 'md', md: 'lg' }}
          letterSpacing="0.03em"
        >
          {label}
        </Text>
      </Box>
    </HStack>
  </MotionBox>
);

// ============================================================================
// Medication Insight card — auto-categorizes meds and shows an animated journey
// ============================================================================
const MedicationInsight = ({ medication, index = 0 }) => {
  const info = categorizeMedication(medication.name);

  return (
    <MotionBox
      className="glass-card"
      p={{ base: 4, md: 5 }}
      position="relative"
      overflow="hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      {/* Header: badge + name */}
      <Flex justify="space-between" align="flex-start" gap={2} mb={2}>
        <Box flex="1" minW={0}>
          <HStack spacing={2} mb={1}>
            <Badge
              bgGradient={info.gradient}
              color="white"
              fontSize="2xs"
              px={2}
              py={1}
              borderRadius="md"
            >
              {info.category}
            </Badge>
          </HStack>
          <Heading fontSize={{ base: 'lg', md: 'xl' }} fontFamily="'Orbitron', sans-serif" noOfLines={1}>
            {medication.name}
          </Heading>
          <Text fontSize="xs" opacity={0.6}>
            {medication.dose} · {medication.category}
          </Text>
        </Box>
      </Flex>

      {/* Anatomical body with target organ highlighted */}
      <AnatomyBody info={info} />

      {/* Description + target */}
      <Text fontSize="sm" opacity={0.85} mb={2}>
        {info.description}
      </Text>
      <HStack spacing={2} fontSize="xs" opacity={0.7}>
        <Icon as={FaBolt} color={info.color} boxSize={3} />
        <Text fontFamily="'Rajdhani', sans-serif" fontWeight="600" letterSpacing="0.05em">
          TARGETS: {info.target.toUpperCase()}
        </Text>
      </HStack>
    </MotionBox>
  );
};

// ============================================================================
// Animated count-up number
// ============================================================================
const Counter = ({ to, suffix = '', duration = 1200 }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let frame;
    const start = performance.now();
    const target = Number(to) || 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setVal(Math.round(target * (0.5 - Math.cos(t * Math.PI) / 2)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, duration]);
  return (
    <>
      {val}
      {suffix}
    </>
  );
};

// ============================================================================
// Dashboard
// ============================================================================
const Dashboard = () => {
  const [stats, setStats] = useState({
    totalMedications: 0,
    dosesToday: 0,
    dosesTaken: 0,
    adherenceRate: 0,
  });
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      if (authLoading || !user) return;
      try {
        const [medicationsRes, dosesRes, adherenceRes] = await Promise.all([
          api.get('/medications'),
          api.get('/doses/today'),
          api.get('/doses/stats'),
        ]);
        setMedications(medicationsRes.data);
        setStats({
          totalMedications: medicationsRes.data.length,
          dosesToday: dosesRes.data.length,
          dosesTaken: dosesRes.data.filter(
            (dose) => dose.status === 'taken' || dose.status === 'late'
          ).length,
          adherenceRate: adherenceRes.data.adherenceRate,
        });
      } catch {
        toast({
          title: 'Error fetching dashboard data',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [toast, authLoading, user]);

  if (authLoading || loading) {
    return (
      <Center h="80vh">
        <Spinner size="xl" color="brand.500" thickness="3px" />
      </Center>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <Box w="full" maxW="1200px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 8 }}>
      {/* ====================== HERO ====================== */}
      <MotionBox
        className="glass-card"
        p={{ base: 5, md: 8 }}
        mb={{ base: 6, md: 8 }}
        position="relative"
        overflow="hidden"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        minH={{ base: '180px', md: '220px' }}
      >
        {/* Animated floating decorations */}
        <FloatingIcon
          icon={FaCapsules}
          right={{ base: '40px', md: '220px' }}
          top="30px"
          size={{ base: '60px', md: '80px' }}
          color="brand.300"
          opacity={0.22}
          duration={4.5}
          rotate="-15deg"
        />
        <FloatingIcon
          icon={FaPills}
          right={{ base: '-20px', md: '60px' }}
          top="60px"
          size={{ base: '110px', md: '150px' }}
          color="brand.400"
          opacity={0.20}
          delay={0.5}
          duration={5}
          rotate="20deg"
        />
        <PulseIcon
          icon={FaHeartbeat}
          right={{ base: '80px', md: '160px' }}
          bottom="20px"
          size={{ base: '50px', md: '70px' }}
          color="accent.cyan"
          opacity={0.30}
        />

        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'flex-start', md: 'center' }}
          justify="space-between"
          gap={4}
          position="relative"
          zIndex={1}
        >
          <Box>
            <MotionBox
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Text
                fontSize={{ base: 'sm', md: 'md' }}
                opacity={0.7}
                fontFamily="'Rajdhani', sans-serif"
                letterSpacing="0.1em"
                textTransform="uppercase"
                fontWeight="600"
              >
                Hi {firstName} 👋
              </Text>
              <Heading
                fontSize={{ base: '2xl', md: '4xl' }}
                mt={1}
                bgGradient="linear(135deg, brand.400, accent.cyan)"
                bgClip="text"
                letterSpacing="0.02em"
              >
                Your Health Snapshot
              </Heading>
              <Text mt={2} opacity={0.7} fontSize={{ base: 'sm', md: 'md' }}>
                Stay on track, one dose at a time.
              </Text>
            </MotionBox>
          </Box>

          <MotionBox
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3, type: 'spring' }}
          >
            <CircularProgress
              value={stats.adherenceRate}
              size={{ base: '100px', md: '120px' }}
              thickness="10px"
              color="brand.400"
              trackColor="rgba(167, 139, 250, 0.15)"
              capIsRound
            >
              <CircularProgressLabel
                fontFamily="'Orbitron', sans-serif"
                fontWeight="700"
                fontSize={{ base: 'lg', md: 'xl' }}
                bgGradient="linear(135deg, brand.400, accent.cyan)"
                bgClip="text"
              >
                <Counter to={stats.adherenceRate} suffix="%" />
              </CircularProgressLabel>
            </CircularProgress>
          </MotionBox>
        </Flex>
      </MotionBox>

      {/* ====================== STAT CARDS ====================== */}
      <Grid
        templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
        gap={{ base: 4, md: 6 }}
        mb={{ base: 6, md: 8 }}
      >
        <GridItem>
          <StatCard
            icon={FaPills}
            label="Total Medications"
            value={<Counter to={stats.totalMedications} />}
            gradient="linear(135deg, brand.500, brand.400)"
            iconColor="rgba(139, 92, 246, 0.4)"
            index={0}
          />
        </GridItem>
        <GridItem>
          <StatCard
            icon={FaClock}
            label="Doses Today"
            value={<Counter to={stats.dosesToday} />}
            helper={`${stats.dosesTaken} taken`}
            gradient="linear(135deg, #22d3ee, #06b6d4)"
            iconColor="rgba(34, 211, 238, 0.4)"
            index={1}
          />
        </GridItem>
        <GridItem colSpan={{ base: 1, sm: 2, lg: 1 }}>
          <StatCard
            icon={FaChartLine}
            label="Today's Adherence"
            value={<Counter to={stats.adherenceRate} suffix="%" />}
            gradient="linear(135deg, #10b981, #6ee7b7)"
            iconColor="rgba(16, 185, 129, 0.4)"
            index={2}
          />
        </GridItem>
      </Grid>

      {/* ====================== QUICK ACTIONS ====================== */}
      <Box mb={4}>
        <Text
          fontFamily="'Rajdhani', sans-serif"
          fontWeight="700"
          fontSize={{ base: 'md', md: 'lg' }}
          letterSpacing="0.1em"
          textTransform="uppercase"
          mb={3}
        >
          Quick Actions
        </Text>
      </Box>
      <Grid
        templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
        gap={{ base: 3, md: 4 }}
        mb={{ base: 6, md: 8 }}
      >
        <ActionTile
          icon={FaPlus}
          label="Add Medication"
          gradient="linear(135deg, brand.500, accent.cyan)"
          onClick={() => navigate('/medications/add')}
          index={0}
        />
        <ActionTile
          icon={FaCheckCircle}
          label="Log a Dose"
          gradient="linear(135deg, #10b981, #6ee7b7)"
          onClick={() => navigate('/doses')}
          index={1}
        />
        <ActionTile
          icon={FaClipboardList}
          label="View Medications"
          gradient="linear(135deg, #06b6d4, brand.400)"
          onClick={() => navigate('/medications')}
          index={2}
        />
        <ActionTile
          icon={FaFileMedicalAlt}
          label="View Reports"
          gradient="linear(135deg, #7c3aed, #f472b6)"
          onClick={() => navigate('/reports')}
          index={3}
        />
      </Grid>

      {/* ====================== MEDICATION INSIGHTS ====================== */}
      {medications.length > 0 && (
        <>
          <Box mb={4}>
            <HStack spacing={2}>
              <Icon as={FaHeartbeat} color="accent.cyan" />
              <Text
                fontFamily="'Rajdhani', sans-serif"
                fontWeight="700"
                fontSize={{ base: 'md', md: 'lg' }}
                letterSpacing="0.1em"
                textTransform="uppercase"
              >
                How Your Medications Work
              </Text>
            </HStack>
            <Text fontSize="xs" opacity={0.6} mt={1}>
              What each medicine targets in your body.
            </Text>
          </Box>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 3, md: 4 }}>
            {medications.slice(0, 4).map((med, i) => (
              <MedicationInsight key={med._id} medication={med} index={i} />
            ))}
          </SimpleGrid>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
