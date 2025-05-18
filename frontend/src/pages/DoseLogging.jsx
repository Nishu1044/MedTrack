import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Center,
  Badge
} from '@chakra-ui/react';
import api from '../utils/axios';
import { FaCoins } from 'react-icons/fa';

// Custom hook for in-app dose reminders
function useDoseReminders() {
  const toast = useToast();
  const intervalRef = useRef();
  // Use a ref to persist reminded dose IDs across renders
  const remindedDoseIds = useRef(new Set());

  useEffect(() => {
    const checkReminders = async () => {
      try {
        const res = await api.get('/doses/upcoming');
        const now = new Date();
        res.data.forEach(dose => {
          const scheduled = new Date(dose.scheduledTime);
          const diffMinutes = (scheduled - now) / (1000 * 60);
          if (
            diffMinutes > 0 &&
            diffMinutes <= 2 &&
            !remindedDoseIds.current.has(dose._id)
          ) {
            toast({
              title: 'Dose Reminder',
              description: `It's almost time to take ${dose.medication?.name || 'your medication'} (${dose.medication?.dose || ''}) at ${scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              status: 'info',
              duration: 8000,
              isClosable: true,
            });
            remindedDoseIds.current.add(dose._id);
          }
        });
      } catch (error) {
        // Optionally handle error
      }
    };

    intervalRef.current = setInterval(checkReminders, 5 * 1000); // every 5 seconds
    checkReminders(); // initial check

    return () => clearInterval(intervalRef.current);
  }, [toast]);
}

// Add this function to generate a Google Calendar event link for a dose
function getGoogleCalendarUrl(dose) {
  const medName = dose.medication?.name || 'Medication';
  const medDose = dose.medication?.dose || '';
  const title = encodeURIComponent(`${medName} (${medDose})`);
  const start = new Date(dose.scheduledTime);
  const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 min event
  const startStr = start.toISOString().replace(/-|:|\.\d\d\d/g, '').slice(0, 15) + 'Z';
  const endStr = end.toISOString().replace(/-|:|\.\d\d\d/g, '').slice(0, 15) + 'Z';
  const details = encodeURIComponent('Medication reminder from MedTrack');
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`;
}

const DoseLogging = () => {
  const [doses, setDoses] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(() => Number(localStorage.getItem('coins') || 0));
  const toast = useToast();

  // Move fetchData outside useEffect
  const fetchData = async () => {
    setLoading(true);
    try {
      const [dosesRes, medsRes] = await Promise.all([
        api.get('/doses/today'),
        api.get('/medications')
      ]);
      setDoses(dosesRes.data);
      setMedications(medsRes.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Listen for medication updates
    const handleMedicationUpdate = () => {
      fetchData();
    };
    window.addEventListener('medicationUpdated', handleMedicationUpdate);
    return () => {
      window.removeEventListener('medicationUpdated', handleMedicationUpdate);
    };
  }, [toast]);

  useDoseReminders();

  const handleMarkAsTaken = async (doseId) => {
    try {
      await api.post(`/doses/${doseId}/take`);
      // Reward: +1 coin
      const newCoins = coins + 1;
      setCoins(newCoins);
      localStorage.setItem('coins', newCoins);
      toast({
        title: '+1 coin!',
        description: 'Great job! Keep logging your doses.',
        status: 'success',
        duration: 2000,
        isClosable: true,
        icon: <FaCoins color="#FFD700" />,
      });
      fetchData();
      window.dispatchEvent(new Event('doseUpdated'));
    } catch (error) {
      console.error('Error marking dose as taken:', error);
      toast({
        title: 'Warning',
        description: error.response?.data?.message || 'Failed to mark dose as taken',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    // Convert UTC to local time and format
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'missed':
        return 'red';
      case 'late':
        return 'orange';
      case 'taken':
        return 'green';
      default:
        return 'gray';
    }
  };

  const isTooLate = (scheduledTime) => {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const diffHours = (now - scheduled) / (1000 * 60 * 60);
    return diffHours > 4;
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  // Show the message only if both are empty
  if (doses.length === 0 && medications.length === 0) {
    return (
      <Center h="100vh">
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          There are no medications or logs.
        </Alert>
      </Center>
    );
  }

  return (
    <Box w="100vw" minH="100vh" bg="gray.50" display="flex" flexDirection="column" alignItems="center" overflowX="auto" p={0}>
      <Box w="full" maxW={{ base: '100vw', md: '900px', xl: '1200px' }} p={0}>
        <Box display="flex" alignItems="center" mb={4} gap={2}>
          <FaCoins color="#FFD700" size={24} />
          <Text fontWeight="bold" fontSize={{ base: 'md', md: 'lg' }}>Coins: {coins}</Text>
        </Box>
        <Heading size={{ base: 'md', md: 'lg' }} textAlign="center" mb={4}>Today's Doses</Heading>
        <VStack spacing={{ base: 2, md: 4 }} align="stretch">
          {doses.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              <AlertTitle fontSize={{ base: 'sm', md: 'md' }}>No Doses</AlertTitle>
              <AlertDescription fontSize={{ base: 'xs', md: 'sm' }}>
                You have no doses scheduled for today.
              </AlertDescription>
            </Alert>
          ) : (
            doses.map((dose) => (
              <Box
                key={dose._id}
                p={{ base: 2, md: 4 }}
                borderWidth="1px"
                borderRadius="lg"
                position="relative"
                borderColor={dose.status === 'missed' ? 'red.500' : 'gray.200'}
                w="full"
                maxW="full"
              >
                {dose.status === 'late' && (
                  <Alert status="warning" mb={2}>
                    <AlertIcon />
                    <AlertTitle>Late Dose</AlertTitle>
                    <AlertDescription>
                      This dose is past its scheduled time.
                    </AlertDescription>
                  </Alert>
                )}
                
                {dose.status === 'missed' && (
                  <Alert status="error" mb={2}>
                    <AlertIcon />
                    <AlertTitle>MISSED DOSE</AlertTitle>
                    <AlertDescription>
                      This dose was not taken on time.
                    </AlertDescription>
                  </Alert>
                )}
                
                <VStack align="start" spacing={2}>
                  <Heading size="md">{dose.medication?.name || 'Unknown Medication'}</Heading>
                  <Text>Dose: {dose.medication?.dose || 'N/A'}</Text>
                  <Text>Scheduled Time: {formatTime(dose.scheduledTime)}</Text>
                  <Badge 
                    colorScheme={getStatusColor(dose.status)}
                    fontSize="sm"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {dose.status.toUpperCase()}
                  </Badge>
                  
                  {dose.status === 'scheduled' && (
                    <Button
                      colorScheme="blue"
                      onClick={() => handleMarkAsTaken(dose._id)}
                      isDisabled={isTooLate(dose.scheduledTime)}
                      title={isTooLate(dose.scheduledTime) ? "You can only log a dose within 4 hours of the scheduled time." : ""}
                    >
                      Mark as Taken
                    </Button>
                  )}
                  <Button
                    as="a"
                    href={getGoogleCalendarUrl(dose)}
                    target="_blank"
                    rel="noopener noreferrer"
                    colorScheme="teal"
                    size="sm"
                    mt={2}
                  >
                    Add to Google Calendar
                  </Button>
                </VStack>
              </Box>
            ))
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default DoseLogging; 