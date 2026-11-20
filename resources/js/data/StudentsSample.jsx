import { sections as currentSections } from './scheduleSample';

export const academicYears = [
    { id: 'sy2026', name: '2026–2027', active: true },
    { id: 'sy2025', name: '2025–2026', active: false },
];

export const sectionsByYear = {
    sy2026: currentSections,
    sy2025: ['Grade 3 – Bonifacio', 'Grade 3 – Luna'],
};

export const initialStudents = [
    { id: 1,  studentNumber: '2021-0101', firstName: 'Juan Miguel',   middleName: 'Santos',     lastName: 'Dela Cruz',  suffix: '' },
    { id: 2,  studentNumber: '2021-0102', firstName: 'Maria Clara',   middleName: 'Reyes',      lastName: 'Bautista',   suffix: '' },
    { id: 3,  studentNumber: '2021-0103', firstName: 'Jose',          middleName: 'Garcia',     lastName: 'Mendoza',    suffix: 'Jr.' },
    { id: 4,  studentNumber: '2021-0104', firstName: 'Angelica',      middleName: 'Torres',     lastName: 'Villanueva', suffix: '' },
    { id: 5,  studentNumber: '2021-0105', firstName: 'Mark Anthony',  middleName: 'Lopez',      lastName: 'Ramos',      suffix: '' },
    { id: 6,  studentNumber: '2021-0106', firstName: 'Sofia Isabel',  middleName: 'Navarro',    lastName: 'Aquino',     suffix: '' },
    { id: 7,  studentNumber: '2021-0107', firstName: 'Carlo',         middleName: 'Dizon',      lastName: 'Pascual',    suffix: '' },
    { id: 8,  studentNumber: '2021-0108', firstName: 'Bea',           middleName: 'Castillo',   lastName: 'Fernandez',  suffix: '' },
    { id: 9,  studentNumber: '2021-0109', firstName: 'Rafael',        middleName: 'Domingo',    lastName: 'Soriano',    suffix: '' },
    { id: 10, studentNumber: '2021-0110', firstName: 'Katrina',       middleName: 'Evangelista',lastName: 'Salazar',    suffix: '' },
    { id: 11, studentNumber: '2021-0111', firstName: 'Nathaniel',     middleName: 'Cruz',       lastName: 'Lim',        suffix: '' },
    { id: 12, studentNumber: '2021-0112', firstName: 'Princess Joy',  middleName: 'Manalo',     lastName: 'Tolentino',  suffix: '' },
    { id: 13, studentNumber: '2021-0113', firstName: 'Gabriel',       middleName: 'Ocampo',     lastName: 'Padilla',    suffix: '' },
    { id: 14, studentNumber: '2021-0114', firstName: 'Lea Marie',     middleName: 'Alonzo',     lastName: 'Cortez',     suffix: '' },
    { id: 15, studentNumber: '2021-0115', firstName: 'Paolo',         middleName: 'Rivera',     lastName: 'Gutierrez',  suffix: '' },
    { id: 16, studentNumber: '2026-0201', firstName: 'Hannah',        middleName: 'Valdez',     lastName: 'Serrano',    suffix: '' }, // transferee: no 2025–2026 record
];

const e = (id, studentId, ay, section, status = 'active') => ({ id, studentId, ay, section, status });

export const initialEnrollments = [
    // 2026–2027
    e(1, 1, 'sy2026', 'Grade 4 – Mabini'), e(2, 2, 'sy2026', 'Grade 4 – Mabini'),
    e(3, 3, 'sy2026', 'Grade 4 – Mabini'), e(4, 4, 'sy2026', 'Grade 4 – Mabini'),
    e(5, 5, 'sy2026', 'Grade 4 – Mabini'), e(6, 6, 'sy2026', 'Grade 4 – Mabini'),
    e(7, 7, 'sy2026', 'Grade 4 – Mabini', 'inactive'), e(8, 8, 'sy2026', 'Grade 4 – Mabini'),
    e(9, 9, 'sy2026', 'Grade 4 – Rizal'), e(10, 10, 'sy2026', 'Grade 4 – Rizal'),
    e(11, 11, 'sy2026', 'Grade 4 – Rizal'), e(12, 12, 'sy2026', 'Grade 4 – Rizal', 'transferred'),
    e(13, 13, 'sy2026', 'Grade 4 – Rizal'), e(14, 14, 'sy2026', 'Grade 4 – Rizal'),
    e(15, 15, 'sy2026', 'Grade 4 – Rizal'), e(16, 16, 'sy2026', 'Grade 4 – Rizal'),
    // 2025–2026
    e(21, 1, 'sy2025', 'Grade 3 – Bonifacio'), e(22, 2, 'sy2025', 'Grade 3 – Bonifacio'),
    e(23, 3, 'sy2025', 'Grade 3 – Bonifacio'), e(24, 4, 'sy2025', 'Grade 3 – Bonifacio'),
    e(25, 5, 'sy2025', 'Grade 3 – Bonifacio'), e(26, 6, 'sy2025', 'Grade 3 – Bonifacio'),
    e(27, 7, 'sy2025', 'Grade 3 – Bonifacio'), e(28, 8, 'sy2025', 'Grade 3 – Bonifacio'),
    e(29, 9, 'sy2025', 'Grade 3 – Luna'), e(30, 10, 'sy2025', 'Grade 3 – Luna'),
    e(31, 11, 'sy2025', 'Grade 3 – Luna'), e(32, 12, 'sy2025', 'Grade 3 – Luna'),
    e(33, 13, 'sy2025', 'Grade 3 – Luna'), e(34, 14, 'sy2025', 'Grade 3 – Luna'),
    e(35, 15, 'sy2025', 'Grade 3 – Luna'),
];

const att = {
    1: [92, 2, 1], 2: [90, 3, 2], 3: [88, 1, 6], 4: [93, 1, 1], 5: [85, 4, 6], 6: [94, 0, 1],
    7: [60, 5, 12], 8: [91, 2, 2], 9: [89, 3, 3], 10: [92, 1, 2], 11: [87, 2, 6], 12: [40, 2, 5],
    13: [90, 3, 2], 14: [93, 0, 2], 15: [86, 4, 5], 16: [91, 1, 3],
};
export const attendanceSummary = Object.fromEntries(
    Object.entries(att).map(([id, [present, late, absent]]) => [id, { present, late, absent }]),
);