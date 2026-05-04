import { parseISO, format } from 'date-fns';

const date = '2026-05-20';
const startTime = '17:00:00';
const endTime = '18:00:00';

const bStart = parseISO(`${date}T${startTime}`);
const bEnd = parseISO(`${date}T${endTime}`);

console.log('bStart:', bStart.toISOString());
console.log('bEnd:', bEnd.toISOString());

const slotStart = parseISO(`${date}T17:00`);
const slotEnd = parseISO(`${date}T17:30`);

console.log('slotStart:', slotStart.toISOString());
console.log('slotEnd:', slotEnd.toISOString());

const isBlocked = slotStart < bEnd && slotEnd > bStart;
console.log('isBlocked:', isBlocked);
