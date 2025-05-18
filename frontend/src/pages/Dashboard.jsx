import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
} from '@chakra-ui/react';
import api from '../utils/axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalMedications: 0,
    dosesToday: 0,
    dosesTaken: 0,
    adherenceRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [medicationsRes, dosesRes, adherenceRes] = await Promise.all([
          api.get('/medications'),
          api.get('/doses/today'),
          api.get('/doses/stats'),
        ]);

        setStats({
          totalMedications: medicationsRes.data.length,
          dosesToday: dosesRes.data.length,
          dosesTaken: dosesRes.data.filter(dose => dose.status === 'taken' || dose.status === 'late').length,
          adherenceRate: adherenceRes.data.adherenceRate,
        });
      } catch (error) {
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
  }, [toast]);

  return (
    <Box w="100vw" minH="100vh" bg="gray.50" display="flex" flexDirection="column" alignItems="center" overflowX="auto">
      <Box w="full" maxW={{ base: '100vw', md: '900px', xl: '1200px' }} p={{ base: 1, sm: 2, md: 6 }}>
        <Heading mb={{ base: 4, md: 8 }} fontSize={{ base: '2xl', md: '3xl' }} textAlign="center">Dashboard</Heading>
        <Grid 
          templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} 
          gap={{ base: 2, md: 6 }} 
          mb={{ base: 4, md: 8 }}
          w="full"
        >
          <GridItem>
            <Stat p={{ base: 2, md: 4 }} shadow="md" borderWidth="1px" borderRadius="lg" w="full">
              <StatLabel fontSize={{ base: 'sm', md: 'md' }}>Total Medications</StatLabel>
              <StatNumber fontSize={{ base: 'xl', md: '2xl' }}>{stats.totalMedications}</StatNumber>
            </Stat>
          </GridItem>

          <GridItem>
            <Stat p={{ base: 2, md: 4 }} shadow="md" borderWidth="1px" borderRadius="lg" w="full">
              <StatLabel fontSize={{ base: 'sm', md: 'md' }}>Doses Today</StatLabel>
              <StatNumber fontSize={{ base: 'xl', md: '2xl' }}>{stats.dosesToday}</StatNumber>
              <StatHelpText fontSize={{ base: 'xs', md: 'sm' }}>
                {stats.dosesTaken} taken
              </StatHelpText>
            </Stat>
          </GridItem>

          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Stat p={{ base: 2, md: 4 }} shadow="md" borderWidth="1px" borderRadius="lg" w="full">
              <StatLabel fontSize={{ base: 'sm', md: 'md' }}>Weekly Adherence</StatLabel>
              <StatNumber fontSize={{ base: 'xl', md: '2xl' }}>{stats.adherenceRate}%</StatNumber>
            </Stat>
          </GridItem>
        </Grid>

        <Grid 
          templateColumns={{ base: '1fr', sm: '1fr 1fr' }} 
          gap={{ base: 2, md: 4 }} 
          w="full"
          mb={{ base: 2, md: 4 }}
        >
          <GridItem>
            <Button
              colorScheme="blue"
              size={{ base: 'md', md: 'lg' }}
              w="full"
              fontSize={{ base: 'sm', md: 'md' }}
              onClick={() => navigate('/medications/add')}
            >
              Add Medication
            </Button>
          </GridItem>
          <GridItem>
            <Button
              colorScheme="green"
              size={{ base: 'md', md: 'lg' }}
              w="full"
              fontSize={{ base: 'sm', md: 'md' }}
              onClick={() => navigate('/doses')}
            >
              Log Dose
            </Button>
          </GridItem>
          <GridItem>
            <Button
              colorScheme="purple"
              size={{ base: 'md', md: 'lg' }}
              w="full"
              fontSize={{ base: 'sm', md: 'md' }}
              onClick={() => navigate('/')}
            >
              View Reports
            </Button>
          </GridItem>
          <GridItem>
            <Button
              colorScheme="teal"
              size={{ base: 'md', md: 'lg' }}
              w="full"
              fontSize={{ base: 'sm', md: 'md' }}
              onClick={() => navigate('/medications')}
            >
              View Medications
            </Button>
          </GridItem>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard; 