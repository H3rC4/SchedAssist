const { fromZonedTime, toZonedTime, format } = require('date-fns-tz');

const tz = 'America/Argentina/Buenos_Aires';
const localDateStr = '2026-05-15T14:00:00';

const utc = fromZonedTime(localDateStr, tz);
console.log('UTC date:', utc.toISOString());

const zoned = toZonedTime(utc, tz);
console.log('Zoned date (with format):', format(zoned, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: tz }));
