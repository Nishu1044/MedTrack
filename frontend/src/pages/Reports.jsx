import { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  Flex,
  Icon,
  SimpleGrid,
  Divider,
  useToast,
} from '@chakra-ui/react';
import {
  FaFilePdf,
  FaFileCsv,
  FaFileMedicalAlt,
  FaCalendarAlt,
  FaDownload,
} from 'react-icons/fa';
import api from '../utils/axios';

const Reports = () => {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [loadingType, setLoadingType] = useState(null);
  const toast = useToast();

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

    setLoadingType(type);
    try {
      const response = await api.get(`/reports/${type}`, {
        params: dateRange,
        responseType: 'blob',
        headers: { Accept: type === 'pdf' ? 'application/pdf' : 'text/csv' },
      });

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: type === 'pdf' ? 'application/pdf' : 'text/csv' })
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `medtrack-${dateRange.startDate}-to-${dateRange.endDate}.${type}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: 'Report downloaded', status: 'success', duration: 2500, isClosable: true });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error.response?.data?.message || 'Try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingType(null);
    }
  };

  const setQuickRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  };

  return (
    <Box w="full" maxW="900px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 8 }}>
      {/* Hero */}
      <Box className="glass-card" p={{ base: 5, md: 6 }} mb={6} position="relative" overflow="hidden">
        <Icon
          as={FaFileMedicalAlt}
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
            bgGradient="linear(135deg, brand.600, #f472b6)"
            align="center"
            justify="center"
            boxShadow="0 8px 24px rgba(124, 58, 237, 0.4)"
          >
            <Icon as={FaFileMedicalAlt} boxSize={{ base: 6, md: 7 }} color="white" />
          </Flex>
          <Box>
            <Heading
              fontSize={{ base: 'xl', md: '2xl' }}
              bgGradient="linear(135deg, brand.700, accent.pink)"
              bgClip="text"
            >
              Reports
            </Heading>
            <Text fontSize="sm" color="gray.500" mt={1}>
              Export your medication adherence as PDF or CSV.
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Form */}
      <Box className="glass-card" p={{ base: 5, md: 8 }}>
        <VStack spacing={6} align="stretch">
          {/* Date range */}
          <Box>
            <Heading
              size="sm"
              fontFamily="'Rajdhani', sans-serif"
              letterSpacing="0.1em"
              textTransform="uppercase"
              mb={3}
              color="brand.500"
            >
              DATE RANGE
            </Heading>

            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
                  <HStack spacing={2}>
                    <Icon as={FaCalendarAlt} boxSize={3} color="brand.500" />
                    <Text as="span">Start Date</Text>
                  </HStack>
                </FormLabel>
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  size="lg"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
                  <HStack spacing={2}>
                    <Icon as={FaCalendarAlt} boxSize={3} color="brand.500" />
                    <Text as="span">End Date</Text>
                  </HStack>
                </FormLabel>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  size="lg"
                />
              </FormControl>
            </SimpleGrid>

            <HStack mt={3} spacing={2} flexWrap="wrap">
              <Button size="xs" variant="outline" onClick={() => setQuickRange(7)}>
                Last 7 days
              </Button>
              <Button size="xs" variant="outline" onClick={() => setQuickRange(30)}>
                Last 30 days
              </Button>
              <Button size="xs" variant="outline" onClick={() => setQuickRange(90)}>
                Last 90 days
              </Button>
            </HStack>
          </Box>

          <Divider borderColor="rgba(167, 139, 250, 0.2)" />

          {/* Format */}
          <Box>
            <Heading
              size="sm"
              fontFamily="'Rajdhani', sans-serif"
              letterSpacing="0.1em"
              textTransform="uppercase"
              mb={3}
              color="brand.500"
            >
              FORMAT
            </Heading>

            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <Box
                as="button"
                onClick={() => handleDownload('pdf')}
                disabled={loadingType !== null}
                className="glass-card"
                p={5}
                textAlign="left"
                cursor={loadingType ? 'wait' : 'pointer'}
                opacity={loadingType && loadingType !== 'pdf' ? 0.6 : 1}
              >
                <HStack spacing={3}>
                  <Flex
                    w="44px"
                    h="44px"
                    borderRadius="xl"
                    bgGradient="linear(135deg, #ef4444, #f472b6)"
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <Icon as={FaFilePdf} boxSize={5} color="white" />
                  </Flex>
                  <Box flex="1">
                    <Text fontFamily="'Rajdhani', sans-serif" fontWeight="700" fontSize="md">
                      PDF Report
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Printable, share with doctors
                    </Text>
                  </Box>
                  {loadingType === 'pdf' ? <Text fontSize="xs">…</Text> : <Icon as={FaDownload} color="gray.500" />}
                </HStack>
              </Box>

              <Box
                as="button"
                onClick={() => handleDownload('csv')}
                disabled={loadingType !== null}
                className="glass-card"
                p={5}
                textAlign="left"
                cursor={loadingType ? 'wait' : 'pointer'}
                opacity={loadingType && loadingType !== 'csv' ? 0.6 : 1}
              >
                <HStack spacing={3}>
                  <Flex
                    w="44px"
                    h="44px"
                    borderRadius="xl"
                    bgGradient="linear(135deg, #10b981, #6ee7b7)"
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <Icon as={FaFileCsv} boxSize={5} color="white" />
                  </Flex>
                  <Box flex="1">
                    <Text fontFamily="'Rajdhani', sans-serif" fontWeight="700" fontSize="md">
                      CSV Report
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Open in Excel, Sheets
                    </Text>
                  </Box>
                  {loadingType === 'csv' ? <Text fontSize="xs">…</Text> : <Icon as={FaDownload} color="gray.500" />}
                </HStack>
              </Box>
            </SimpleGrid>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

export default Reports;
