import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Select,
  Textarea,
  SimpleGrid,
  Flex,
  Icon,
  Text,
  Center,
  Spinner,
  IconButton,
  Divider,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
} from '@chakra-ui/react';
import {
  FaPills,
  FaCapsules,
  FaCalendarAlt,
  FaClock,
  FaUserAlt,
  FaStickyNote,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSave,
} from 'react-icons/fa';
import api from '../utils/axios';

const safeDateInput = (val) => {
  if (!val) return '';
  return typeof val === 'string'
    ? val.split('T')[0]
    : new Date(val).toISOString().split('T')[0];
};

const SectionHeader = ({ icon, title, color = 'brand.500' }) => (
  <HStack spacing={3} mb={2}>
    <Flex
      w="36px"
      h="36px"
      borderRadius="lg"
      bgGradient={`linear(135deg, ${color}, accent.cyan)`}
      align="center"
      justify="center"
      boxShadow="0 4px 14px rgba(139, 92, 246, 0.3)"
    >
      <Icon as={icon} boxSize={4} color="white" />
    </Flex>
    <Heading size="sm" fontFamily="'Rajdhani', sans-serif" letterSpacing="0.05em">
      {title}
    </Heading>
  </HStack>
);

const EditMedication = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!location.state?.medication);
  const [medication, setMedication] = useState(location.state?.medication || null);

  useEffect(() => {
    if (medication) return;
    const fetchMed = async () => {
      try {
        const res = await api.get(`/medications/${id}`);
        setMedication(res.data);
      } catch {
        toast({
          title: 'Medication not found',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        navigate('/medications');
      } finally {
        setFetching(false);
      }
    };
    fetchMed();
  }, [id, medication, navigate, toast]);

  if (fetching || !medication) {
    return (
      <Center h="60vh">
        <Spinner size="xl" color="brand.500" thickness="3px" />
      </Center>
    );
  }

  const handleTimeChange = (index, value) => {
    const newTimes = [...medication.frequency.times];
    newTimes[index] = value;
    setMedication({ ...medication, frequency: { ...medication.frequency, times: newTimes } });
  };

  const addTimeSlot = () => {
    if (medication.frequency.times.length < 4) {
      setMedication({
        ...medication,
        frequency: { ...medication.frequency, times: [...medication.frequency.times, '08:00'] },
      });
    }
  };

  const removeTimeSlot = (index) => {
    if (medication.frequency.times.length > 1) {
      const newTimes = medication.frequency.times.filter((_, i) => i !== index);
      setMedication({ ...medication, frequency: { ...medication.frequency, times: newTimes } });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/medications/${id}`, medication);
      toast({ title: 'Medication updated', status: 'success', duration: 2500, isClosable: true });
      navigate('/medications');
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error.response?.data?.message || 'Try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box w="full" maxW="800px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 8 }}>
      <Box className="glass-card" p={{ base: 5, md: 6 }} mb={6} position="relative" overflow="hidden">
        <Icon
          as={FaPills}
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
            <Icon as={FaEdit} boxSize={{ base: 6, md: 7 }} color="white" />
          </Flex>
          <Box>
            <Heading
              fontSize={{ base: 'xl', md: '2xl' }}
              bgGradient="linear(135deg, brand.700, accent.cyan)"
              bgClip="text"
            >
              Edit Medication
            </Heading>
            <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" mt={1}>
              Changes to schedule will regenerate future doses.
            </Text>
          </Box>
        </Flex>
      </Box>

      <Box className="glass-card" p={{ base: 5, md: 8 }}>
        <form onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            <Box>
              <SectionHeader icon={FaCapsules} title="MEDICATION INFO" />
              <VStack spacing={4} align="stretch" mt={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600">
                    Name
                  </FormLabel>
                  <Input
                    value={medication.name}
                    onChange={(e) => setMedication({ ...medication, name: e.target.value })}
                    size="lg"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600">
                    Dose
                  </FormLabel>
                  <Input
                    value={medication.dose}
                    onChange={(e) => setMedication({ ...medication, dose: e.target.value })}
                    placeholder="e.g., 1 tablet, 5ml"
                    size="lg"
                  />
                </FormControl>
              </VStack>
            </Box>

            <Divider borderColor="rgba(167, 139, 250, 0.2)" />

            <Box>
              <SectionHeader icon={FaClock} title="SCHEDULE" color="#06b6d4" />
              <VStack spacing={4} align="stretch" mt={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600">
                    Times Per Day
                  </FormLabel>
                  <NumberInput
                    min={1}
                    max={4}
                    value={medication.frequency.timesPerDay}
                    onChange={(value) => {
                      const timesPerDay = parseInt(value);
                      const currentTimes = medication.frequency.times;
                      let newTimes = [...currentTimes];

                      if (timesPerDay > currentTimes.length) {
                        while (newTimes.length < timesPerDay) newTimes.push('08:00');
                      } else if (timesPerDay < currentTimes.length) {
                        newTimes = newTimes.slice(0, timesPerDay);
                      }

                      setMedication({
                        ...medication,
                        frequency: { ...medication.frequency, timesPerDay, times: newTimes },
                      });
                    }}
                    size="lg"
                  >
                    <NumberInputField bg="rgba(255,255,255,0.65)" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600">
                    Dosing Times
                  </FormLabel>
                  <VStack spacing={2} align="stretch">
                    {medication.frequency.times.map((time, index) => (
                      <HStack key={index}>
                        <Input
                          type="time"
                          value={time}
                          onChange={(e) => handleTimeChange(index, e.target.value)}
                          size="lg"
                        />
                        {medication.frequency.times.length > 1 && (
                          <IconButton
                            icon={<FaTrash />}
                            onClick={() => removeTimeSlot(index)}
                            colorScheme="red"
                            variant="outline"
                            size="lg"
                            aria-label="Remove time slot"
                          />
                        )}
                      </HStack>
                    ))}
                    {medication.frequency.times.length < 4 && (
                      <Button
                        leftIcon={<FaPlus />}
                        onClick={addTimeSlot}
                        variant="outline"
                        size="sm"
                        alignSelf="flex-start"
                      >
                        Add Time
                      </Button>
                    )}
                  </VStack>
                </FormControl>

                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="600">
                      <HStack spacing={2}>
                        <Icon as={FaCalendarAlt} boxSize={3} color="brand.500" />
                        <Text as="span">Start Date</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      type="date"
                      value={safeDateInput(medication.startDate)}
                      onChange={(e) => setMedication({ ...medication, startDate: e.target.value })}
                      size="lg"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="600">
                      <HStack spacing={2}>
                        <Icon as={FaCalendarAlt} boxSize={3} color="brand.500" />
                        <Text as="span">End Date</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      type="date"
                      value={safeDateInput(medication.endDate)}
                      onChange={(e) => setMedication({ ...medication, endDate: e.target.value })}
                      size="lg"
                    />
                  </FormControl>
                </SimpleGrid>
              </VStack>
            </Box>

            <Divider borderColor="rgba(167, 139, 250, 0.2)" />

            <Box>
              <SectionHeader icon={FaUserAlt} title="WHO & NOTES" color="#10b981" />
              <VStack spacing={4} align="stretch" mt={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600">
                    Category
                  </FormLabel>
                  <Select
                    value={medication.category}
                    onChange={(e) => setMedication({ ...medication, category: e.target.value })}
                    size="lg"
                  >
                    <option value="Me">Me</option>
                    <option value="Mom">Mom</option>
                    <option value="Dad">Dad</option>
                    <option value="Other">Other</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600">
                    <HStack spacing={2}>
                      <Icon as={FaStickyNote} boxSize={3} color="brand.500" />
                      <Text as="span">Notes (optional)</Text>
                    </HStack>
                  </FormLabel>
                  <Textarea
                    value={medication.notes || ''}
                    onChange={(e) => setMedication({ ...medication, notes: e.target.value })}
                    placeholder="Any additional notes"
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </Box>

            <HStack spacing={3} pt={2}>
              <Button
                onClick={() => navigate('/medications')}
                variant="outline"
                size="lg"
                flex="1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                isLoading={loading}
                loadingText="Saving"
                leftIcon={<FaSave />}
                flex="2"
              >
                Save Changes
              </Button>
            </HStack>
          </VStack>
        </form>
      </Box>
    </Box>
  );
};

export default EditMedication;
