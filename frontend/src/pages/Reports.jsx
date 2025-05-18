import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  Button,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Text,
} from '@chakra-ui/react';
import api from '../utils/axios';

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [loadingType, setLoadingType] = useState(null);
  const [medications, setMedications] = useState([]);
  const [doses, setDoses] = useState([]);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [medsRes, dosesRes] = await Promise.all([
          api.get('/medications'),
          api.get('/doses/today')
        ]);
        setMedications(medsRes.data);
        setDoses(dosesRes.data);
      } catch (error) {
        // Optionally show a toast here
      }
    };
    fetchData();
  }, []);

  const handleDownload = async (type) => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast({
        title: 'Date range required',
        description: 'Please select both start and end dates',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Show info if no data, but still proceed
    if (medications.length === 0 && doses.length === 0) {
      toast({
        title: 'No data to export',
        description: 'You have no medications or logs to include in the report. The report will be empty.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }

    setLoadingType(type);
    try {
      const response = await api.get(
        `/reports/${type}`,
        {
          params: dateRange,
          responseType: 'blob',
          headers: {
            Accept: type === 'pdf' ? 'application/pdf' : 'text/csv',
          },
        }
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data], {
        type: type === 'pdf' ? 'application/pdf' : 'text/csv'
      }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `medication-report-${dateRange.startDate}-to-${dateRange.endDate}.${type}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Report downloaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error downloading report',
        description: error.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <Box w="100vw" minH="100vh" bg="gray.50" display="flex" flexDirection="column" alignItems="center" overflowX="auto">
      <Box w="full" maxW={{ base: '100vw', md: '900px', xl: '1200px' }} p={{ base: 1, sm: 2, md: 6 }}>
        <Heading mb={8} fontSize={{ base: '2xl', md: '3xl' }} textAlign="center">Reports</Heading>

        <VStack spacing={{ base: 4, md: 6 }} align="stretch" maxW={{ base: 'full', md: '600px' }}>
          <Text fontSize={{ base: 'sm', md: 'md' }}>
            Select a date range to generate medication adherence reports. You can
            download the report in PDF or CSV format.
          </Text>

          <FormControl>
            <FormLabel fontSize={{ base: 'sm', md: 'md' }}>Start Date</FormLabel>
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              size={{ base: 'sm', md: 'md' }}
            />
          </FormControl>

          <FormControl>
            <FormLabel fontSize={{ base: 'sm', md: 'md' }}>End Date</FormLabel>
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              size={{ base: 'sm', md: 'md' }}
            />
          </FormControl>

          <VStack spacing={{ base: 3, md: 4 }} align="stretch">
            <Button
              colorScheme="blue"
              size={{ base: 'md', md: 'lg' }}
              onClick={() => handleDownload('pdf')}
              isLoading={loadingType === 'pdf'}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              Download PDF Report
            </Button>

            <Button
              colorScheme="green"
              size={{ base: 'md', md: 'lg' }}
              onClick={() => handleDownload('csv')}
              isLoading={loadingType === 'csv'}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              Download CSV Report
            </Button>
          </VStack>
        </VStack>
      </Box>
    </Box>
  );
};

export default Reports; 