import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Heading,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  SimpleGrid,
  Icon,
  Flex,
  Text,
  IconButton,
  Divider,
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
  FaPrescriptionBottleAlt,
} from 'react-icons/fa';
import api from '../utils/axios';

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

const AddMedication = () => {
  const [formData, setFormData] = useState({
    name: '',
    dose: '',
    frequency: { timesPerDay: 1, times: ['08:00'] },
    startDate: '',
    endDate: '',
    category: 'Me',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleTimeChange = (index, value) => {
    const newTimes = [...formData.frequency.times];
    newTimes[index] = value;
    setFormData({ ...formData, frequency: { ...formData.frequency, times: newTimes } });
  };

  const addTimeSlot = () => {
    if (formData.frequency.times.length < formData.frequency.timesPerDay) {
      setFormData({
        ...formData,
        frequency: { ...formData.frequency, times: [...formData.frequency.times, '08:00'] },
      });
    }
  };

  const removeTimeSlot = (index) => {
    const newTimes = formData.frequency.times.filter((_, i) => i !== index);
    setFormData({ ...formData, frequency: { ...formData.frequency, times: newTimes } });
  };

  const handleTimesPerDayChange = (value) => {
    const timesPerDay = parseInt(value);
    const currentTimes = formData.frequency.times;
    let newTimes = [...currentTimes];

    if (timesPerDay > currentTimes.length) {
      while (newTimes.length < timesPerDay) newTimes.push('08:00');
    } else if (timesPerDay < currentTimes.length) {
      newTimes = newTimes.slice(0, timesPerDay);
    }

    setFormData({ ...formData, frequency: { ...formData.frequency, timesPerDay, times: newTimes } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formattedTimes = formData.frequency.times.map((time) => {
        const [hours, minutes] = time.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      });
      await api.post('/medications', {
        ...formData,
        frequency: { ...formData.frequency, times: formattedTimes },
      });
      toast({ title: 'Medication added', status: 'success', duration: 2500, isClosable: true });
      navigate('/medications');
    } catch (error) {
      toast({
        title: 'Failed to add medication',
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
      {/* Hero banner */}
      <Box className="glass-card" p={{ base: 5, md: 6 }} mb={6} position="relative" overflow="hidden">
        <Icon
          as={FaPrescriptionBottleAlt}
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
            <Icon as={FaPills} boxSize={{ base: 6, md: 7 }} color="white" />
          </Flex>
          <Box>
            <Heading
              fontSize={{ base: 'xl', md: '2xl' }}
              bgGradient="linear(135deg, brand.700, accent.cyan)"
              bgClip="text"
            >
              Add New Medication
            </Heading>
            <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" mt={1}>
              We'll create dose reminders automatically for the dates you set.
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Form */}
      <Box className="glass-card" p={{ base: 5, md: 8 }}>
        <form onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            {/* Section: Medication info */}
            <Box>
              <SectionHeader icon={FaCapsules} title="MEDICATION INFO" />
              <VStack spacing={4} align="stretch" mt={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600">
                    Medication Name
                  </FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Paracetamol"
                    size="lg"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600">
                    Dose
                  </FormLabel>
                  <Input
                    value={formData.dose}
                    onChange={(e) => setFormData({ ...formData, dose: e.target.value })}
                    placeholder="e.g., 500mg, 1 tablet"
                    size="lg"
                  />
                </FormControl>
              </VStack>
            </Box>

            <Divider borderColor="rgba(167, 139, 250, 0.2)" />

            {/* Section: Schedule */}
            <Box>
              <SectionHeader icon={FaClock} title="SCHEDULE" color="#06b6d4" />
              <VStack spacing={4} align="stretch" mt={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600">
                    Times Per Day
                  </FormLabel>
                  <NumberInput
                    min={1}
                    max={12}
                    value={formData.frequency.timesPerDay}
                    onChange={handleTimesPerDayChange}
                    size="lg"
                  >
                    <NumberInputField bg="rgba(255,255,255,0.65)" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <VStack spacing={3} align="stretch">
                  {formData.frequency.times.map((time, index) => (
                    <FormControl key={index} isRequired>
                      <FormLabel fontSize="sm" fontWeight="600">
                        Time {index + 1}
                      </FormLabel>
                      <HStack>
                        <Input
                          type="time"
                          value={time}
                          onChange={(e) => handleTimeChange(index, e.target.value)}
                          size="lg"
                        />
                        {index > 0 && (
                          <IconButton
                            aria-label="Remove time"
                            icon={<FaTrash />}
                            colorScheme="red"
                            variant="outline"
                            size="lg"
                            onClick={() => removeTimeSlot(index)}
                          />
                        )}
                      </HStack>
                    </FormControl>
                  ))}
                  {formData.frequency.times.length < formData.frequency.timesPerDay && (
                    <Button
                      leftIcon={<FaPlus />}
                      onClick={addTimeSlot}
                      variant="outline"
                      size="sm"
                      alignSelf="flex-start"
                    >
                      Add Time Slot
                    </Button>
                  )}
                </VStack>

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
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      size="lg"
                    />
                  </FormControl>
                </SimpleGrid>
              </VStack>
            </Box>

            <Divider borderColor="rgba(167, 139, 250, 0.2)" />

            {/* Section: Who & Notes */}
            <Box>
              <SectionHeader icon={FaUserAlt} title="WHO & NOTES" color="#10b981" />
              <VStack spacing={4} align="stretch" mt={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600">
                    For Whom?
                  </FormLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g., Take with food, avoid dairy..."
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
                loadingText="Adding"
                leftIcon={<FaPlus />}
                flex="2"
              >
                Add Medication
              </Button>
            </HStack>
          </VStack>
        </form>
      </Box>
    </Box>
  );
};

export default AddMedication;
