
export const DAYS = [
    { n: 1, short: 'Mon', long: 'Monday' },
    { n: 2, short: 'Tue', long: 'Tuesday' },
    { n: 3, short: 'Wed', long: 'Wednesday' },
    { n: 4, short: 'Thu', long: 'Thursday' },
    { n: 5, short: 'Fri', long: 'Friday' },
];

export const subjects = [
    { id: 'math',    name: 'Mathematics',        bg: '#E8F3F1', border: '#247A73', fg: '#1B5F59' },
    { id: 'science', name: 'Science',            bg: '#E6EDF5', border: '#17324D', fg: '#17324D' },
    { id: 'english', name: 'English',            bg: '#FBF1DB', border: '#C58A2B', fg: '#6F4B0E' },
    { id: 'filipino',name: 'Filipino',           bg: '#E3F3EA', border: '#2E8B65', fg: '#1F6B4B' },
    { id: 'ap',      name: 'Araling Panlipunan', bg: '#F3E8EE', border: '#9A5B7A', fg: '#6E3A55' },
    { id: 'mapeh',   name: 'MAPEH',              bg: '#EAEAF6', border: '#5B63A6', fg: '#3B4278' },
];

export const sections = ['Grade 4 – Mabini', 'Grade 4 – Rizal'];

export const initialSchedule = [
    { id: 1, subject: 'math',     section: 'Grade 4 – Mabini', room: 'Room 12', days: [1, 2, 3, 4, 5], start: '07:30', end: '08:20' },
    { id: 2, subject: 'science',  section: 'Grade 4 – Rizal',  room: 'Room 12', days: [1, 2, 3, 4, 5], start: '08:20', end: '09:10' },
    { id: 3, subject: 'english',  section: 'Grade 4 – Mabini', room: 'Room 12', days: [1, 3, 5],       start: '09:30', end: '10:20' },
    { id: 4, subject: 'filipino', section: 'Grade 4 – Mabini', room: 'Room 12', days: [2, 4],          start: '09:30', end: '10:20' },
    { id: 5, subject: 'ap',       section: 'Grade 4 – Rizal',  room: 'Room 12', days: [1, 3, 5],       start: '10:20', end: '11:10' },
    { id: 6, subject: 'mapeh',    section: 'Grade 4 – Rizal',  room: 'Gym',     days: [2, 4],          start: '10:20', end: '11:10' },
    { id: 7, subject: 'math',     section: 'Grade 4 – Rizal',  room: 'Room 12', days: [1, 2, 3, 4, 5], start: '13:00', end: '13:50' },
    { id: 8, subject: 'filipino', section: 'Grade 4 – Rizal',  room: 'Room 12', days: [1, 3, 5],       start: '14:00', end: '14:50' },
    { id: 9, subject: 'science',  section: 'Grade 4 – Mabini', room: 'Room 12', days: [2, 4],          start: '14:00', end: '14:50' },
];