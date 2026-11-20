

import { rosterFor } from './attendanceSample';
import { initialSchedule } from './scheduleSample';

export const gradingPeriods = [
    { id: 'q1', name: '1st Quarter', start: '2026-08-24', end: '2026-10-23' },
    { id: 'q2', name: '2nd Quarter', start: '2026-10-26', end: '2026-12-18' },
    { id: 'q3', name: '3rd Quarter', start: '2027-01-04', end: '2027-03-12' },
    { id: 'q4', name: '4th Quarter', start: '2027-03-15', end: '2027-05-28' },
];

export const ASSESSMENT_TYPES = {
    written_work:         { label: 'Written Work',          short: 'WW', bg: '#E8F3F1', fg: '#1B5F59' },
    performance_task:     { label: 'Performance Tasks',     short: 'PT', bg: '#E6EDF5', fg: '#17324D' },
    quarterly_assessment: { label: 'Quarterly Assessment',  short: 'QA', bg: '#FBF1DB', fg: '#6F4B0E' },
};

export const initialSchemes = [
    { id: 1, name: 'Scheme A (sample)', components: { written_work: 30, performance_task: 50, quarterly_assessment: 20 } },
    { id: 2, name: 'Scheme B (sample)', components: { written_work: 40, performance_task: 40, quarterly_assessment: 20 } },
];

export const initialSubjectSchemes = { math: 2, science: 2, english: 1, filipino: 1, ap: 1, mapeh: 1 };

export const initialPolicy = {
    passing: 75,
    absent: 'excluded', // 'excluded' | 'zero'
    conversion: { mode: 'none', rows: [] },
};

// Subject + section combinations taken from the teaching schedule
export const gradeCombos = Object.values(
    initialSchedule.reduce((acc, e) => {
        const key = `${e.subject}|${e.section}`;
        acc[key] = { key, subject: e.subject, section: e.section };
        return acc;
    }, {}),
).sort((a, b) => a.subject.localeCompare(b.subject) || a.section.localeCompare(b.section));

function mulberry32(seed) {
    let a = seed;
    return () => {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const addDays = (iso, n) => {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d + n);
    return date.toLocaleDateString('en-CA');
};

// title, type, max, days after period start, how scores are filled
const templates = {
    q1: [
        ['Quiz 1', 'written_work', 20, 7, 'all'], ['Quiz 2', 'written_work', 25, 21, 'all'],
        ['Seatwork 1', 'written_work', 10, 35, 'all'],
        ['Performance Task 1', 'performance_task', 30, 28, 'all'], ['Performance Task 2', 'performance_task', 40, 42, 'all'],
        ['Quarterly Exam', 'quarterly_assessment', 50, 55, 'all'],
    ],
    q2: [
        ['Quiz 1', 'written_work', 20, 7, 'all'], ['Quiz 2', 'written_work', 25, 14, 'all'],
        ['Seatwork 1', 'written_work', 10, 19, 'some'],            // still being checked
        ['Performance Task 1', 'performance_task', 30, 18, 'all'],
        ['Performance Task 2', 'performance_task', 40, 30, 'none'], // not yet checked
    ],
};

export function buildInitialGrades() {
    const assessments = [];
    const scores = {};
    let nextId = 1;

    gradeCombos.forEach((combo) => {
        const roster = rosterFor(combo.section);
        gradingPeriods.filter((p) => templates[p.id]).forEach((period) => {
            templates[period.id].forEach(([title, type, max, offset, fill]) => {
                const a = {
                    id: nextId++, subject: combo.subject, section: combo.section, period: period.id,
                    title, type, max, date: addDays(period.start, offset),
                };
                assessments.push(a);
                if (fill === 'none') return;
                roster.forEach((s) => {
                    const rnd = mulberry32(s.id * 7919 + a.id * 104729);
                    const ability = 0.6 + 0.35 * mulberry32(s.id * 31)();
                    const roll = rnd();
                    if (fill === 'some' && roll < 0.4) return; // pending
                    if (roll < 0.03) { scores[`${a.id}|${s.id}`] = { status: 'absent', score: null }; return; }
                    if (roll > 0.99) { scores[`${a.id}|${s.id}`] = { status: 'exempt', score: null }; return; }
                    const pct = Math.min(1, Math.max(0.3, ability + (rnd() - 0.5) * 0.24));
                    scores[`${a.id}|${s.id}`] = { status: 'scored', score: Math.round(pct * max) };
                });
            });
        });
    });
    return { assessments, scores };
}