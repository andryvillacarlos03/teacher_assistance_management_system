import { Head } from '@inertiajs/react';
import {
    AlertTriangle, CalendarCheck, CalendarDays, CheckCheck, ChevronLeft, ChevronRight,
    ClipboardCheck, Printer, Save, Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    attendanceSections, buildInitialSessions, rosterFor, sessionKey,
} from '@/data/attendanceSample';
import AppLayout from '@/layouts/AppLayout';

/* Theme: Navy #17324D | Teal #247A73 | Mint #E8F3F1 | Border #D8E0E8 | Gray #607184
          Warm #E6B85C | Danger #C65353 */

/* ---------- config & helpers ---------- */

const FOLLOW_UP_ABSENCES = 3; // students with this many absences in a month are flagged

const STATUS = {
    present: { label: 'Present', letter: 'P', soft: '#E8F3F1', softFg: '#1B5F59', solid: '#247A73', solidFg: '#FFFFFF' },
    late:    { label: 'Late',    letter: 'L', soft: '#FBF1DB', softFg: '#6F4B0E', solid: '#E6B85C', solidFg: '#17324D' },
    absent:  { label: 'Absent',  letter: 'A', soft: '#F9E6E6', softFg: '#A63F3F', solid: '#C65353', solidFg: '#FFFFFF' },
    excused: { label: 'Excused', letter: 'E', soft: '#E6EDF5', softFg: '#17324D', solid: '#607184', solidFg: '#FFFFFF' },
};

const toISO = (d) => d.toLocaleDateString('en-CA');
const parseISO = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const formatLong = (iso) => parseISO(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const formatShort = (iso) => parseISO(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const isWeekend = (iso) => [0, 6].includes(parseISO(iso).getDay());

const shiftSchoolDay = (iso, dir) => {
    const d = parseISO(iso);
    do { d.setDate(d.getDate() + dir); } while ([0, 6].includes(d.getDay()));
    return toISO(d);
};

const monthOf = (iso) => iso.slice(0, 7);
const shiftMonth = (m, n) => {
    const [y, mo] = m.split('-').map(Number);
    const d = new Date(y, mo - 1 + n, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const monthLabel = (m) => {
    const [y, mo] = m.split('-').map(Number);
    return new Date(y, mo - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};
const weekdaysInMonth = (m) => {
    const [y, mo] = m.split('-').map(Number);
    const out = [];
    for (let d = new Date(y, mo - 1, 1); d.getMonth() === mo - 1; d.setDate(d.getDate() + 1)) {
        if (![0, 6].includes(d.getDay())) out.push(toISO(d));
    }
    return out;
};

const fullName = (s) => `${s.lastName}, ${s.firstName}${s.middleName ? ` ${s.middleName[0]}.` : ''}${s.suffix ? ` ${s.suffix}` : ''}`;

const emptyCounts = () => ({ present: 0, late: 0, absent: 0, excused: 0 });
const total = (c) => c.present + c.late + c.absent + c.excused;
// Late counts as attending. Excused counts as not present. Change here if your school counts differently.
const rate = (c) => (total(c) ? Math.round(((c.present + c.late) / total(c)) * 100) : null);

const selectCls =
    'h-9 w-full rounded-md border border-[#D8E0E8] bg-white px-3 text-sm text-[#17324D] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73]';

/* ---------- shared pieces ---------- */

function StatusPill({ status }) {
    const s = STATUS[status];
    return (
        <span className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: s.soft, color: s.softFg }}>
            {s.label}
        </span>
    );
}

function StatTile({ icon: Icon, label, value, hint, tone = '#247A73', toneBg = '#E8F3F1' }) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-[#D8E0E8] bg-white p-4 shadow-sm">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: toneBg, color: tone }}>
                <Icon className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
                <p className="text-2xl font-semibold leading-none text-[#17324D]">{value}</p>
                <p className="mt-1 truncate text-sm font-medium text-[#17324D]">{label}</p>
                <p className="truncate text-xs text-[#607184]">{hint}</p>
            </div>
        </div>
    );
}

function Legend() {
    return (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#607184]">
            {Object.values(STATUS).map((s) => (
                <li key={s.label} className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm" style={{ backgroundColor: s.solid }} aria-hidden />{s.label}
                </li>
            ))}
        </ul>
    );
}

function CountChips({ counts }) {
    return (
        <ul className="flex flex-wrap gap-2">
            {Object.entries(STATUS).map(([id, s]) => (
                <li key={id} className="rounded-md px-2.5 py-1 text-sm" style={{ backgroundColor: s.soft, color: s.softFg }}>
                    <span className="font-semibold">{counts[id]}</span> {s.label}
                </li>
            ))}
        </ul>
    );
}

function MonthNav({ month, onChange, maxMonth }) {
    return (
        <div className="inline-flex items-center rounded-md border border-[#D8E0E8] bg-white">
            <Button variant="ghost" size="icon" className="size-9" aria-label="Previous month" onClick={() => onChange(shiftMonth(month, -1))}>
                <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-36 px-2 text-center text-sm font-medium text-[#17324D]" aria-live="polite">{monthLabel(month)}</span>
            <Button variant="ghost" size="icon" className="size-9" aria-label="Next month" disabled={month >= maxMonth} onClick={() => onChange(shiftMonth(month, 1))}>
                <ChevronRight className="size-4" />
            </Button>
        </div>
    );
}

function SectionSelect({ value, onChange }) {
    return (
        <div className="w-full sm:w-48">
            <label htmlFor="att-section" className="sr-only">Section</label>
            <select id="att-section" className={selectCls} value={value} onChange={(e) => onChange(e.target.value)}>
                {attendanceSections.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>
    );
}

/* ---------- daily attendance ---------- */

function DailyView({ section, date, roster, saved, onSave, onDirty }) {
    const [records, setRecords] = useState(() => ({ ...(saved?.records ?? {}) }));
    const [notes, setNotes] = useState(saved?.notes ?? '');
    const [dirty, setDirty] = useState(false);
    const [showErrors, setShowErrors] = useState(false);

    useEffect(() => { onDirty(false); return () => onDirty(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const touch = () => { setDirty(true); onDirty(true); };

    const mark = (id, status) => {
        setRecords((r) => ({ ...r, [id]: { status, remarks: status === 'present' ? '' : r[id]?.remarks ?? '' } }));
        touch();
    };
    const setRemarks = (id, remarks) => { setRecords((r) => ({ ...r, [id]: { ...r[id], remarks } })); touch(); };
    const markAllPresent = () => {
        setRecords(Object.fromEntries(roster.map((s) => [s.id, { status: 'present', remarks: '' }])));
        touch();
    };
    const clearAll = () => { setRecords({}); setShowErrors(false); touch(); };

    const counts = emptyCounts();
    roster.forEach((s) => { const st = records[s.id]?.status; if (st) counts[st] += 1; });
    const marked = total(counts);
    const unmarked = roster.length - marked;

    const save = () => {
        if (date > toISO(new Date())) { toast.error('You cannot record attendance for a future date.'); return; }
        if (unmarked > 0) {
            setShowErrors(true);
            toast.error(`${unmarked} student${unmarked > 1 ? 's still need' : ' still needs'} a mark.`);
            return;
        }
        onSave(sessionKey(section, date), { notes: notes.trim(), records });
        setDirty(false);
        onDirty(false);
        toast.success(saved ? 'Attendance updated.' : 'Attendance saved.');
    };

    if (roster.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-[#D8E0E8] bg-white p-10 text-center">
                <Users className="mx-auto size-8 text-[#607184]" aria-hidden />
                <p className="mt-2 font-medium text-[#17324D]">No active students in {section}</p>
                <p className="mt-1 text-sm text-[#607184]">Add or enroll students on the Students page first.</p>
            </div>
        );
    }

    const SaveButton = (
        <Button onClick={save} className="bg-[#247A73] text-white hover:bg-[#1d6560]">
            <Save className="mr-2 size-4" aria-hidden />{saved ? 'Update attendance' : 'Save attendance'}
        </Button>
    );

    return (
        <div className="space-y-4">
            {isWeekend(date) && (
                <p className="flex items-center gap-2 rounded-md border border-[#E6B85C] bg-[#FBF1DB] px-3 py-2 text-sm text-[#6F4B0E]">
                    <AlertTriangle className="size-4 shrink-0" aria-hidden />This date falls on a weekend. Record it only if you held class.
                </p>
            )}

            <div className="rounded-lg border border-[#D8E0E8] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="font-medium text-[#17324D]">{formatLong(date)}</p>
                        <p className="text-sm text-[#607184]">
                            {section} · {marked} of {roster.length} marked ·{' '}
                            {dirty ? <span className="font-medium text-[#8A5F12]">Unsaved changes</span> : saved ? <span className="text-[#1F6B4B]">Saved</span> : 'Not recorded yet'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" className="border-[#D8E0E8]" onClick={markAllPresent}><CheckCheck className="mr-2 size-4" aria-hidden />Mark all present</Button>
                        <Button variant="ghost" className="text-[#607184]" onClick={clearAll}>Clear</Button>
                        {SaveButton}
                    </div>
                </div>

                <div className="mt-4"><CountChips counts={counts} /></div>
                <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[#EEF2F6]" role="img" aria-label={`${marked} of ${roster.length} students marked`}>
                    {Object.entries(STATUS).map(([id, s]) => counts[id] > 0 && (
                        <div key={id} style={{ width: `${(counts[id] / roster.length) * 100}%`, backgroundColor: s.solid }} />
                    ))}
                </div>
            </div>

            <ul className="space-y-2">
                {roster.map((s, i) => {
                    const rec = records[s.id];
                    const missing = showErrors && !rec;
                    return (
                        <li key={s.id} className={`rounded-lg border bg-white p-3 shadow-sm ${missing ? 'border-[#C65353]' : 'border-[#D8E0E8]'}`}>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                <div className="flex min-w-0 flex-1 basis-48 items-center gap-3">
                                    <span className="w-6 shrink-0 text-sm text-[#607184]">{i + 1}</span>
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-[#17324D]">{fullName(s)}</p>
                                        <p className="text-xs text-[#607184]">{s.studentNumber}</p>
                                    </div>
                                </div>

                                <div role="radiogroup" aria-label={`Attendance for ${fullName(s)}`} className="grid w-full grid-cols-4 gap-1 sm:w-auto">
                                    {Object.entries(STATUS).map(([id, st]) => {
                                        const on = rec?.status === id;
                                        return (
                                            <button
                                                key={id} type="button" role="radio" aria-checked={on} onClick={() => mark(s.id, id)}
                                                className="h-9 rounded-md border border-[#D8E0E8] bg-white px-2 text-xs font-medium text-[#17324D] hover:bg-[#E8F3F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73] sm:px-3 sm:text-sm"
                                                style={on ? { backgroundColor: st.solid, color: st.solidFg, borderColor: st.solid } : undefined}
                                            >
                                                {st.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {rec && rec.status !== 'present' && (
                                <div className="mt-2 sm:pl-9">
                                    <label htmlFor={`rem-${s.id}`} className="sr-only">Remarks for {fullName(s)}</label>
                                    <Input
                                        id={`rem-${s.id}`} value={rec.remarks} onChange={(e) => setRemarks(s.id, e.target.value)}
                                        placeholder={rec.status === 'absent' ? 'Reason for absence (optional)' : 'Remarks (optional)'}
                                        className="h-8 border-[#D8E0E8] text-sm"
                                    />
                                </div>
                            )}
                            {missing && <p className="mt-1 text-xs text-[#C65353] sm:pl-9">Choose a status for this student.</p>}
                        </li>
                    );
                })}
            </ul>

            <div className="rounded-lg border border-[#D8E0E8] bg-white p-4 shadow-sm">
                <Label htmlFor="session-notes">Class notes for this day (optional)</Label>
                <Textarea id="session-notes" value={notes} onChange={(e) => { setNotes(e.target.value); touch(); }} placeholder="e.g. Fire drill, shortened class, school event" className="mt-1.5 min-h-16 border-[#D8E0E8]" />
                <div className="mt-3 flex justify-end">{SaveButton}</div>
            </div>
        </div>
    );
}

/* ---------- monthly summary ---------- */

function DayBars({ days, size }) {
    return (
        <div className="overflow-x-auto">
            <div className="min-w-[520px]">
                <div className="flex h-40 items-end gap-1 border-b border-[#D8E0E8]">
                    {days.map((d) => (
                        <div key={d.date} className="flex h-full flex-1 flex-col-reverse overflow-hidden rounded-t" title={`${formatShort(d.date)}: ${d.counts.present} present, ${d.counts.late} late, ${d.counts.absent} absent, ${d.counts.excused} excused`}>
                            {Object.keys(STATUS).map((id) => d.counts[id] > 0 && (
                                <div key={id} style={{ height: `${(d.counts[id] / size) * 100}%`, backgroundColor: STATUS[id].solid }} />
                            ))}
                        </div>
                    ))}
                </div>
                <div className="mt-1 flex gap-1">
                    {days.map((d) => <span key={d.date} className="flex-1 text-center text-[10px] text-[#607184]">{parseISO(d.date).getDate()}</span>)}
                </div>
            </div>
        </div>
    );
}

function SummaryView({ section, month, roster, sessions }) {
    const [sort, setSort] = useState('name');

    const data = useMemo(() => {
        const perStudent = Object.fromEntries(roster.map((s) => [s.id, emptyCounts()]));
        const days = [];
        Object.entries(sessions)
            .filter(([key]) => key.startsWith(`${section}|${month}`))
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([key, session]) => {
                const date = key.split('|')[1];
                const counts = emptyCounts();
                Object.entries(session.records).forEach(([sid, rec]) => {
                    counts[rec.status] += 1;
                    if (perStudent[sid]) perStudent[sid][rec.status] += 1;
                });
                days.push({ date, counts });
            });
        const all = emptyCounts();
        days.forEach((d) => Object.keys(all).forEach((k) => { all[k] += d.counts[k]; }));
        return { perStudent, days, all };
    }, [sessions, section, month, roster]);

    const rows = useMemo(() => {
        const list = roster.map((s) => ({ s, c: data.perStudent[s.id] }));
        if (sort === 'absences') list.sort((a, b) => b.c.absent - a.c.absent);
        if (sort === 'rate') list.sort((a, b) => (rate(a.c) ?? 101) - (rate(b.c) ?? 101));
        return list;
    }, [roster, data, sort]);

    const followUp = rows.filter((r) => r.c.absent >= FOLLOW_UP_ABSENCES);

    if (data.days.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-[#D8E0E8] bg-white p-10 text-center">
                <CalendarDays className="mx-auto size-8 text-[#607184]" aria-hidden />
                <p className="mt-2 font-medium text-[#17324D]">No attendance recorded for {monthLabel(month)}</p>
                <p className="mt-1 text-sm text-[#607184]">Switch to another month, or record attendance in the Take attendance tab.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 print:hidden">
                <StatTile icon={CalendarDays} label="School days recorded" value={data.days.length} hint={monthLabel(month)} />
                <StatTile icon={ClipboardCheck} label="Average attendance" value={`${rate(data.all)}%`} hint="Present and late" tone="#1F6B4B" toneBg="#E3F3EA" />
                <StatTile icon={AlertTriangle} label="Total absences" value={data.all.absent} hint={`${data.all.excused} excused`} tone="#A63F3F" toneBg="#F9E6E6" />
                <StatTile icon={Users} label="Need follow-up" value={followUp.length} hint={`${FOLLOW_UP_ABSENCES}+ absences this month`} tone="#8A5F12" toneBg="#FBF1DB" />
            </div>

            <section className="rounded-lg border border-[#D8E0E8] bg-white p-4 shadow-sm print:border-0 print:p-0 print:shadow-none">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold text-[#17324D]">Daily attendance</h2>
                    <Legend />
                </div>
                <DayBars days={data.days} size={roster.length} />
            </section>

            {followUp.length > 0 && (
                <section className="rounded-lg border border-[#E6B85C] bg-[#FBF1DB] p-4 print:hidden" aria-label="Students needing follow-up">
                    <h2 className="flex items-center gap-2 font-semibold text-[#6F4B0E]"><AlertTriangle className="size-4" aria-hidden />Students who may need a follow-up</h2>
                    <ul className="mt-2 flex flex-wrap gap-2">
                        {followUp.map(({ s, c }) => (
                            <li key={s.id} className="rounded-md bg-white px-2.5 py-1 text-sm text-[#17324D]">{fullName(s)} · <span className="font-medium text-[#A63F3F]">{c.absent} absences</span></li>
                        ))}
                    </ul>
                </section>
            )}

            <section>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 print:hidden">
                    <h2 className="font-semibold text-[#17324D]">By student</h2>
                    <div className="w-44">
                        <label htmlFor="sum-sort" className="sr-only">Sort students</label>
                        <select id="sum-sort" className={selectCls} value={sort} onChange={(e) => setSort(e.target.value)}>
                            <option value="name">Name A–Z</option>
                            <option value="absences">Most absences</option>
                            <option value="rate">Lowest attendance</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-[#D8E0E8] bg-white shadow-sm print:border-0 print:shadow-none">
                    <table className="w-full min-w-[560px] text-left text-sm">
                        <thead className="border-b border-[#D8E0E8] bg-[#F8FAFC] text-[#607184]">
                            <tr>
                                <th scope="col" className="px-4 py-3 font-medium">Student</th>
                                {Object.values(STATUS).map((s) => <th key={s.label} scope="col" className="px-3 py-3 text-center font-medium">{s.label}</th>)}
                                <th scope="col" className="px-4 py-3 text-right font-medium">Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D8E0E8]">
                            {rows.map(({ s, c }) => (
                                <tr key={s.id} className="hover:bg-[#F4FAF9]">
                                    <td className="px-4 py-2.5 font-medium text-[#17324D]">{fullName(s)}</td>
                                    <td className="px-3 py-2.5 text-center text-[#17324D]">{c.present}</td>
                                    <td className="px-3 py-2.5 text-center text-[#17324D]">{c.late}</td>
                                    <td className={`px-3 py-2.5 text-center ${c.absent >= FOLLOW_UP_ABSENCES ? 'font-semibold text-[#A63F3F]' : 'text-[#17324D]'}`}>{c.absent}</td>
                                    <td className="px-3 py-2.5 text-center text-[#17324D]">{c.excused}</td>
                                    <td className="px-4 py-2.5 text-right font-medium text-[#17324D]">{rate(c) ?? '—'}{rate(c) !== null && '%'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="mt-2 text-xs text-[#607184]">Rate = present and late days divided by recorded days. Excused days count as not present.</p>
            </section>
        </div>
    );
}

/* ---------- student history ---------- */

function HistoryView({ section, month, roster, sessions, studentId, onStudent }) {
    const student = roster.find((s) => s.id === studentId) ?? roster[0];

    const info = useMemo(() => {
        if (!student) return null;
        const byDate = {};
        const year = emptyCounts();
        Object.entries(sessions).forEach(([key, session]) => {
            const [sec, date] = key.split('|');
            const rec = session.records[student.id];
            if (sec !== section || !rec) return;
            year[rec.status] += 1;
            if (monthOf(date) === month) byDate[date] = rec;
        });
        const monthCounts = emptyCounts();
        Object.values(byDate).forEach((r) => { monthCounts[r.status] += 1; });
        return { byDate, year, monthCounts };
    }, [sessions, section, month, student]);

    if (!student) {
        return <div className="rounded-lg border border-dashed border-[#D8E0E8] bg-white p-10 text-center text-sm text-[#607184]">No active students in {section}.</div>;
    }

    // Calendar weeks (Mon–Fri)
    const weeks = {};
    weekdaysInMonth(month).forEach((iso) => {
        const d = parseISO(iso);
        const monday = new Date(d); monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        const key = toISO(monday);
        (weeks[key] ??= Array(5).fill(null))[(d.getDay() + 6) % 7] = iso;
    });

    const exceptions = Object.entries(info.byDate)
        .filter(([, r]) => r.status !== 'present')
        .sort(([a], [b]) => b.localeCompare(a));

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 print:hidden">
                <div className="w-full sm:w-72">
                    <label htmlFor="hist-student" className="sr-only">Student</label>
                    <select id="hist-student" className={selectCls} value={student.id} onChange={(e) => onStudent(Number(e.target.value))}>
                        {roster.map((s) => <option key={s.id} value={s.id}>{fullName(s)}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <StatTile icon={ClipboardCheck} label={`Attendance · ${monthLabel(month)}`} value={rate(info.monthCounts) === null ? '—' : `${rate(info.monthCounts)}%`} hint={`${total(info.monthCounts)} days recorded`} tone="#1F6B4B" toneBg="#E3F3EA" />
                <StatTile icon={AlertTriangle} label="Absences this month" value={info.monthCounts.absent} hint={`${info.monthCounts.excused} excused`} tone="#A63F3F" toneBg="#F9E6E6" />
                <StatTile icon={CalendarDays} label="Late this month" value={info.monthCounts.late} hint="Counts as attending" tone="#8A5F12" toneBg="#FBF1DB" />
                <StatTile icon={CalendarCheck} label="Year to date" value={rate(info.year) === null ? '—' : `${rate(info.year)}%`} hint={`${info.year.absent} absences in ${total(info.year)} days`} />
            </div>

            <section className="rounded-lg border border-[#D8E0E8] bg-white p-4 shadow-sm print:border-0 print:p-0 print:shadow-none">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold text-[#17324D]">{fullName(student)} · {monthLabel(month)}</h2>
                    <Legend />
                </div>
                <div className="overflow-x-auto">
                    <div className="min-w-[420px]">
                        <div className="mb-1 grid grid-cols-5 gap-1.5 text-center text-xs font-medium text-[#607184]">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => <span key={d}>{d}</span>)}
                        </div>
                        <div className="space-y-1.5">
                            {Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b)).map(([monday, cells]) => (
                                <div key={monday} className="grid grid-cols-5 gap-1.5">
                                    {cells.map((iso, i) => {
                                        if (!iso) return <div key={i} />;
                                        const rec = info.byDate[iso];
                                        const st = rec && STATUS[rec.status];
                                        return (
                                            <div
                                                key={iso}
                                                className={`flex h-14 flex-col justify-between rounded-md border p-1.5 ${rec ? 'border-transparent' : 'border-dashed border-[#D8E0E8]'}`}
                                                style={st ? { backgroundColor: st.soft, color: st.softFg } : undefined}
                                                title={rec ? `${formatShort(iso)}: ${st.label}${rec.remarks ? ` (${rec.remarks})` : ''}` : `${formatShort(iso)}: no class recorded`}
                                            >
                                                <span className="text-xs opacity-80">{parseISO(iso).getDate()}</span>
                                                <span className="text-center text-sm font-semibold" aria-label={st ? st.label : 'No record'}>{st ? st.letter : ''}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-lg border border-[#D8E0E8] bg-white shadow-sm">
                <h2 className="border-b border-[#D8E0E8] px-4 py-3 font-semibold text-[#17324D]">Absences, late and excused · {monthLabel(month)}</h2>
                {exceptions.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-[#607184]">{total(info.monthCounts) === 0 ? 'No attendance recorded this month.' : 'Perfect attendance this month.'}</p>
                ) : (
                    <ul className="divide-y divide-[#D8E0E8]">
                        {exceptions.map(([date, rec]) => (
                            <li key={date} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
                                <span className="w-32 shrink-0 text-sm font-medium text-[#17324D]">{formatShort(date)}</span>
                                <StatusPill status={rec.status} />
                                <span className="text-sm text-[#607184]">{rec.remarks || 'No remarks'}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

/* ---------- page ---------- */

export default function Attendance() {
    const today = toISO(new Date());
    const [sessions, setSessions] = useState(() => buildInitialSessions());
    const [view, setView] = useState('daily');
    const [section, setSection] = useState(attendanceSections[0]);
    const [date, setDate] = useState(isWeekend(today) ? shiftSchoolDay(today, -1) : today);
    const [month, setMonth] = useState(monthOf(today));
    const [studentId, setStudentId] = useState(null);
    const [dirty, setDirty] = useState(false);
    const [pending, setPending] = useState(null);

    const roster = useMemo(() => rosterFor(section), [section]);
    const guard = (fn) => (dirty ? setPending(() => fn) : fn());

    const views = [
        { id: 'daily', label: 'Take attendance' },
        { id: 'summary', label: 'Monthly summary' },
        { id: 'history', label: 'Student history' },
    ];

    const saveSession = (key, session) => setSessions((s) => ({ ...s, [key]: session }));
    const printable = view !== 'daily';

    return (
        <AppLayout
            title="Attendance"
            description="Record daily attendance and review summaries and student history."
            actions={
                printable && (
                    <Button variant="outline" onClick={() => window.print()} className="border-[#D8E0E8] bg-white text-[#17324D] hover:bg-[#E8F3F1] print:hidden">
                        <Printer className="mr-2 size-4" aria-hidden />Print
                    </Button>
                )
            }
        >
            <Head title="Attendance" />

            <div className="mb-4 hidden print:block">
                <h2 className="text-xl font-semibold text-[#17324D]">{view === 'summary' ? 'Monthly Attendance Summary' : 'Student Attendance History'}</h2>
                <p className="text-sm text-[#607184]">{section} · {monthLabel(month)}</p>
            </div>

            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 print:hidden">
                    <div role="group" aria-label="Attendance views" className="inline-flex flex-wrap rounded-md border border-[#D8E0E8] bg-white p-0.5">
                        {views.map((v) => (
                            <button
                                key={v.id} type="button" aria-pressed={view === v.id} onClick={() => guard(() => setView(v.id))}
                                className={`rounded px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73] ${view === v.id ? 'bg-[#247A73] text-white' : 'text-[#17324D] hover:bg-[#E8F3F1]'}`}
                            >
                                {v.label}
                            </button>
                        ))}
                    </div>

                    <SectionSelect value={section} onChange={(s) => guard(() => setSection(s))} />

                    {view === 'daily' ? (
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="size-9 border-[#D8E0E8]" aria-label="Previous school day" onClick={() => guard(() => setDate(shiftSchoolDay(date, -1)))}>
                                <ChevronLeft className="size-4" />
                            </Button>
                            <div>
                                <label htmlFor="att-date" className="sr-only">Date</label>
                                <Input id="att-date" type="date" value={date} max={today} onChange={(e) => e.target.value && guard(() => setDate(e.target.value))} className="w-40 border-[#D8E0E8] bg-white" />
                            </div>
                            <Button variant="outline" size="icon" className="size-9 border-[#D8E0E8]" aria-label="Next school day" disabled={shiftSchoolDay(date, 1) > today} onClick={() => guard(() => setDate(shiftSchoolDay(date, 1)))}>
                                <ChevronRight className="size-4" />
                            </Button>
                            {date !== today && !isWeekend(today) && (
                                <Button variant="ghost" className="text-[#247A73]" onClick={() => guard(() => setDate(today))}>Today</Button>
                            )}
                        </div>
                    ) : (
                        <MonthNav month={month} onChange={setMonth} maxMonth={monthOf(today)} />
                    )}
                </div>

                {view === 'daily' && (
                    <DailyView
                        key={sessionKey(section, date)}
                        section={section}
                        date={date}
                        roster={roster}
                        saved={sessions[sessionKey(section, date)]}
                        onSave={saveSession}
                        onDirty={setDirty}
                    />
                )}
                {view === 'summary' && <SummaryView section={section} month={month} roster={roster} sessions={sessions} />}
                {view === 'history' && (
                    <HistoryView section={section} month={month} roster={roster} sessions={sessions} studentId={studentId} onStudent={setStudentId} />
                )}
            </div>

            <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
                <DialogContent className="border-[#D8E0E8] bg-white text-[#17324D] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Discard unsaved attendance?</DialogTitle>
                        <DialogDescription className="text-[#607184]">You have marks that are not saved yet. If you continue, they will be lost.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" className="border-[#D8E0E8]" onClick={() => setPending(null)}>Keep editing</Button>
                        <Button onClick={() => { const fn = pending; setPending(null); setDirty(false); fn(); }} className="bg-[#C65353] text-white hover:bg-[#b04545]">Discard</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}