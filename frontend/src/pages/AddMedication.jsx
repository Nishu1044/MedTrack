import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Text,
} from '@chakra-ui/react';
import api from '../utils/axios';

const AddMedication = () => {
  const [formData, setFormData] = useState({
    name: '',
    dose: '',
    frequency: {
      timesPerDay: 1,
      times: ['08:00'],
    },
    startDate: '',
    endDate: '',
    category: 'Me',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleTimeChange = (index, value) => {
    // Ensure time is in 24-hour format with leading zeros
    const [hours, minutes] = value.split(':');
    const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    
    const newTimes = [...formData.frequency.times];
    newTimes[index] = formattedTime;
    setFormData({
      ...formData,
      frequency: {
        ...formData.frequency,
        times: newTimes,
      },
    });
  };

  const addTimeSlot = () => {
    if (formData.frequency.times.length < formData.frequency.timesPerDay) {
      setFormData({
        ...formData,
        frequency: {
          ...formData.frequency,
          times: [...formData.frequency.times, '08:00'],
        },
      });
    }
  };

  const removeTimeSlot = (index) => {
    const newTimes = formData.frequency.times.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      frequency: {
        ...formData.frequency,
        times: newTimes,
      },
    });
  };

  const handleTimesPerDayChange = (value) => {
    const timesPerDay = parseInt(value);
    const currentTimes = formData.frequency.times;
    let newTimes = [...currentTimes];

    if (timesPerDay > currentTimes.length) {
      // Add new time slots
      while (newTimes.length < timesPerDay) {
        newTimes.push('08:00');
      }
    } else if (timesPerDay < currentTimes.length) {
      // Remove excess time slots
      newTimes = newTimes.slice(0, timesPerDay);
    }

    setFormData({
      ...formData,
      frequency: {
        ...formData.frequency,
        timesPerDay,
        times: newTimes,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Format all times to ensure 24-hour format with leading zeros
      const formattedTimes = formData.frequency.times.map(time => {
        const [hours, minutes] = time.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      });

      // Ensure start and end dates are in UTC
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      // Set time to start of day for start date and end of day for end date
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const medicationData = {
        ...formData,
        frequency: {
          ...formData.frequency,
          times: formattedTimes
        },
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      console.log('Submitting medication data:', medicationData);
      await api.post('/medications', medicationData);
      
      toast({
        title: 'Success',
        description: 'Medication added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      navigate('/medications');
    } catch (error) {
      console.error('Error adding medication:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add medication',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={8} maxWidth="600px" mx="auto">
      <Heading mb={8}>Add New Medication</Heading>

      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Medication Name</FormLabel>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Dose</FormLabel>
            <Input
              value={formData.dose}
              onChange={(e) => setFormData({ ...formData, dose: e.target.value })}
              placeholder="e.g., 500mg"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Times Per Day</FormLabel>
            <NumberInput
              min={1}
              max={12}
              value={formData.frequency.timesPerDay}
              onChange={handleTimesPerDayChange}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          {formData.frequency.times.map((time, index) => (
            <FormControl key={index} isRequired>
              <FormLabel>Time {index + 1}</FormLabel>
              <Input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(index, e.target.value)}
              />
              {index === 1 && (
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Optional second time slot
                </Text>
              )}
              {index > 0 && (
                <Button
                  size="sm"
                  colorScheme="red"
                  mt={2}
                  onClick={() => removeTimeSlot(index)}
                >
                  Remove
                </Button>
              )}
            </FormControl>
          ))}

          {formData.frequency.times.length < formData.frequency.timesPerDay && (
            <Button onClick={addTimeSlot}>Add Time Slot</Button>
          )}

          <FormControl isRequired>
            <FormLabel>Start Date</FormLabel>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>End Date</FormLabel>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Category</FormLabel>
            <Select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Me">Me</option>
              <option value="Mom">Mom</option>
              <option value="Dad">Dad</option>
              <option value="Other">Other</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Notes</FormLabel>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes about the medication"
            />
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            width="full"
            isLoading={loading}
            mt={4}
          >
            Add Medication
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default AddMedication; 