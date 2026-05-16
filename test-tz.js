const { format } = require('date-fns');

function toUTC(localDateStr, timeZone) {
    const cleanDateStr = localDateStr.replace('Z', '');
    const date = new Date(cleanDateStr);
    
    if (timeZone === 'UTC') return date;

    try {
      const invDate = new Date(date.toLocaleString('en-US', { timeZone }));
      const diff = date.getTime() - invDate.getTime();
      return new Date(date.getTime() + diff);
    } catch (e) {
      console.error('[AppointmentService.toUTC] Error converting timezone:', e);
      return date;
    }
}

const tz = 'America/Argentina/Buenos_Aires';
const localDateStr = '2026-05-15T14:00:00';

const utc = toUTC(localDateStr, tz);
console.log('UTC date:', utc.toISOString());
