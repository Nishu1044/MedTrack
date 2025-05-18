import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Select,
  HStack,
  useToast,
  IconButton,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import api from '../utils/axios';

const MedicationList = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [editingMedication, setEditingMedication] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/medications');
      setMedications(response.data);
    } catch (error) {
      console.error('Error fetching medications:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch medications',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medication?')) {
      try {
        await api.delete(`/medications/${id}`);
        toast({
          title: 'Medication deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchMedications();
      } catch (error) {
        toast({
          title: 'Error deleting medication',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const getStatus = (medication) => {
    const now = new Date();
    const startDate = new Date(medication.startDate);
    const endDate = new Date(medication.endDate);
    
    // Set the time to the start of the day for date comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    if (today < startDay) return 'upcoming';
    if (today > endDay) return 'completed';
    return 'active';
  };

  const filteredMedications = medications.filter((med) => {
    if (category === 'all') return true;
    return med.category === category;
  });

  const handleEdit = (medication) => {
    navigate(`/medications/edit/${medication._id}`, { state: { medication } });
  };

  const handleUpdate = async (updatedMedication) => {
    try {
      await api.put(`/medications/${updatedMedication._id}`, updatedMedication);
      toast({
        title: 'Success',
        description: 'Medication updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setEditingMedication(null);
      fetchMedications();
      // Force refresh of doses
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
    }
  };

  return (
    <Box w="100vw" minH="100vh" bg="gray.50" display="flex" flexDirection="column" alignItems="center" overflowX="auto">
      <Box w="full" maxW={{ base: '100vw', md: '900px', xl: '1200px' }} p={{ base: 1, sm: 2, md: 6 }}>
        <HStack justify="space-between" mb={{ base: 4, md: 8 }}>
          <Heading fontSize={{ base: '2xl', md: '3xl' }} textAlign="center">Medications</Heading>
          <Button 
            as={Link}
            to="/medications/add"
            colorScheme="blue" 
            size={{ base: 'sm', md: 'md' }}
          >
            Add Medication
          </Button>
        </HStack>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          mb={4}
          maxW={{ base: 'full', md: '200px' }}
          size={{ base: 'sm', md: 'md' }}
        >
          <option value="all">All Categories</option>
          <option value="Me">Me</option>
          <option value="Mom">Mom</option>
          <option value="Dad">Dad</option>
          <option value="Other">Other</option>
        </Select>
        <Box overflowX="auto" w="full">
          <Table variant="simple" size={{ base: 'sm', md: 'md' }} w="full">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Dose</Th>
                <Th display={{ base: 'none', md: 'table-cell' }}>Category</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredMedications.map((medication) => (
                <Tr key={medication._id}>
                  <Td>{medication.name}</Td>
                  <Td>{medication.dose}</Td>
                  <Td display={{ base: 'none', md: 'table-cell' }}>{medication.category}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        getStatus(medication) === 'active'
                          ? 'green'
                          : getStatus(medication) === 'upcoming'
                          ? 'blue'
                          : 'gray'
                      }
                      fontSize={{ base: 'xs', md: 'sm' }}
                    >
                      {getStatus(medication)}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Edit medication"
                        icon={<EditIcon />}
                        size={{ base: 'xs', md: 'sm' }}
                        onClick={() => handleEdit(medication)}
                      />
                      <IconButton
                        aria-label="Delete medication"
                        icon={<DeleteIcon />}
                        size={{ base: 'xs', md: 'sm' }}
                        colorScheme="red"
                        onClick={() => handleDelete(medication._id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
};

export default MedicationList; 