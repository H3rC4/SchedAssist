const { fromZonedTime, toZonedTime } = require('date-fns-tz');

const tz = 'America/Argentina/Buenos_Aires';
const localDateStr = '2026-05-15T14:00:00';

const utc = fromZonedTime(localDateStr, tz);
console.log('fromZonedTime date:', utc.toISOString());

const backLocal = toZonedTime(utc, tz);
console.log('toZonedTime date:', backLocal.toISOString());
