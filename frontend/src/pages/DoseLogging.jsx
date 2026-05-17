import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Flex,
  Icon,
  Badge,
  Spinner,
  Center,
  useToast,
} from '@chakra-ui/react';
import {
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaTimesCircle,
  FaPills,
  FaCalendarPlus,
  FaHistory,
} from 'react-icons/fa';
import api from '../utils/axios';

function useDoseReminders() {
  const toast = useToast();
  const intervalRef = useRef();
  const remindedDoseIds = useRef(new Set());

  useEffect(() => {
    const checkReminders = async () => {
      try {
        const res = await api.get('/doses/upcoming');
        const now = new Date();
        res.data.forEach((dose) => {
          const scheduled = new Date(dose.scheduledTime);
          const diffMinutes = (scheduled - now) / (1000 * 60);
          if (diffMinutes > 0 && diffMinutes <= 2 && !remindedDoseIds.current.has(dose._id)) {
            toast({
              title: 'Dose Reminder',
              description: `It's almost time to take ${dose.medication?.name || 'your medication'} (${
                dose.medication?.dose || ''
              }) at ${scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              status: 'info',
              duration: 8000,
              isClosable: true,
            });
            remindedDoseIds.current.add(dose._id);
          }
        });
      } catch {
        /* swallow */
      }
    };

    intervalRef.current = setInterval(checkReminders, 60 * 1000);
    checkReminders();
    return () => clearInterval(intervalRef.current);
  }, [toast]);
}

function getGoogleCalendarUrl(dose) {
  const medName = dose.medication?.name || 'Medication';
  const medDose = dose.medication?.dose || '';
  const title = encodeURIComponent(`${medName} (${medDose})`);
  const start = new Date(dose.scheduledTime);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const startStr = start.toISOString().replace(/-|:|\.\d\d\d/g, '').slice(0, 15) + 'Z';
  const endStr = end.toISOString().replace(/-|:|\.\d\d\d/g, '').slice(0, 15) + 'Z';
  const details = encodeURIComponent('Medication reminder from MedTrack');
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`;
}

const statusMeta = {
  scheduled: {
    icon: FaClock,
    gradient: 'linear(135deg, brand.500, accent.cyan)',
    badgeColor: 'rgba(139, 92, 246, 0.9)',
    label: 'SCHEDULED',
  },
  taken: {
    icon: FaCheckCircle,
    gradient: 'linear(135deg, #10b981, #6ee7b7)',
    badgeColor: 'rgba(16, 185, 129, 0.9)',
    label: 'TAKEN',
  },
  late: {
    icon: FaExclamationTriangle,
    gradient: 'linear(135deg, #f59e0b, #fde68a)',
    badgeColor: 'rgba(245, 158, 11, 0.9)',
    label: 'LATE',
  },
  missed: {
    icon: FaTimesCircle,
    gradient: 'linear(135deg, #ef4444, #f472b6)',
    badgeColor: 'rgba(239, 68, 68, 0.9)',
    label: 'MISSED',
  },
};

const formatTime = (dateString) =>
  new Date(dateString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const DoseCard = ({ dose, onMarkTaken }) => {
  const meta = statusMeta[dose.status] || statusMeta.scheduled;
  const isTooLate = () => {
    const now = new Date();
    return (now - new Date(dose.scheduledTime)) / (1000 * 60 * 60) > 4;
  };

  return (
    <Box className="glass-card" p={{ base: 4, md: 5 }} position="relative" overflow="hidden">
      <Flex justify="space-between" align="flex-start" mb={3} gap={3}>
        <HStack spacing={3} flex="1" minW={0}>
          <Flex
            w="48px"
            h="48px"
            borderRadius="xl"
            bgGradient={meta.gradient}
            align="center"
            justify="center"
            flexShrink={0}
            boxShadow="0 4px 14px rgba(139, 92, 246, 0.25)"
          >
            <Icon as={meta.icon} boxSize={5} color="white" />
          </Flex>
          <Box flex="1" minW={0}>
            <Heading size="sm" noOfLines={1} fontFamily="'Orbitron', sans-serif">
              {dose.medication?.name || 'Unknown'}
            </Heading>
            <Text fontSize="sm" color="gray.500" noOfLines={1}>
              {dose.medication?.dose || ''}
            </Text>
          </Box>
        </HStack>
        <Badge
          bg={meta.badgeColor}
          color="white"
          fontSize="2xs"
          px={2}
          py={1}
          borderRadius="md"
          flexShrink={0}
        >
          {meta.label}
        </Badge>
      </Flex>

      <HStack spacing={2} mb={4} fontSize="sm" color="gray.500">
        <Icon as={FaClock} boxSize={3} color="brand.400" />
        <Text fontFamily="'Orbitron', sans-serif" fontWeight="600" letterSpacing="0.05em">
          {formatTime(dose.scheduledTime)}
        </Text>
      </HStack>

      <HStack spacing={2} flexWrap="wrap">
        {dose.status === 'scheduled' && (
          <Button
            colorScheme="green"
            size="sm"
            leftIcon={<FaCheckCircle />}
            onClick={() => onMarkTaken(dose._id)}
            isDisabled={isTooLate()}
            title={isTooLate() ? 'You can only log within 4 hours of scheduled time' : ''}
            flex="1"
          >
            Mark Taken
          </Button>
        )}
        <Button
          as="a"
          href={getGoogleCalendarUrl(dose)}
          target="_blank"
          rel="noopener noreferrer"
          variant="outline"
          size="sm"
          leftIcon={<FaCalendarPlus />}
        >
          Calendar
        </Button>
      </HStack>
    </Box>
  );
};

const DoseLogging = () => {
  const [doses, setDoses] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dosesRes, medsRes] = await Promise.all([
        api.get('/doses/today'),
        api.get('/medications'),
      ]);
      setDoses(dosesRes.data);
      setMedications(medsRes.data);
    } catch {
      toast({ title: 'Failed to fetch data', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handler = () => fetchData();
    window.addEventListener('medicationUpdated', handler);
    return () => window.removeEventListener('medicationUpdated', handler);
  }, []);

  useDoseReminders();

  const handleMarkAsTaken = async (doseId) => {
    try {
      await api.post(`/doses/${doseId}/take`);
      toast({ title: 'Dose marked as taken', status: 'success', duration: 2500, isClosable: true });
      fetchData();
      window.dispatchEvent(new Event('doseUpdated'));
    } catch (error) {
      toast({
        title: 'Failed to mark dose',
        description: error.response?.data?.message || 'Try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Center h="60vh">
        <Spinner size="xl" color="brand.500" thickness="3px" />
      </Center>
    );
  }

  const takenCount = doses.filter((d) => d.status === 'taken' || d.status === 'late').length;
  const upcomingCount = doses.filter((d) => d.status === 'scheduled').length;
  const missedCount = doses.filter((d) => d.status === 'missed').length;

  return (
    <Box w="full" maxW="1200px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 8 }}>
      {/* Hero */}
      <Box className="glass-card" p={{ base: 5, md: 6 }} mb={6} position="relative" overflow="hidden">
        <Icon
          as={FaHistory}
          position="absolute"
          right={{ base: '-10px', md: '30px' }}
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
            <Icon as={FaPills} boxSize={{ base: 6, md: 7 }} color="white" />
          </Flex>
          <Box flex="1">
            <Heading
              fontSize={{ base: 'xl', md: '2xl' }}
              bgGradient="linear(135deg, brand.700, accent.cyan)"
              bgClip="text"
            >
              Today's Doses
            </Heading>
            <HStack spacing={4} mt={2} flexWrap="wrap" fontSize="sm" color="gray.500">
              <HStack spacing={1}>
                <Icon as={FaCheckCircle} color="#10b981" boxSize={3} />
                <Text>{takenCount} taken</Text>
              </HStack>
              <HStack spacing={1}>
                <Icon as={FaClock} color="brand.500" boxSize={3} />
                <Text>{upcomingCount} upcoming</Text>
              </HStack>
              {missedCount > 0 && (
                <HStack spacing={1}>
                  <Icon as={FaTimesCircle} color="#ef4444" boxSize={3} />
                  <Text>{missedCount} missed</Text>
                </HStack>
              )}
            </HStack>
          </Box>
        </Flex>
      </Box>

      {doses.length === 0 ? (
        <Box className="glass-card" p={10} textAlign="center">
          <Icon as={FaPills} boxSize={16} color="brand.300" mb={4} opacity={0.6} />
          <Heading size="md" mb={2} color="gray.600">
            {medications.length === 0 ? 'No medications yet' : 'No doses scheduled for today'}
          </Heading>
          <Text color="gray.500">
            {medications.length === 0
              ? 'Add a medication to start tracking doses.'
              : 'Your meds are set, but none scheduled for today.'}
          </Text>
        </Box>
      ) : (
        <VStack spacing={{ base: 3, md: 4 }} align="stretch">
          {doses.map((dose) => (
            <DoseCard key={dose._id} dose={dose} onMarkTaken={handleMarkAsTaken} />
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default DoseLogging;
