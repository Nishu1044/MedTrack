import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  Heading,
  Badge,
  Select,
  HStack,
  VStack,
  Flex,
  Text,
  SimpleGrid,
  IconButton,
  Icon,
  Center,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  FaPills,
  FaPlus,
  FaCalendarAlt,
  FaClock,
  FaUserAlt,
  FaPrescriptionBottleAlt,
} from 'react-icons/fa';
import api from '../utils/axios';

const statusColors = {
  active: { gradient: 'linear(135deg, #10b981, #6ee7b7)', label: 'ACTIVE' },
  upcoming: { gradient: 'linear(135deg, brand.500, accent.cyan)', label: 'UPCOMING' },
  completed: { gradient: 'linear(135deg, #64748b, #94a3b8)', label: 'COMPLETED' },
};

const formatDate = (val) => {
  if (!val) return '';
  return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getStatus = (medication) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDay = new Date(medication.startDate);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(medication.endDate);
  endDay.setHours(0, 0, 0, 0);
  if (today < startDay) return 'upcoming';
  if (today > endDay) return 'completed';
  return 'active';
};

const MedCard = ({ medication, onEdit, onDelete }) => {
  const status = getStatus(medication);
  const colors = statusColors[status];

  return (
    <Box className="glass-card" p={{ base: 4, md: 5 }} position="relative" overflow="hidden">
      <Flex justify="space-between" align="flex-start" mb={3} gap={3}>
        <HStack spacing={3} flex="1" minW={0}>
          <Flex
            w="44px"
            h="44px"
            borderRadius="xl"
            bgGradient="linear(135deg, brand.500, accent.cyan)"
            align="center"
            justify="center"
            flexShrink={0}
            boxShadow="0 4px 14px rgba(139, 92, 246, 0.3)"
          >
            <Icon as={FaPills} boxSize={5} color="white" />
          </Flex>
          <Box flex="1" minW={0}>
            <Heading size="sm" noOfLines={1} fontFamily="'Orbitron', sans-serif">
              {medication.name}
            </Heading>
            <Text fontSize="sm" color="gray.500" noOfLines={1}>
              {medication.dose}
            </Text>
          </Box>
        </HStack>
        <Badge
          bgGradient={colors.gradient}
          color="white"
          fontSize="2xs"
          px={2}
          py={1}
          borderRadius="md"
          flexShrink={0}
        >
          {colors.label}
        </Badge>
      </Flex>

      <VStack spacing={2} align="stretch" mb={4}>
        <HStack fontSize="xs" color="gray.500">
          <Icon as={FaUserAlt} boxSize={3} color="brand.400" />
          <Text>{medication.category}</Text>
        </HStack>
        <HStack fontSize="xs" color="gray.500">
          <Icon as={FaClock} boxSize={3} color="accent.cyan" />
          <Text>
            {medication.frequency?.timesPerDay}× per day
            {medication.frequency?.times?.length > 0 && ` • ${medication.frequency.times.join(', ')}`}
          </Text>
        </HStack>
        <HStack fontSize="xs" color="gray.500">
          <Icon as={FaCalendarAlt} boxSize={3} color="#10b981" />
          <Text>
            {formatDate(medication.startDate)} – {formatDate(medication.endDate)}
          </Text>
        </HStack>
      </VStack>

      <HStack spacing={2} justify="flex-end">
        <IconButton
          aria-label="Edit"
          icon={<EditIcon />}
          size="sm"
          variant="outline"
          onClick={() => onEdit(medication)}
        />
        <IconButton
          aria-label="Delete"
          icon={<DeleteIcon />}
          size="sm"
          colorScheme="red"
          variant="outline"
          onClick={() => onDelete(medication._id)}
        />
      </HStack>
    </Box>
  );
};

const MedicationList = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
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
    } catch {
      toast({ title: 'Failed to fetch medications', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medication?')) return;
    try {
      await api.delete(`/medications/${id}`);
      toast({ title: 'Medication deleted', status: 'success', duration: 2500, isClosable: true });
      fetchMedications();
    } catch {
      toast({ title: 'Failed to delete', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleEdit = (medication) => {
    navigate(`/medications/edit/${medication._id}`, { state: { medication } });
  };

  const filtered = medications.filter((m) => category === 'all' || m.category === category);

  return (
    <Box w="full" maxW="1200px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 8 }}>
      {/* Hero */}
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
        <Flex
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
          direction={{ base: 'column', md: 'row' }}
          gap={4}
          position="relative"
          zIndex={1}
        >
          <HStack spacing={4}>
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
                My Medications
              </Heading>
              <Text fontSize="sm" color="gray.500" mt={1}>
                {medications.length} total · {filtered.length} shown
              </Text>
            </Box>
          </HStack>

          <Button
            as={Link}
            to="/medications/add"
            colorScheme="blue"
            size="md"
            leftIcon={<FaPlus />}
          >
            Add Medication
          </Button>
        </Flex>
      </Box>

      {/* Filter */}
      <HStack mb={5} maxW={{ base: 'full', md: '260px' }}>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} size="md">
          <option value="all">All Categories</option>
          <option value="Me">Me</option>
          <option value="Mom">Mom</option>
          <option value="Dad">Dad</option>
          <option value="Other">Other</option>
        </Select>
      </HStack>

      {loading ? (
        <Center py={20}>
          <Spinner size="xl" color="brand.500" thickness="3px" />
        </Center>
      ) : filtered.length === 0 ? (
        <Box className="glass-card" p={10} textAlign="center">
          <Icon as={FaPills} boxSize={16} color="brand.300" mb={4} opacity={0.6} />
          <Heading size="md" mb={2} color="gray.600">
            No medications yet
          </Heading>
          <Text color="gray.500" mb={6}>
            Add your first medication to start tracking.
          </Text>
          <Button as={Link} to="/medications/add" colorScheme="blue" leftIcon={<FaPlus />}>
            Add Medication
          </Button>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 4, md: 5 }}>
          {filtered.map((m) => (
            <MedCard key={m._id} medication={m} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default MedicationList;
