const HOUR_IN_MS = 60 * 60 * 1000;
const MAX_ADVANCE_IN_MS = 30 * 24 * HOUR_IN_MS;
const BOOKING_TIME_ZONE = 'America/Bogota';

export type BookingRuleViolation =
  | 'BOOKING_IN_PAST'
  | 'BOOKING_TOO_FAR_AHEAD'
  | 'BOOKING_DURATION_INVALID'
  | 'BOOKING_NOT_FULL_HOURS'
  | 'BOOKING_OUTSIDE_SERVICE_HOURS';

function getLocalHourAndMinute(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BOOKING_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);
  const dateKey = `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}-${parts.find((part) => part.type === 'day')?.value}`;
  return { hour, minute, dateKey };
}

export function validateBookingTime(
  start: Date,
  end: Date,
  now = new Date(),
): BookingRuleViolation | null {
  if (start <= now) return 'BOOKING_IN_PAST';
  if (start.getTime() - now.getTime() > MAX_ADVANCE_IN_MS) return 'BOOKING_TOO_FAR_AHEAD';

  const duration = end.getTime() - start.getTime();
  if (duration < HOUR_IN_MS || duration > 4 * HOUR_IN_MS) return 'BOOKING_DURATION_INVALID';
  if (duration % HOUR_IN_MS !== 0 || start.getUTCMinutes() !== 0 || start.getUTCSeconds() !== 0 || start.getUTCMilliseconds() !== 0 || end.getUTCMinutes() !== 0 || end.getUTCSeconds() !== 0 || end.getUTCMilliseconds() !== 0) {
    return 'BOOKING_NOT_FULL_HOURS';
  }

  const startLocal = getLocalHourAndMinute(start);
  const endLocal = getLocalHourAndMinute(end);
  if (startLocal.dateKey !== endLocal.dateKey || startLocal.hour < 7 || endLocal.hour > 21 || (endLocal.hour === 21 && endLocal.minute > 0)) {
    return 'BOOKING_OUTSIDE_SERVICE_HOURS';
  }

  return null;
}
