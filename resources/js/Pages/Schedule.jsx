import { Head } from '@inertiajs/react';
import { CalendarDays, CalendarPlus, LayoutGrid, List, Pencil, Printer, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DAYS, initialSchedule, sections, subjects } from '@/data/scheduleSample';
import AppLayout from '@/layouts/AppLayout';

/* Theme: Navy #17324D | Teal #247A73 | Mint #E8F3F1 | Border #D8E0E8 | Gray #607184 | Danger #C65353 */

/* ---------- helpers ---------- */

const START_HOUR = 7;
const END_HOUR = 16;
const HOUR_PX = 64;

const toMin = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};
const fmt = (t) => {
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const subjectOf = (id) => subjects.find((s) => s.id === id) ?? subjects[0];
const dayShort = (n) => DAYS.find((d) => d.n === n)?.short;

/** Single teacher => any overlap on the same day is a conflict. Touching times (8:20 / 8:20) are allowed. */
function findConflicts(form, entries, ignoreId) {
    const out = [];
    for (const e of entries) {
        if (e.id === ignoreId) continue;
        const sharedDays = e.days.filter((d) => form.days.includes(d));
        if (!sharedDays.length) continue;
        if (form.start < e.end && e.start < form.end) {
            out.push({ entry: e, days: sharedDays });
        }
    }
    return out;
}

function validate(form, entries, ignoreId) {
    const errors = {};
    if (!form.subject) errors.subject = 'Choose a subject.';
    if (!form.section) errors.section = 'Choose a section.';
    if (!form.days.length) errors.days = 'Select at least one day.';
    if (!form.start || !form.end) errors.time = 'Enter a start and end time.';
    else if (form.end <= form.start) errors.time = 'End time must be later than start time.';
    else if (toMin(form.start) < START_HOUR * 60 || toMin(form.end) > END_HOUR * 60)
        errors.time = `Time must be between ${fmt('07:00')} and ${fmt('16:00')}.`;
    if (!errors.time && !errors.days) {
        const conflicts = findConflicts(form, entries, ignoreId);
        if (conflicts.length) errors.conflicts = conflicts;
    }
    return errors;
}

const selectCls =
    'h-9 w-full rounded-md border border-[#D8E0E8] bg-white px-3 text-sm text-[#17324D] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73]';

/* ---------- add / edit dialog ---------- */

function ClassDialog({ open, onOpenChange, initial, entries, onSave }) {
    const [form, setForm] = useState(
        initial ?? { subject: '', section: '', room: '', days: [], start: '', end: '' },
    );
    const [errors, setErrors] = useState({});
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const toggleDay = (n) =>
        set('days', form.days.includes(n) ? form.days.filter((d) => d !== n) : [...form.days, n].sort());

    const submit = (e) => {
        e.preventDefault();
        const errs = validate(form, entries, initial?.id);
        setErrors(errs);
        if (Object.keys(errs).length) return;
        onSave({ ...form, id: initial?.id ?? Date.now() });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-[#D8E0E8] bg-white text-[#17324D] sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{initial ? 'Edit class' : 'Add class'}</DialogTitle>
                    <DialogDescription className="text-[#607184]">
                        Pick the days this class repeats every week.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4" noValidate>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="subject">Subject</Label>
                            <select id="subject" className={selectCls} value={form.subject} onChange={(e) => set('subject', e.target.value)}>
                                <option value="">Select subject</option>
                                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {errors.subject && <p className="text-sm text-[#C65353]">{errors.subject}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="section">Section</Label>
                            <select id="section" className={selectCls} value={form.section} onChange={(e) => set('section', e.target.value)}>
                                <option value="">Select section</option>
                                {sections.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {errors.section && <p className="text-sm text-[#C65353]">{errors.section}</p>}
                        </div>
                    </div>

                    <fieldset className="space-y-1.5">
                        <legend className="text-sm font-medium">Repeats on</legend>
                        <div className="flex flex-wrap gap-2">
                            {DAYS.map((d) => {
                                const on = form.days.includes(d.n);
                                return (
                                    <button
                                        key={d.n}
                                        type="button"
                                        aria-pressed={on}
                                        onClick={() => toggleDay(d.n)}
                                        className={`h-9 min-w-12 rounded-md border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73] ${
                                            on ? 'border-[#247A73] bg-[#247A73] text-white' : 'border-[#D8E0E8] bg-white text-[#17324D] hover:bg-[#E8F3F1]'
                                        }`}
                                    >
                                        {d.short}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.days && <p className="text-sm text-[#C65353]">{errors.days}</p>}
                    </fieldset>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="start">Start</Label>
                            <Input id="start" type="time" step="300" value={form.start} onChange={(e) => set('start', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="end">End</Label>
                            <Input id="end" type="time" step="300" value={form.end} onChange={(e) => set('end', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="room">Room</Label>
                            <Input id="room" placeholder="Room 12" value={form.room} onChange={(e) => set('room', e.target.value)} />
                        </div>
                    </div>
                    {errors.time && <p className="text-sm text-[#C65353]">{errors.time}</p>}

                    {errors.conflicts && (
                        <div role="alert" className="rounded-md border border-[#C65353]/40 bg-[#F9E6E6] p-3 text-sm text-[#A63F3F]">
                            <p className="font-medium">This overlaps with another class:</p>
                            <ul className="mt-1 list-disc space-y-0.5 pl-5">
                                {errors.conflicts.slice(0, 3).map((c) => (
                                    <li key={c.entry.id}>
                                        {subjectOf(c.entry.subject).name}, {c.entry.section} on {c.days.map(dayShort).join(', ')} ({fmt(c.entry.start)}–{fmt(c.entry.end)})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" className="border-[#D8E0E8]" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" className="bg-[#247A73] text-white hover:bg-[#1d6560]">
                            {initial ? 'Save changes' : 'Add class'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/* ---------- weekly grid ---------- */

function WeekGrid({ entries, todayN, onSelect }) {
    const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
    const totalH = (END_HOUR - START_HOUR) * HOUR_PX;
    const cols = 'grid grid-cols-[56px_repeat(5,minmax(0,1fr))]';

    return (
        <div className="overflow-x-auto rounded-lg border border-[#D8E0E8] bg-white shadow-sm print:overflow-visible print:shadow-none">
            <div className="min-w-[760px] print:min-w-0">
                <div className={`${cols} border-b border-[#D8E0E8] bg-[#F8FAFC]`}>
                    <div />
                    {DAYS.map((d) => (
                        <div key={d.n} className="border-l border-[#D8E0E8] px-2 py-2 text-center text-sm font-semibold text-[#17324D]">
                            {d.long}
                            {d.n === todayN && (
                                <span className="ml-2 rounded-full bg-[#247A73] px-2 py-0.5 text-xs font-medium text-white print:hidden">Today</span>
                            )}
                        </div>
                    ))}
                </div>

                <div className={cols}>
                    <div className="relative" style={{ height: totalH }}>
                        {hours.map((h, i) => (
                            <span key={h} className="absolute right-2 text-xs text-[#607184]" style={{ top: i * HOUR_PX + 3 }}>
                                {fmt(`${String(h).padStart(2, '0')}:00`)}
                            </span>
                        ))}
                    </div>

                    {DAYS.map((d) => (
                        <div
                            key={d.n}
                            className={`relative border-l border-[#D8E0E8] ${d.n === todayN ? 'bg-[#F4FAF9]' : ''}`}
                            style={{
                                height: totalH,
                                backgroundImage: `repeating-linear-gradient(to bottom, #E3EAF1 0, #E3EAF1 1px, transparent 1px, transparent ${HOUR_PX}px)`,
                            }}
                        >
                            {entries
                                .filter((e) => e.days.includes(d.n))
                                .map((e) => {
                                    const s = subjectOf(e.subject);
                                    const top = ((toMin(e.start) - START_HOUR * 60) / 60) * HOUR_PX;
                                    const height = ((toMin(e.end) - toMin(e.start)) / 60) * HOUR_PX - 2;
                                    return (
                                        <button
                                            key={e.id}
                                            type="button"
                                            onClick={() => onSelect(e)}
                                            aria-label={`${s.name}, ${e.section}, ${fmt(e.start)} to ${fmt(e.end)}. Edit`}
                                            className="absolute inset-x-1 overflow-hidden rounded-md px-2 py-1 text-left text-xs shadow-sm hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73]"
                                            style={{ top, height, backgroundColor: s.bg, color: s.fg, borderLeft: `4px solid ${s.border}` }}
                                        >
                                            <span className="block truncate text-sm font-semibold leading-tight">{s.name}</span>
                                            <span className="block truncate">{e.section}{e.room ? ` · ${e.room}` : ''}</span>
                                            {height > 70 && <span className="block truncate opacity-80">{fmt(e.start)} – {fmt(e.end)}</span>}
                                        </button>
                                    );
                                })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ---------- single-day list ---------- */

function DayList({ entries, day, onEdit, onDelete, onAdd }) {
    const items = entries
        .filter((e) => e.days.includes(day.n))
        .sort((a, b) => a.start.localeCompare(b.start));

    if (!items.length) {
        return (
            <div className="rounded-lg border border-dashed border-[#D8E0E8] bg-white p-8 text-center">
                <p className="text-sm text-[#607184]">No classes on {day.long}.</p>
                <Button onClick={onAdd} className="mt-3 bg-[#247A73] text-white hover:bg-[#1d6560]">
                    <CalendarPlus className="mr-2 size-4" aria-hidden />Add class
                </Button>
            </div>
        );
    }

    return (
        <ul className="space-y-2">
            {items.map((e) => {
                const s = subjectOf(e.subject);
                return (
                    <li
                        key={e.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-[#D8E0E8] bg-white px-3 py-3 shadow-sm"
                        style={{ borderLeft: `4px solid ${s.border}` }}
                    >
                        <div className="w-28 shrink-0 text-sm">
                            <p className="font-medium text-[#17324D]">{fmt(e.start)}</p>
                            <p className="text-xs text-[#607184]">to {fmt(e.end)}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-[#17324D]">{s.name}</p>
                            <p className="truncate text-sm text-[#607184]">
                                {e.section}{e.room ? ` · ${e.room}` : ''} · repeats {e.days.map(dayShort).join(', ')}
                            </p>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" aria-label={`Edit ${s.name}`} onClick={() => onEdit(e)} className="text-[#607184] hover:bg-[#E8F3F1]">
                                <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label={`Delete ${s.name}`} onClick={() => onDelete(e)} className="text-[#C65353] hover:bg-[#F9E6E6]">
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

/* ---------- page ---------- */

export default function Schedule() {
    const jsDay = new Date().getDay(); // 0 = Sunday
    const todayN = jsDay >= 1 && jsDay <= 5 ? jsDay : 0;

    const [entries, setEntries] = useState(initialSchedule);
    const [view, setView] = useState('week');
    const [dayN, setDayN] = useState(todayN || 1);
    const [sectionFilter, setSectionFilter] = useState('all');
    const [dialog, setDialog] = useState({ open: false, entry: null, key: 0 });
    const [toDelete, setToDelete] = useState(null);

    const visible = useMemo(
        () => (sectionFilter === 'all' ? entries : entries.filter((e) => e.section === sectionFilter)),
        [entries, sectionFilter],
    );

    const stats = useMemo(() => {
        const sessions = visible.reduce((n, e) => n + e.days.length, 0);
        const minutes = visible.reduce((n, e) => n + (toMin(e.end) - toMin(e.start)) * e.days.length, 0);
        return { sessions, hours: (minutes / 60).toFixed(1) };
    }, [visible]);

    const openDialog = (entry = null) => setDialog((d) => ({ open: true, entry, key: d.key + 1 }));

    const save = (entry) => {
        const exists = entries.some((e) => e.id === entry.id);
        setEntries((list) => (exists ? list.map((e) => (e.id === entry.id ? entry : e)) : [...list, entry]));
        setDialog((d) => ({ ...d, open: false }));
        toast.success(exists ? 'Class updated.' : 'Class added to your timetable.');
    };

    const confirmDelete = () => {
        setEntries((list) => list.filter((e) => e.id !== toDelete.id));
        toast.success('Class removed.');
        setToDelete(null);
    };

    const day = DAYS.find((d) => d.n === dayN);

    return (
        <AppLayout
            title="Schedule"
            description="Your weekly timetable. Overlapping classes are blocked automatically."
            actions={
                <>
                    <Button variant="outline" onClick={() => window.print()} className="border-[#D8E0E8] bg-white text-[#17324D] hover:bg-[#E8F3F1] print:hidden">
                        <Printer className="mr-2 size-4" aria-hidden />Print
                    </Button>
                    <Button onClick={() => openDialog()} className="bg-[#247A73] text-white hover:bg-[#1d6560] print:hidden">
                        <CalendarPlus className="mr-2 size-4" aria-hidden />Add class
                    </Button>
                </>
            }
        >
            <Head title="Schedule" />

            {/* Print-only heading */}
            <div className="mb-4 hidden print:block">
                <h2 className="text-xl font-semibold text-[#17324D]">Weekly Teaching Schedule</h2>
                <p className="text-sm text-[#607184]">S.Y. 2026–2027{sectionFilter !== 'all' ? ` · ${sectionFilter}` : ''}</p>
            </div>

            <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <div className="flex flex-wrap items-center gap-3">
                        <div role="group" aria-label="Timetable view" className="inline-flex rounded-md border border-[#D8E0E8] bg-white p-0.5">
                            {[
                                { id: 'week', label: 'Week', icon: LayoutGrid },
                                { id: 'day', label: 'Day', icon: List },
                            ].map((v) => (
                                <button
                                    key={v.id}
                                    type="button"
                                    aria-pressed={view === v.id}
                                    onClick={() => setView(v.id)}
                                    className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73] ${
                                        view === v.id ? 'bg-[#247A73] text-white' : 'text-[#17324D] hover:bg-[#E8F3F1]'
                                    }`}
                                >
                                    <v.icon className="size-4" aria-hidden />{v.label}
                                </button>
                            ))}
                        </div>

                        <div className="w-48">
                            <label htmlFor="sectionFilter" className="sr-only">Filter by section</label>
                            <select id="sectionFilter" className={selectCls} value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                                <option value="all">All sections</option>
                                {sections.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <p className="flex items-center gap-2 text-sm text-[#607184]">
                        <CalendarDays className="size-4" aria-hidden />
                        {stats.sessions} classes per week · {stats.hours} teaching hours
                    </p>
                </div>

                {/* Subject legend */}
                <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#607184]">
                    {subjects.map((s) => (
                        <li key={s.id} className="flex items-center gap-1.5">
                            <span className="size-3 rounded-sm" style={{ backgroundColor: s.bg, border: `2px solid ${s.border}` }} aria-hidden />
                            {s.name}
                        </li>
                    ))}
                </ul>

                {/* Week view (also what prints) */}
                <div className={view === 'week' ? '' : 'hidden print:block'}>
                    <WeekGrid entries={visible} todayN={todayN} onSelect={(e) => openDialog(e)} />
                    <p className="mt-2 text-xs text-[#607184] print:hidden">Tip: select a class in the grid to edit it.</p>
                </div>

                {/* Day view */}
                <div className={view === 'day' ? 'space-y-3 print:hidden' : 'hidden'}>
                    <div role="group" aria-label="Choose a day" className="flex flex-wrap gap-2">
                        {DAYS.map((d) => (
                            <button
                                key={d.n}
                                type="button"
                                aria-pressed={dayN === d.n}
                                onClick={() => setDayN(d.n)}
                                className={`rounded-md border px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73] ${
                                    dayN === d.n ? 'border-[#247A73] bg-[#247A73] text-white' : 'border-[#D8E0E8] bg-white text-[#17324D] hover:bg-[#E8F3F1]'
                                }`}
                            >
                                {d.short}{d.n === todayN ? ' · Today' : ''}
                            </button>
                        ))}
                    </div>
                    <DayList entries={visible} day={day} onEdit={openDialog} onDelete={setToDelete} onAdd={() => openDialog()} />
                </div>
            </div>

            {/* Add / edit */}
            <ClassDialog
                key={dialog.key}
                open={dialog.open}
                onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
                initial={dialog.entry}
                entries={entries}
                onSave={save}
            />

            {/* Delete confirmation */}
            <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
                <DialogContent className="border-[#D8E0E8] bg-white text-[#17324D] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Remove this class?</DialogTitle>
                        <DialogDescription className="text-[#607184]">
                            {toDelete && `${subjectOf(toDelete.subject).name} · ${toDelete.section} (${toDelete.days.map(dayShort).join(', ')}) will be removed from every day it repeats.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" className="border-[#D8E0E8]" onClick={() => setToDelete(null)}>Keep it</Button>
                        <Button onClick={confirmDelete} className="bg-[#C65353] text-white hover:bg-[#b04545]">Remove</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}