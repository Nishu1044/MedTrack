import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Grid,
  GridItem,
  Text,
  Select,
  useToast,
} from '@chakra-ui/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../utils/axios';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isAfter, isToday } from 'date-fns';

const getDayColor = (day, today) => {
  if (isAfter(new Date(day.date), today)) return 'grey'; // Future
  if (day.missed > 0) return 'red'; // At least one missed
  if (day.taken > 0 && day.missed === 0) return 'green'; // At least one taken, none missed
  return 'grey'; // No doses or not taken
};

const CalendarHeatmapComponent = ({ data }) => {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Map data by date for quick lookup
  const dataMap = {};
  data.forEach(day => { dataMap[day.date] = day; });

  console.log('calendarData', data);

  return (
    <Box mb={8}>
      <Heading size="sm" mb={2}>Adherence Calendar</Heading>
      <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1}>
        {/* Weekday headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <Text key={d} fontSize="xs" textAlign="center" color="gray.500">{d}</Text>
        ))}
        {/* Calendar days */}
        {(() => {
          const firstDay = daysInMonth[0].getDay();
          const blanks = Array.from({ length: firstDay });
          return [
            ...blanks.map((_, i) => <Box key={"blank-"+i} />),
            ...daysInMonth.map((dateObj) => {
              const dateStr = format(dateObj, 'yyyy-MM-dd');
              const dayData = dataMap[dateStr] || { date: dateStr, missed: 0, taken: 0, total: 0 };
              const color = getDayColor(dayData, today);
              let bg;
              if (color === 'green') bg = '#4caf50';
              else if (color === 'red') bg = '#e53935';
              else bg = '#eee';
              return (
                <Box
                  key={dateStr}
                  w={6} h={6}
                  borderRadius="md"
                  bg={bg}
                  border={isToday(dateObj) ? '2px solid #222' : '1px solid #ccc'}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="xs"
                  color="#222"
                  title={`${dateStr}\nTaken: ${dayData.taken}/${dayData.total}${dayData.missed > 0 ? ' (Missed)' : ''}`}
                >
                  {dateObj.getDate()}
                </Box>
              );
            })
          ];
        })()}
      </Box>
      <Box mt={2} display="flex" alignItems="center" gap={2} fontSize="xs">
        <Box w={4} h={4} bg="#4caf50" borderRadius="md" border="1px solid #ccc" /> Green: All taken
        <Box w={4} h={4} bg="#e53935" borderRadius="md" border="1px solid #ccc" ml={2}/> Red: Missed
        <Box w={4} h={4} bg="#eee" borderRadius="md" border="1px solid #ccc" ml={2}/> Grey: No doses/future
      </Box>
    </Box>
  );
};

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
  const [calendarStart, setCalendarStart] = useState('');
  const [calendarEnd, setCalendarEnd] = useState('');
  const toast = useToast();

  useEffect(() => {
    fetchData();
    // Fetch calendar data
    const fetchCalendar = async () => {
      try {
        const res = await api.get('/doses/calendar');
        setCalendarData(res.data);
        if (res.data.length > 0) {
          setCalendarStart(res.data[0].date);
          setCalendarEnd(res.data[res.data.length - 1].date);
        }
      } catch (error) {
        toast({
          title: 'Error fetching calendar data',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    fetchCalendar();

    // Listen for dose updates
    const handleDoseUpdate = () => {
      fetchData();
      fetchCalendar();
    };
    window.addEventListener('doseUpdated', handleDoseUpdate);
    return () => {
      window.removeEventListener('doseUpdated', handleDoseUpdate);
    };
  }, [selectedMedication, toast]);

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

      // Generate weekly data
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weeklyStats = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekAgo);
        date.setDate(date.getDate() + i);
        weeklyStats.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          adherence: Math.round(Math.random() * 100), // Replace with actual data
        });
      }
      setWeeklyData(weeklyStats);
    } catch (error) {
      toast({
        title: 'Error fetching adherence data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box w="100vw" minH="100vh" bg="gray.50" display="flex" flexDirection="column" alignItems="center" overflowX="auto">
      <Box w="full" maxW={{ base: '100vw', md: '900px', xl: '1200px' }} p={{ base: 1, sm: 2, md: 6 }}>
        <Heading mb={4} fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }} textAlign="center">Adherence Dashboard</Heading>
        {/* Calendar Heatmap for current month */}
        <CalendarHeatmapComponent data={calendarData} />
        <Box display="flex" flexDirection={{ base: 'column', md: 'row' }} alignItems="flex-start" justifyContent="center" gap={{ base: 2, md: 6 }} w="full">
          {/* Weekly Adherence Chart */}
          <Box flex="1" minW={0} height={{ base: '180px', md: '220px' }} w="full">
            <Heading size="sm" mb={2}>Weekly Adherence</Heading>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: '12px', padding: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="adherence" name="Adherence %" fill="#4299E1" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      <Select
        value={selectedMedication}
        onChange={(e) => setSelectedMedication(e.target.value)}
          mb={{ base: 4, md: 8 }}
        maxW={{ base: 'full', md: '300px' }}
        size={{ base: 'sm', md: 'md' }}
      >
        <option value="all">All Medications</option>
        {medications.map((med) => (
          <option key={med._id} value={med._id}>
            {med.name}
          </option>
        ))}
      </Select>
      <Grid 
        templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} 
          gap={{ base: 2, md: 6 }} 
          mb={{ base: 4, md: 8 }}
          w="full"
      >
        <GridItem>
          <Box p={{ base: 3, md: 4 }} shadow="md" borderWidth="1px" borderRadius="lg">
            <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.500">
              Adherence Rate
            </Text>
            <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold">
              {stats.adherenceRate}%
            </Text>
          </Box>
        </GridItem>

        <GridItem>
          <Box p={{ base: 3, md: 4 }} shadow="md" borderWidth="1px" borderRadius="lg">
            <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.500">
              Total Doses
            </Text>
            <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold">
              {stats.totalDoses}
            </Text>
          </Box>
        </GridItem>

        <GridItem>
          <Box p={{ base: 3, md: 4 }} shadow="md" borderWidth="1px" borderRadius="lg">
            <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.500">
              Taken Doses
            </Text>
            <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color="green.500">
              {stats.takenDoses}
            </Text>
          </Box>
        </GridItem>

        <GridItem>
          <Box p={{ base: 3, md: 4 }} shadow="md" borderWidth="1px" borderRadius="lg">
            <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.500">
              Missed Doses
            </Text>
            <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color="red.500">
              {stats.missedDoses}
            </Text>
          </Box>
        </GridItem>
      </Grid>
      </Box>
    </Box>
  );
};

export default AdherenceDashboard; 