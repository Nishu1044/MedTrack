const { fromZonedTime, toZonedTime, format } = require('date-fns-tz');

// Build a UTC Date from a YYYY-MM-DD date string, a HH:MM time string, and an IANA zone.
// Example: ("2026-05-11", "09:00", "Asia/Kolkata") → Date representing 03:30 UTC.
function buildScheduledTime(dateInput, timeStr, zone) {
  const date = new Date(dateInput);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const [hours, minutes] = timeStr.split(':');
  const hh = String(parseInt(hours, 10)).padStart(2, '0');
  const min = String(parseInt(minutes, 10)).padStart(2, '0');
  // ISO-style local string in the user's zone
  const localStr = `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
  return fromZonedTime(localStr, zone || 'UTC');
}

// Returns YYYY-MM-DD for "today" in the given zone.
function todayInZone(zone) {
  const now = new Date();
  return format(toZonedTime(now, zone || 'UTC'), 'yyyy-MM-dd', { timeZone: zone || 'UTC' });
}

// Step a UTC date forward by N days, anchored to a zone's local calendar day.
function addDaysInZone(dateInput, days, zone) {
  const z = toZonedTime(dateInput, zone || 'UTC');
  z.setDate(z.getDate() + days);
  // Reconstruct local string and convert back
  const yyyy = z.getFullYear();
  const mm = String(z.getMonth() + 1).padStart(2, '0');
  const dd = String(z.getDate()).padStart(2, '0');
  const hh = String(z.getHours()).padStart(2, '0');
  const min = String(z.getMinutes()).padStart(2, '0');
  return fromZonedTime(`${yyyy}-${mm}-${dd}T${hh}:${min}:00`, zone || 'UTC');
}

// UTC [start, end) of "today" in the user's zone.
function dayRangeInZone(zone, offsetDays = 0) {
  const tz = zone || 'UTC';
  const now = new Date();
  const local = toZonedTime(now, tz);
  local.setDate(local.getDate() + offsetDays);
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, '0');
  const d = String(local.getDate()).padStart(2, '0');
  const start = fromZonedTime(`${y}-${m}-${d}T00:00:00`, tz);
  const end = fromZonedTime(`${y}-${m}-${d}T23:59:59.999`, tz);
  return { start, end };
}

// UTC start of N days ago in the zone, and end of today in the zone.
function lastNDaysRangeInZone(zone, n) {
  const tz = zone || 'UTC';
  const startOfToday = dayRangeInZone(tz, 0).start;
  const start = dayRangeInZone(tz, -(n - 1)).start;
  const end = dayRangeInZone(tz, 0).end;
  return { start, end, startOfToday };
}

// Local YYYY-MM-DD label for a UTC date, in the given zone.
function localDateLabel(date, zone) {
  return format(toZonedTime(date, zone || 'UTC'), 'yyyy-MM-dd', { timeZone: zone || 'UTC' });
}

module.exports = {
  buildScheduledTime,
  todayInZone,
  addDaysInZone,
  dayRangeInZone,
  lastNDaysRangeInZone,
  localDateLabel,
};
