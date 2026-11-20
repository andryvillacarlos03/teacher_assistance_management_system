// Static sample data for the Settings & Backup page. Names are made up.

import { gradingPeriods } from './gradesSample';
import { subjects as scheduleSubjects } from './scheduleSample';

const ago = (days, hours = 0) => new Date(Date.now() - days * 86400000 - hours * 3600000).toISOString();
const pad = (n) => String(n).padStart(2, '0');
export const backupFileName = (iso, tag = 'backup') => {
    const d = new Date(iso);
    return `ptas-${tag}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.ptas`;
};

export const initialProfile = { name: 'Ana Marie Lopez', email: 'teacher@example.com' };

export const initialPreferences = {
    schoolName: 'Sample Elementary School',
    teacherTitle: 'Teacher I',
    timeFormat: '12h',          // '12h' | '24h'
    timetableStart: '7',        // hour the weekly timetable begins
    timetableEnd: '16',         // hour the weekly timetable ends
    landing: 'dashboard',       // page opened after login
    autoLock: '15',             // minutes of inactivity before the app locks; 'never' to turn off
};

export const initialYears = [
    { id: 'sy2026', name: '2026–2027', start: '2026-08-24', end: '2027-05-28', active: true },
    { id: 'sy2025', name: '2025–2026', start: '2025-08-25', end: '2026-05-29', active: false },
];

export const initialPeriods = {
    sy2026: gradingPeriods.map((p) => ({ id: p.id, name: p.name, start: p.start, end: p.end })),
    sy2025: [
        { id: 'p1', name: '1st Quarter', start: '2025-08-25', end: '2025-10-24' },
        { id: 'p2', name: '2nd Quarter', start: '2025-10-27', end: '2025-12-19' },
        { id: 'p3', name: '3rd Quarter', start: '2026-01-05', end: '2026-03-13' },
        { id: 'p4', name: '4th Quarter', start: '2026-03-16', end: '2026-05-29' },
    ],
};

export const initialLevels = [
    { id: 'g3', name: 'Grade 3' },
    { id: 'g4', name: 'Grade 4' },
];

export const initialSections = [
    { id: 's1', name: 'Mabini',     level: 'g4', year: 'sy2026' },
    { id: 's2', name: 'Rizal',      level: 'g4', year: 'sy2026' },
    { id: 's3', name: 'Bonifacio',  level: 'g3', year: 'sy2025' },
    { id: 's4', name: 'Luna',       level: 'g3', year: 'sy2025' },
];

const codes = { math: 'MATH4', science: 'SCI4', english: 'ENG4', filipino: 'FIL4', ap: 'AP4', mapeh: 'MAPEH4' };
export const initialSubjects = scheduleSubjects.map((s) => ({ id: s.id, name: s.name, code: codes[s.id] ?? '', level: 'g4' }));

export const initialBackups = [
    { id: 1, kind: 'auto',   at: ago(1, 2), size: 4_000_000,  includesFiles: false, encrypted: true,  verifiedAt: null },
    { id: 2, kind: 'manual', at: ago(6),    size: 54_700_000, includesFiles: true,  encrypted: true,  verifiedAt: ago(6) },
    { id: 3, kind: 'auto',   at: ago(8),    size: 3_900_000,  includesFiles: false, encrypted: true,  verifiedAt: null },
];

export const storageUsage = { database: 4_300_000, files: 50_600_000 };