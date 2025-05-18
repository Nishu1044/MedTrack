import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Select,
  useToast,
  Textarea,
  HStack,
  Text,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import api from '../utils/axios';

const EditMedication = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [medication, setMedication] = useState(location.state?.medication || {
    name: '',
    dose: '',
    frequency: {
      timesPerDay: 1,
      times: ['08:00']
    },
    startDate: '',
    endDate: '',
    category: 'Me',
    notes: ''
  });

  const handleTimeChange = (index, value) => {
    const newTimes = [...medication.frequency.times];
    newTimes[index] = value;
    setMedication({
      ...medication,
      frequency: {
        ...medication.frequency,
        times: newTimes
      }
    });
  };

  const addTimeSlot = () => {
    if (medication.frequency.times.length < 4) {
      setMedication({
        ...medication,
        frequency: {
          ...medication.frequency,
          times: [...medication.frequency.times, '08:00']
        }
      });
    }
  };

  const removeTimeSlot = (index) => {
    if (medication.frequency.times.length > 1) {
      const newTimes = medication.frequency.times.filter((_, i) => i !== index);
      setMedication({
        ...medication,
        frequency: {
          ...medication.frequency,
          times: newTimes
        }
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put(`/medications/${id}`, medication);
      toast({
        title: 'Success',
        description: 'Medication updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/medications');
      // Trigger dose refresh
      window.dispatchEvent(new Event('medicationUpdated'));
    } catch (error) {
      console.error('Error updating medication:', error);
      toast({
        title: 'Error',
        description: 'Failed to update medication',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch" maxW="600px" mx="auto">
        <Heading size="lg">Edit Medication</Heading>

        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                value={medication.name}
                onChange={(e) => setMedication({ ...medication, name: e.target.value })}
                placeholder="Medication name"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Dose</FormLabel>
              <Input
                value={medication.dose}
                onChange={(e) => setMedication({ ...medication, dose: e.target.value })}
                placeholder="e.g., 1 tablet, 5ml"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Category</FormLabel>
              <Select
                value={medication.category}
                onChange={(e) => setMedication({ ...medication, category: e.target.value })}
              >
                <option value="Me">Me</option>
                <option value="Mom">Mom</option>
                <option value="Dad">Dad</option>
                <option value="Other">Other</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Times Per Day</FormLabel>
              <NumberInput
                min={1}
                max={4}
                value={medication.frequency.timesPerDay}
                onChange={(value) => {
                  const timesPerDay = parseInt(value);
                  const currentTimes = medication.frequency.times;
                  let newTimes = [...currentTimes];
                  
                  // Adjust times array based on new timesPerDay value
                  if (timesPerDay > currentTimes.length) {
                    // Add new time slots
                    while (newTimes.length < timesPerDay) {
                      newTimes.push('08:00');
                    }
                  } else if (timesPerDay < currentTimes.length) {
                    // Remove excess time slots
                    newTimes = newTimes.slice(0, timesPerDay);
                  }

                  setMedication({
                    ...medication,
                    frequency: {
                      ...medication.frequency,
                      timesPerDay,
                      times: newTimes
                    }
                  });
                }}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Start Date</FormLabel>
              <Input
                type="date"
                value={medication.startDate.split('T')[0]}
                onChange={(e) => setMedication({ ...medication, startDate: e.target.value })}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>End Date</FormLabel>
              <Input
                type="date"
                value={medication.endDate.split('T')[0]}
                onChange={(e) => setMedication({ ...medication, endDate: e.target.value })}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Dosing Times</FormLabel>
              <VStack spacing={2} align="stretch">
                {medication.frequency.times.map((time, index) => (
                  <HStack key={index}>
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => handleTimeChange(index, e.target.value)}
                    />
                    {medication.frequency.times.length > 1 && (
                      <IconButton
                        icon={<DeleteIcon />}
                        onClick={() => removeTimeSlot(index)}
                        colorScheme="red"
                        aria-label="Remove time slot"
                      />
                    )}
                  </HStack>
                ))}
                {medication.frequency.times.length < 4 && (
                  <Button
                    leftIcon={<AddIcon />}
                    onClick={addTimeSlot}
                    size="sm"
                    variant="outline"
                  >
                    Add Time
                  </Button>
                )}
              </VStack>
            </FormControl>

            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                value={medication.notes}
                onChange={(e) => setMedication({ ...medication, notes: e.target.value })}
                placeholder="Additional notes (optional)"
              />
            </FormControl>

            <HStack spacing={4} width="100%">
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={loading}
                width="100%"
              >
                Update Medication
              </Button>
              <Button
                onClick={() => navigate('/medications')}
                variant="outline"
                width="100%"
              >
                Cancel
              </Button>
            </HStack>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};

export default EditMedication; 