
import { initialEnrollments, initialStudents, sectionsByYear } from './studentsSample';

export const ATTENDANCE_YEAR = 'sy2026';
export const attendanceSections = sectionsByYear[ATTENDANCE_YEAR];

export const sessionKey = (section, date) => `${section}|${date}`;

/** Active, non-archived students enrolled in a section this school year. */
export function rosterFor(section) {
    return initialEnrollments
        .filter((e) => e.ay === ATTENDANCE_YEAR && e.section === section && e.status === 'active')
        .map((e) => initialStudents.find((s) => s.id === e.studentId))
        .filter((s) => s && !s.archived)
        .sort((a, b) => `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`));
}

// Small seeded random generator so the sample data is the same every time
function mulberry32(seed) {
    let a = seed;
    return () => {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const toISO = (d) => d.toLocaleDateString('en-CA');

export function buildInitialSessions() {
    const sessions = {};
    const absentRemarks = ['Sick', 'Family emergency', '', 'Sick', ''];
    const excusedRemarks = ['Medical appointment', 'School activity', 'Family event'];

    for (let back = 75; back >= 1; back--) {
        const d = new Date();
        d.setDate(d.getDate() - back);
        const dow = d.getDay();
        if (dow === 0 || dow === 6) continue; // weekends
        const date = toISO(d);
        const dayNumber = Math.floor(d.getTime() / 86400000);
        if (dayNumber % 23 === 0) continue; // an occasional no-class day

        attendanceSections.forEach((section) => {
            const records = {};
            rosterFor(section).forEach((s) => {
                const rnd = mulberry32(s.id * 1000 + dayNumber);
                const roll = rnd();
                const pick = rnd();
                const frequentAbsent = [3, 5, 15].includes(s.id) ? 0.07 : 0;
                const absent = 0.03 + frequentAbsent;
                const excused = 0.02;
                const late = 0.04 + (s.id === 5 ? 0.04 : 0);

                let status = 'present';
                let remarks = '';
                if (roll < absent) { status = 'absent'; remarks = absentRemarks[Math.floor(pick * absentRemarks.length)]; }
                else if (roll < absent + excused) { status = 'excused'; remarks = excusedRemarks[Math.floor(pick * excusedRemarks.length)]; }
                else if (roll < absent + excused + late) { status = 'late'; remarks = pick < 0.5 ? 'Traffic' : ''; }
                records[s.id] = { status, remarks };
            });
            sessions[sessionKey(section, date)] = {
                notes: dayNumber % 17 === 0 ? 'Fire drill at 10:00 AM.' : '',
                records,
            };
        });
    }
    return sessions;
}