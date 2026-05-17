import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Grid,
  GridItem,
  Text,
  Select,
  Flex,
  HStack,
  VStack,
  Icon,
  SimpleGrid,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../utils/axios';
import {
  FaChartLine,
  FaCheckCircle,
  FaTimesCircle,
  FaPills,
  FaCalendarCheck,
} from 'react-icons/fa';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isAfter, isToday } from 'date-fns';

const getDayColor = (day, today) => {
  if (isAfter(new Date(day.date), today)) return 'future';
  if (day.missed > 0) return 'missed';
  if (day.taken > 0 && day.missed === 0) return 'taken';
  return 'empty';
};

const CalendarHeatmapComponent = ({ data }) => {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const dataMap = {};
  data.forEach((day) => { dataMap[day.date] = day; });

  const colors = {
    taken: 'linear-gradient(135deg, #10b981, #6ee7b7)',
    missed: 'linear-gradient(135deg, #ef4444, #f472b6)',
    empty: 'rgba(167, 139, 250, 0.15)',
    future: 'rgba(148, 163, 184, 0.12)',
  };

  return (
    <Box>
      <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1.5} maxW="320px">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text key={i} fontSize="xs" textAlign="center" color="gray.500" fontWeight="600">
            {d}
          </Text>
        ))}
        {(() => {
          const firstDay = daysInMonth[0].getDay();
          const blanks = Array.from({ length: firstDay });
          return [
            ...blanks.map((_, i) => <Box key={`blank-${i}`} />),
            ...daysInMonth.map((dateObj) => {
              const dateStr = format(dateObj, 'yyyy-MM-dd');
              const dayData = dataMap[dateStr] || { date: dateStr, missed: 0, taken: 0, total: 0 };
              const type = getDayColor(dayData, today);
              return (
                <Box
                  key={dateStr}
                  aspectRatio="1"
                  borderRadius="md"
                  bg={type === 'taken' || type === 'missed' ? 'transparent' : colors[type]}
                  bgGradient={type === 'taken' || type === 'missed' ? colors[type] : undefined}
                  border={isToday(dateObj) ? '2px solid' : '1px solid rgba(167, 139, 250, 0.2)'}
                  borderColor={isToday(dateObj) ? 'brand.500' : undefined}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="xs"
                  fontWeight="700"
                  color={type === 'taken' || type === 'missed' ? 'white' : 'gray.500'}
                  title={`${dateStr}\nTaken: ${dayData.taken}/${dayData.total}${dayData.missed > 0 ? ' (Missed)' : ''}`}
                  cursor="default"
                  transition="transform 0.15s"
                  _hover={{ transform: 'scale(1.1)' }}
                >
                  {dateObj.getDate()}
                </Box>
              );
            }),
          ];
        })()}
      </Box>

      <HStack mt={4} spacing={4} fontSize="xs" color="gray.500" flexWrap="wrap">
        <HStack>
          <Box w={3} h={3} borderRadius="sm" bgGradient="linear(135deg, #10b981, #6ee7b7)" />
          <Text>Taken</Text>
        </HStack>
        <HStack>
          <Box w={3} h={3} borderRadius="sm" bgGradient="linear(135deg, #ef4444, #f472b6)" />
          <Text>Missed</Text>
        </HStack>
        <HStack>
          <Box w={3} h={3} borderRadius="sm" bg="rgba(167, 139, 250, 0.15)" border="1px solid rgba(167, 139, 250, 0.2)" />
          <Text>No doses</Text>
        </HStack>
      </HStack>
    </Box>
  );
};

const StatCard = ({ icon, label, value, gradient }) => (
  <Box className="glass-card" p={{ base: 4, md: 5 }}>
    <Flex justify="space-between" align="center" gap={3}>
      <Box flex="1" minW={0}>
        <Text
          fontSize="xs"
          fontFamily="'Rajdhani', sans-serif"
          fontWeight="600"
          letterSpacing="0.1em"
          textTransform="uppercase"
          color="gray.500"
        >
          {label}
        </Text>
        <Heading
          fontSize={{ base: '2xl', md: '3xl' }}
          mt={1}
          bgGradient={gradient}
          bgClip="text"
        >
          {value}
        </Heading>
      </Box>
      <Flex
        w="44px"
        h="44px"
        borderRadius="xl"
        bgGradient={gradient}
        align="center"
        justify="center"
        flexShrink={0}
      >
        <Icon as={icon} boxSize={5} color="white" />
      </Flex>
    </Flex>
  </Box>
);

const AdherenceDashboard = () => {
  const [stats, setStats] = useState({
    adherenceRate: 0,
    totalDoses: 0,
    takenDoses: 0,
    lateDoses: 0,
    missedDoses: 0,
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [selectedMedication, setSelectedMedication] = useState('all');
  const [medications, setMedications] = useState([]);
  const [calendarData, setCalendarData] = useState([]);
  const toast = useToast();

  const chartAxisColor = useColorModeValue('#64748b', '#cbd5e1');
  const chartGridColor = useColorModeValue('rgba(167, 139, 250, 0.2)', 'rgba(167, 139, 250, 0.15)');
  const tooltipBg = useColorModeValue('rgba(255,255,255,0.95)', 'rgba(15,18,50,0.95)');

  useEffect(() => {
    fetchData();
    const fetchCalendar = async () => {
      try {
        const res = await api.get('/doses/calendar');
        setCalendarData(res.data);
        const last7 = res.data.slice(-7);
        const weekly = last7.map((day) => ({
          date: format(new Date(day.date), 'EEE'),
          adherence: day.total > 0 ? Math.round((day.taken / day.total) * 100) : 0,
        }));
        setWeeklyData(weekly);
      } catch {
        toast({ title: 'Failed to fetch calendar data', status: 'error', duration: 3000, isClosable: true });
      }
    };
    fetchCalendar();

    const handler = () => { fetchData(); fetchCalendar(); };
    window.addEventListener('doseUpdated', handler);
    return () => window.removeEventListener('doseUpdated', handler);
  }, [selectedMedication]);

  const fetchData = async () => {
    try {
      const [statsRes, medicationsRes] = await Promise.all([
        api.get(
          selectedMedication === 'all'
            ? '/doses/stats'
            : `/doses/medication/${selectedMedication}/stats`
        ),
        api.get('/medications'),
      ]);
      setStats(statsRes.data);
      setMedications(medicationsRes.data);
    } catch {
      toast({ title: 'Failed to fetch adherence data', status: 'error', duration: 3000, isClosable: true });
    }
  };

  return (
    <Box w="full" maxW="1200px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 8 }}>
      {/* Hero */}
      <Box className="glass-card" p={{ base: 5, md: 6 }} mb={6} position="relative" overflow="hidden">
        <Icon
          as={FaChartLine}
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
            bgGradient="linear(135deg, #10b981, accent.mint)"
            align="center"
            justify="center"
            boxShadow="0 8px 24px rgba(16, 185, 129, 0.4)"
          >
            <Icon as={FaChartLine} boxSize={{ base: 6, md: 7 }} color="white" />
          </Flex>
          <Box>
            <Heading
              fontSize={{ base: 'xl', md: '2xl' }}
              bgGradient="linear(135deg, #10b981, accent.cyan)"
              bgClip="text"
            >
              Adherence Dashboard
            </Heading>
            <Text fontSize="sm" color="gray.500" mt={1}>
              Track how consistently you're taking your meds.
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Filter */}
      <HStack mb={5} maxW={{ base: 'full', md: '320px' }}>
        <Select value={selectedMedication} onChange={(e) => setSelectedMedication(e.target.value)} size="md">
          <option value="all">All Medications</option>
          {medications.map((med) => (
            <option key={med._id} value={med._id}>
              {med.name}
            </option>
          ))}
        </Select>
      </HStack>

      {/* Stats grid */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 3, md: 4 }} mb={6}>
        <StatCard
          icon={FaChartLine}
          label="Adherence"
          value={`${stats.adherenceRate}%`}
          gradient="linear(135deg, brand.500, accent.cyan)"
        />
        <StatCard
          icon={FaPills}
          label="Total Doses"
          value={stats.totalDoses}
          gradient="linear(135deg, #06b6d4, brand.400)"
        />
        <StatCard
          icon={FaCheckCircle}
          label="Taken"
          value={stats.takenDoses}
          gradient="linear(135deg, #10b981, #6ee7b7)"
        />
        <StatCard
          icon={FaTimesCircle}
          label="Missed"
          value={stats.missedDoses}
          gradient="linear(135deg, #ef4444, #f472b6)"
        />
      </SimpleGrid>

      {/* Charts row */}
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={{ base: 4, md: 6 }}>
        <GridItem>
          <Box className="glass-card" p={{ base: 4, md: 6 }}>
            <HStack mb={4}>
              <Icon as={FaCalendarCheck} color="brand.500" />
              <Heading size="sm" fontFamily="'Rajdhani', sans-serif" letterSpacing="0.05em">
                MONTHLY CALENDAR
              </Heading>
            </HStack>
            <CalendarHeatmapComponent data={calendarData} />
          </Box>
        </GridItem>

        <GridItem>
          <Box className="glass-card" p={{ base: 4, md: 6 }}>
            <HStack mb={4}>
              <Icon as={FaChartLine} color="brand.500" />
              <Heading size="sm" fontFamily="'Rajdhani', sans-serif" letterSpacing="0.05em">
                WEEKLY ADHERENCE
              </Heading>
            </HStack>
            <Box h="240px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartAxisColor }} stroke={chartAxisColor} />
                  <YAxis tick={{ fontSize: 11, fill: chartAxisColor }} stroke={chartAxisColor} />
                  <Tooltip
                    contentStyle={{
                      background: tooltipBg,
                      border: '1px solid rgba(167,139,250,0.3)',
                      borderRadius: 12,
                      fontSize: 12,
                      padding: '8px 12px',
                    }}
                    labelStyle={{ color: chartAxisColor, fontWeight: 600 }}
                  />
                  <Bar dataKey="adherence" name="Adherence %" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default AdherenceDashboard;
