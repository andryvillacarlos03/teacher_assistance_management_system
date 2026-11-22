import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Archive, ArchiveRestore, Eye, GraduationCap, Loader2, Pencil, Printer, Search, UserPlus, UserX, Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/AppLayout';

/* Theme: Navy #17324D | Teal #247A73 | Mint #E8F3F1 | Border #D8E0E8 | Gray #607184 | Danger #C65353 */

/* ---------- server routes ---------- */

const R = {
    list:    '/students',
    student: (s) => (s ? `/students/${s.id}` : '/students'),
    restore: (s) => `/students/${s.id}/restore`,
};

/* Server field name -> form field id used in the student dialog */
const FIELD_MAP = {
    student_number: 'studentNumber', first_name: 'firstName', middle_name: 'middleName',
    last_name: 'lastName', suffix: 'suffix', section_id: 'section', status: 'status',
};

/* ---------- helpers ---------- */

const fullName = (s) =>
    `${s.lastName}, ${s.firstName}${s.middleName ? ` ${s.middleName[0]}.` : ''}${s.suffix ? ` ${s.suffix}` : ''}`;
const initials = (s) => `${s.firstName[0] ?? ''}${s.lastName[0] ?? ''}`.toUpperCase();

const statusStyles = {
    active:      { label: 'Active',      bg: '#E3F3EA', fg: '#1F6B4B', dot: '#2E8B65' },
    inactive:    { label: 'Inactive',    bg: '#EEF2F6', fg: '#4A5B6E', dot: '#607184' },
    transferred: { label: 'Transferred', bg: '#FBF1DB', fg: '#8A5F12', dot: '#C58A2B' },
};

const selectCls =
    'h-9 w-full rounded-md border border-[#D8E0E8] bg-white px-3 text-sm text-[#17324D] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73]';

/* ---------- small building blocks ---------- */

function StatusBadge({ status }) {
    const s = statusStyles[status];
    if (!s) return null;
    return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: s.bg, color: s.fg }}>
            <span className="size-1.5 rounded-full" style={{ backgroundColor: s.dot }} aria-hidden />
            {s.label}
        </span>
    );
}

function Avatar({ student, size = 'size-9', text = 'text-sm' }) {
    return (
        <div className={`flex ${size} ${text} shrink-0 items-center justify-center rounded-full bg-[#E8F3F1] font-semibold text-[#247A73]`} aria-hidden>
            {initials(student)}
        </div>
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

function Field({ id, label, hint, error, children }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            {children}
            {hint && !error && <p className="text-xs text-[#607184]">{hint}</p>}
            {error && <p className="text-sm text-[#C65353]" role="alert">{error}</p>}
        </div>
    );
}

/* ---------- list ---------- */

function RowActions({ row, handlers }) {
    const btn = 'size-8 text-[#607184] hover:bg-[#E8F3F1]';
    const { student } = row;
    return (
        <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className={btn} aria-label={`View ${fullName(student)}`} onClick={() => handlers.onView(student)}>
                <Eye className="size-4" />
            </Button>
            {student.archived ? (
                <Button variant="ghost" size="icon" className="size-8 text-[#247A73] hover:bg-[#E8F3F1]" aria-label={`Restore ${fullName(student)}`} onClick={() => handlers.onRestore(student)}>
                    <ArchiveRestore className="size-4" />
                </Button>
            ) : (
                <>
                    <Button variant="ghost" size="icon" className={btn} aria-label={`Edit ${fullName(student)}`} onClick={() => handlers.onEdit(student)}>
                        <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 text-[#C65353] hover:bg-[#F9E6E6]" aria-label={`Archive ${fullName(student)}`} onClick={() => handlers.onArchive(student)}>
                        <Archive className="size-4" />
                    </Button>
                </>
            )}
        </div>
    );
}

function StudentTable({ rows, handlers }) {
    return (
        <div className="hidden overflow-x-auto rounded-lg border border-[#D8E0E8] bg-white shadow-sm md:block print:block print:border-0 print:shadow-none">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-[#D8E0E8] bg-[#F8FAFC] text-[#607184]">
                    <tr>
                        <th scope="col" className="w-12 px-4 py-3 font-medium">#</th>
                        <th scope="col" className="px-4 py-3 font-medium">Student</th>
                        <th scope="col" className="px-4 py-3 font-medium">Student no.</th>
                        <th scope="col" className="px-4 py-3 font-medium">Section</th>
                        <th scope="col" className="px-4 py-3 font-medium">Status</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium print:hidden"><span className="sr-only">Actions</span></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E0E8]">
                    {rows.map((r, i) => (
                        <tr key={r.student.id} className={`hover:bg-[#F4FAF9] ${r.student.archived ? 'opacity-70' : ''}`}>
                            <td className="px-4 py-3 text-[#607184]">{i + 1}</td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <span className="print:hidden"><Avatar student={r.student} /></span>
                                    <button type="button" onClick={() => handlers.onView(r.student)} className="rounded text-left font-medium text-[#17324D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73]">
                                        {fullName(r.student)}
                                    </button>
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-[#607184]">{r.student.studentNumber ?? '—'}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-[#17324D]">{r.enrollment.section}</td>
                            <td className="px-4 py-3">{r.student.archived ? <span className="text-xs font-medium text-[#607184]">Archived</span> : <StatusBadge status={r.enrollment.status} />}</td>
                            <td className="px-4 py-3 print:hidden"><div className="flex justify-end"><RowActions row={r} handlers={handlers} /></div></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function StudentCards({ rows, handlers }) {
    return (
        <ul className="space-y-3 md:hidden print:hidden">
            {rows.map((r) => (
                <li key={r.student.id} className={`rounded-lg border border-[#D8E0E8] bg-white p-3 shadow-sm ${r.student.archived ? 'opacity-70' : ''}`}>
                    <div className="flex items-start gap-3">
                        <Avatar student={r.student} size="size-10" />
                        <div className="min-w-0 flex-1">
                            <button type="button" onClick={() => handlers.onView(r.student)} className="text-left font-medium text-[#17324D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73]">
                                {fullName(r.student)}
                            </button>
                            <p className="text-xs text-[#607184]">{r.student.studentNumber ? `${r.student.studentNumber} · ` : ''}{r.enrollment.section}</p>
                        </div>
                        {r.student.archived ? <span className="text-xs font-medium text-[#607184]">Archived</span> : <StatusBadge status={r.enrollment.status} />}
                    </div>
                    <div className="mt-2 flex justify-end border-t border-[#D8E0E8] pt-2"><RowActions row={r} handlers={handlers} /></div>
                </li>
            ))}
        </ul>
    );
}

/* ---------- add / edit dialog ---------- */

function StudentDialog({ open, onOpenChange, initial, yearLabel, sectionOptions, enrollment, onSave, serverErrors = {}, processing = false }) {
    const [form, setForm] = useState({
        studentNumber: initial?.studentNumber ?? '', firstName: initial?.firstName ?? '',
        middleName: initial?.middleName ?? '', lastName: initial?.lastName ?? '', suffix: initial?.suffix ?? '',
        section: enrollment?.sectionId ?? '', status: enrollment?.status ?? 'active',
    });
    const [errors, setErrors] = useState({});
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const errorFor = (k) => errors[k] ?? serverErrors[k];

    const submit = (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.firstName.trim()) errs.firstName = 'Enter the first name.';
        if (!form.lastName.trim()) errs.lastName = 'Enter the last name.';
        if (!initial && !form.section) errs.section = `Choose a section for S.Y. ${yearLabel}.`;
        setErrors(errs);
        if (Object.keys(errs).length) return;
        onSave({
            student_number: form.studentNumber.trim() || null,
            first_name: form.firstName.trim(),
            middle_name: form.middleName.trim() || null,
            last_name: form.lastName.trim(),
            suffix: form.suffix.trim() || null,
            section_id: form.section || null,
            status: form.status,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-[#D8E0E8] bg-white text-[#17324D] sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{initial ? 'Edit student' : 'Add student'}</DialogTitle>
                    <DialogDescription className="text-[#607184]">
                        Only the details you need for teaching. Enrollment applies to S.Y. {yearLabel}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} noValidate className="space-y-4">
                    <Field id="s-number" label="Student number (optional)" hint="LRN or school ID, if you have it." error={errorFor('studentNumber')}>
                        <Input id="s-number" value={form.studentNumber} onChange={(e) => set('studentNumber', e.target.value)} placeholder="e.g. 2021-0117" className="border-[#D8E0E8]" aria-invalid={!!errorFor('studentNumber')} />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field id="s-first" label="First name" error={errorFor('firstName')}>
                            <Input id="s-first" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} className="border-[#D8E0E8]" aria-invalid={!!errorFor('firstName')} />
                        </Field>
                        <Field id="s-middle" label="Middle name (optional)" error={errorFor('middleName')}>
                            <Input id="s-middle" value={form.middleName} onChange={(e) => set('middleName', e.target.value)} className="border-[#D8E0E8]" />
                        </Field>
                        <Field id="s-last" label="Last name" error={errorFor('lastName')}>
                            <Input id="s-last" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} className="border-[#D8E0E8]" aria-invalid={!!errorFor('lastName')} />
                        </Field>
                        <Field id="s-suffix" label="Suffix (optional)" error={errorFor('suffix')}>
                            <Input id="s-suffix" value={form.suffix} onChange={(e) => set('suffix', e.target.value)} placeholder="Jr., III" className="border-[#D8E0E8]" />
                        </Field>
                    </div>

                    <fieldset className="grid gap-4 rounded-md bg-[#F8FAFC] p-3 sm:grid-cols-2">
                        <legend className="px-1 text-sm font-medium">Enrollment · S.Y. {yearLabel}</legend>
                        <Field id="s-section" label="Section" error={errorFor('section')}>
                            <select
                                id="s-section" className={selectCls} value={form.section}
                                onChange={(e) => set('section', e.target.value === '' ? '' : Number(e.target.value))}
                            >
                                <option value="">{initial ? 'Not enrolled this year' : 'Select section'}</option>
                                {sectionOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </Field>
                        <Field id="s-status" label="Status" error={errorFor('status')}>
                            <select id="s-status" className={selectCls} value={form.status} onChange={(e) => set('status', e.target.value)} disabled={!form.section}>
                                {Object.entries(statusStyles).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
                            </select>
                        </Field>
                    </fieldset>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" className="border-[#D8E0E8]" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-[#247A73] text-white hover:bg-[#1d6560]">
                            {processing && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />}{initial ? 'Save changes' : 'Add student'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/* ---------- profile dialog ---------- */

function ProfileDialog({ student, history, attendance, yearId, yearLabel, isCurrentYear, onClose, onEdit, onArchive, onRestore }) {
    const current = history.find((h) => h.yearId === yearId);
    const total = attendance ? attendance.present + attendance.late + attendance.absent : 0;
    const rate = total ? Math.round(((attendance.present + attendance.late) / total) * 100) : null;

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-[#D8E0E8] bg-white text-[#17324D] sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-3 pr-6">
                        <Avatar student={student} size="size-14" text="text-lg" />
                        <div className="min-w-0">
                            <DialogTitle className="leading-snug">{fullName(student)}</DialogTitle>
                            <DialogDescription className="text-[#607184]">
                                {student.studentNumber ? `Student no. ${student.studentNumber}` : 'No student number'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {student.archived && (
                    <p className="rounded-md bg-[#EEF2F6] px-3 py-2 text-sm text-[#4A5B6E]">This student is archived. Records are kept for history.</p>
                )}

                <dl className="grid grid-cols-2 gap-3 rounded-md bg-[#F8FAFC] p-3 text-sm">
                    <div><dt className="text-xs text-[#607184]">Section · S.Y. {yearLabel}</dt><dd className="font-medium">{current?.section ?? 'Not enrolled'}</dd></div>
                    <div><dt className="text-xs text-[#607184]">Status</dt><dd className="mt-0.5">{current ? <StatusBadge status={current.status} /> : '—'}</dd></div>
                </dl>

                {rate !== null && isCurrentYear && (
                    <section>
                        <h3 className="mb-2 text-sm font-semibold">Attendance this school year</h3>
                        <div className="grid grid-cols-4 gap-2 text-center">
                            {[
                                ['Rate', `${rate}%`, '#247A73'],
                                ['Present', attendance.present, '#17324D'],
                                ['Late', attendance.late, '#8A5F12'],
                                ['Absent', attendance.absent, '#A63F3F'],
                            ].map(([label, value, color]) => (
                                <div key={label} className="rounded-md border border-[#D8E0E8] p-2">
                                    <p className="text-lg font-semibold" style={{ color }}>{value}</p>
                                    <p className="text-xs text-[#607184]">{label}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <h3 className="mb-2 text-sm font-semibold">Enrollment history</h3>
                    {history.length === 0 ? (
                        <p className="text-sm text-[#607184]">No enrollment records.</p>
                    ) : (
                        <ol className="space-y-2 border-l-2 border-[#D8E0E8] pl-4">
                            {history.map((h) => (
                                <li key={h.id} className="relative flex flex-wrap items-center justify-between gap-2">
                                    <span className="absolute -left-[22px] top-1.5 size-2.5 rounded-full border-2 border-white bg-[#247A73]" aria-hidden />
                                    <div>
                                        <p className="text-sm font-medium">S.Y. {h.yearName}</p>
                                        <p className="text-xs text-[#607184]">{h.section}</p>
                                    </div>
                                    <StatusBadge status={h.status} />
                                </li>
                            ))}
                        </ol>
                    )}
                </section>

                <DialogFooter className="gap-2 sm:justify-between sm:gap-0">
                    {student.archived ? (
                        <Button variant="outline" className="border-[#D8E0E8]" onClick={() => onRestore(student)}>
                            <ArchiveRestore className="mr-2 size-4" aria-hidden />Restore
                        </Button>
                    ) : (
                        <>
                            <Button variant="ghost" className="text-[#C65353] hover:bg-[#F9E6E6]" onClick={() => onArchive(student)}>
                                <Archive className="mr-2 size-4" aria-hidden />Archive
                            </Button>
                            <Button variant="outline" className="border-[#D8E0E8]" onClick={() => onEdit(student)}>
                                <Pencil className="mr-2 size-4" aria-hidden />Edit student
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ---------- page ---------- */

/**
 * Props from StudentController@index:
 *  academicYears: [{ id, name, active }]
 *  yearId:        the selected school year (or null if none exist)
 *  sections:      [{ id, name }]  sections of the selected year, e.g. "Grade 4 – Mabini"
 *  rows:          [{ student: {...}, enrollment: { id, sectionId, section, status } }]
 *  history:       { [studentId]: [{ id, yearId, yearName, section, status }] }
 *  attendance:    { [studentId]: { present, late, absent } }   (optional, Attendance module)
 */
export default function Students({
    academicYears = [],
    yearId = null,
    sections = [],
    rows: yearRows = [],
    history = {},
    attendance = {},
}) {
    const { flash } = usePage().props;

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [section, setSection] = useState('all');
    const [form, setForm] = useState({ open: false, student: null, key: 0 });
    const [serverErrors, setServerErrors] = useState({});
    const [viewId, setViewId] = useState(null);
    const [toArchive, setToArchive] = useState(null);
    const [busy, setBusy] = useState(false);

    // Success and warning messages from the server (back()->with('success', ...)).
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.warning) toast.warning(flash.warning);
    }, [flash]);

    const activeId = academicYears.find((y) => y.active)?.id ?? null;
    const yearLabel = academicYears.find((y) => y.id === yearId)?.name ?? '';
    const isPastYear = yearId !== null && yearId !== activeId;
    const canAdd = yearId !== null && sections.length > 0;

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return yearRows
            .filter((r) => (status === 'archived' ? r.student.archived : !r.student.archived))
            .filter((r) => status === 'all' || status === 'archived' || r.enrollment.status === status)
            .filter((r) => section === 'all' || r.enrollment.sectionId === section)
            .filter((r) => !q
                || fullName(r.student).toLowerCase().includes(q)
                || `${r.student.firstName} ${r.student.lastName}`.toLowerCase().includes(q)
                || (r.student.studentNumber ?? '').toLowerCase().includes(q))
            .sort((a, b) => fullName(a.student).localeCompare(fullName(b.student)));
    }, [yearRows, status, section, search]);

    const live = yearRows.filter((r) => !r.student.archived);
    const counts = {
        enrolled: live.length,
        active: live.filter((r) => r.enrollment.status === 'active').length,
        away: live.filter((r) => r.enrollment.status !== 'active').length,
        archived: yearRows.length - live.length,
    };
    const hasFilters = search || status !== 'all' || section !== 'all';
    const clear = () => { setSearch(''); setStatus('all'); setSection('all'); };

    const reqOpts = (extra = {}) => ({
        preserveScroll: true,
        onStart: () => setBusy(true),
        onFinish: () => setBusy(false),
        ...extra,
    });

    const changeYear = (id) => {
        setSection('all');
        router.get(R.list, { year: id }, {
            preserveState: true, preserveScroll: true,
            only: ['yearId', 'sections', 'rows', 'history', 'attendance'],
        });
    };

    const restoreStudent = (s) => router.patch(R.restore(s), {}, reqOpts());

    const handlers = {
        onView: (s) => setViewId(s.id),
        onEdit: (s) => { setViewId(null); setServerErrors({}); setForm((f) => ({ open: true, student: s, key: f.key + 1 })); },
        onArchive: (s) => { setViewId(null); setToArchive(s); },
        onRestore: restoreStudent,
    };
    const openAdd = () => { setServerErrors({}); setForm((f) => ({ open: true, student: null, key: f.key + 1 })); };

    const save = (data) => {
        setServerErrors({});
        const payload = { ...data, academic_year_id: yearId };
        const opts = reqOpts({
            onSuccess: () => setForm((f) => ({ ...f, open: false })),
            onError: (errs) => {
                const mapped = {};
                const rest = [];
                Object.entries(errs).forEach(([key, msg]) => {
                    if (FIELD_MAP[key]) mapped[FIELD_MAP[key]] = msg; else rest.push(msg);
                });
                setServerErrors(mapped);
                if (rest.length) toast.error(rest[0]);
            },
        });
        if (form.student) router.put(R.student(form.student), payload, opts);
        else router.post(R.student(), payload, opts);
    };

    const confirmArchive = () => {
        const s = toArchive;
        router.delete(R.student(s), reqOpts({
            onSuccess: () => {
                setToArchive(null);
                toast('You can restore this student any time.', { action: { label: 'Undo', onClick: () => restoreStudent(s) } });
            },
            onError: () => { setToArchive(null); toast.error('The student could not be archived.'); },
        }));
    };

    const viewing = yearRows.find((r) => r.student.id === viewId)?.student ?? null;
    const editingEnrollment = form.student ? yearRows.find((r) => r.student.id === form.student.id)?.enrollment ?? null : null;

    const chip = (id, label, count) => (
        <button
            key={id} type="button" aria-pressed={section === id} onClick={() => setSection(id)}
            className={`shrink-0 rounded-full border px-3 py-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73] ${
                section === id ? 'border-[#247A73] bg-[#247A73] text-white' : 'border-[#D8E0E8] bg-white text-[#17324D] hover:bg-[#E8F3F1]'
            }`}
        >
            {label} <span className={section === id ? 'text-white/80' : 'text-[#607184]'}>{count}</span>
        </button>
    );

    const sectionName = section === 'all' ? null : sections.find((s) => s.id === section)?.name;

    return (
        <AppLayout
            title="Students"
            description="Student profiles and enrollment for each school year."
            actions={
                <>
                    <Button variant="outline" onClick={() => window.print()} className="border-[#D8E0E8] bg-white text-[#17324D] hover:bg-[#E8F3F1] print:hidden">
                        <Printer className="mr-2 size-4" aria-hidden />Print list
                    </Button>
                    <Button onClick={openAdd} disabled={!canAdd} className="bg-[#247A73] text-white hover:bg-[#1d6560] print:hidden">
                        <UserPlus className="mr-2 size-4" aria-hidden />Add student
                    </Button>
                </>
            }
        >
            <Head title="Students" />

            {/* Print-only heading */}
            <div className="mb-4 hidden print:block">
                <h2 className="text-xl font-semibold text-[#17324D]">Class List</h2>
                <p className="text-sm text-[#607184]">S.Y. {yearLabel}{sectionName ? ` · ${sectionName}` : ''} · {rows.length} students</p>
            </div>

            {academicYears.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#D8E0E8] bg-white p-10 text-center">
                    <GraduationCap className="mx-auto size-8 text-[#607184]" aria-hidden />
                    <p className="mt-2 font-medium text-[#17324D]">Set up a school year first</p>
                    <p className="mt-1 text-sm text-[#607184]">Students are enrolled in a section for each school year. Add a school year, grade level and section in Settings.</p>
                    <Button asChild className="mt-4 bg-[#247A73] text-white hover:bg-[#1d6560]"><Link href="/settings">Open Settings</Link></Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 print:hidden">
                        <StatTile icon={Users} label="Enrolled" value={counts.enrolled} hint={`S.Y. ${yearLabel}`} />
                        <StatTile icon={GraduationCap} label="Active" value={counts.active} hint="Currently attending" tone="#1F6B4B" toneBg="#E3F3EA" />
                        <StatTile icon={UserX} label="Inactive or transferred" value={counts.away} hint="Kept for records" tone="#8A5F12" toneBg="#FBF1DB" />
                        <StatTile icon={Archive} label="Archived" value={counts.archived} hint="Hidden from lists" tone="#4A5B6E" toneBg="#EEF2F6" />
                    </div>

                    {isPastYear && (
                        <p className="rounded-md border border-[#E6B85C] bg-[#FBF1DB] px-3 py-2 text-sm text-[#6F4B0E] print:hidden">
                            You are viewing a past school year. Records are kept for history.
                        </p>
                    )}

                    {yearId !== null && sections.length === 0 && (
                        <p className="rounded-md border border-[#E6B85C] bg-[#FBF1DB] px-3 py-2 text-sm text-[#6F4B0E] print:hidden">
                            S.Y. {yearLabel} has no sections yet. Add a section in <Link href="/settings" className="font-medium underline">Settings</Link> before adding students.
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 print:hidden">
                        <div className="w-full sm:w-44">
                            <label htmlFor="st-year" className="sr-only">School year</label>
                            <select id="st-year" className={selectCls} value={yearId ?? ''} onChange={(e) => changeYear(Number(e.target.value))}>
                                {academicYears.map((y) => <option key={y.id} value={y.id}>S.Y. {y.name}{y.active ? ' (current)' : ''}</option>)}
                            </select>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Label htmlFor="st-search" className="sr-only">Search students</Label>
                            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-[#607184]" aria-hidden />
                            <Input id="st-search" placeholder="Search name or student no." value={search} onChange={(e) => setSearch(e.target.value)} className="border-[#D8E0E8] bg-white pl-9" />
                        </div>
                        <div className="w-full sm:w-40">
                            <label htmlFor="st-status" className="sr-only">Status</label>
                            <select id="st-status" className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="all">All students</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="transferred">Transferred</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 print:hidden" role="group" aria-label="Section">
                        {chip('all', 'All sections', live.length)}
                        {sections.map((s) => chip(s.id, s.name, live.filter((r) => r.enrollment.sectionId === s.id).length))}
                    </div>

                    <p className="text-sm text-[#607184] print:hidden" aria-live="polite">Showing {rows.length} of {yearRows.length} students</p>

                    {rows.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[#D8E0E8] bg-white p-10 text-center">
                            <Users className="mx-auto size-8 text-[#607184]" aria-hidden />
                            <p className="mt-2 font-medium text-[#17324D]">{yearRows.length === 0 ? `No students in S.Y. ${yearLabel}` : 'No students match your search'}</p>
                            <p className="mt-1 text-sm text-[#607184]">{yearRows.length === 0 ? 'Add a student to start this school year’s class list.' : 'Try another name or clear the filters.'}</p>
                            <div className="mt-4 flex justify-center gap-2">
                                {hasFilters && <Button variant="outline" className="border-[#D8E0E8]" onClick={clear}>Clear filters</Button>}
                                {canAdd && <Button onClick={openAdd} className="bg-[#247A73] text-white hover:bg-[#1d6560]"><UserPlus className="mr-2 size-4" aria-hidden />Add student</Button>}
                            </div>
                        </div>
                    ) : (
                        <>
                            <StudentTable rows={rows} handlers={handlers} />
                            <StudentCards rows={rows} handlers={handlers} />
                        </>
                    )}
                </div>
            )}

            {form.open && (
                <StudentDialog
                    key={form.key}
                    open
                    onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
                    initial={form.student}
                    yearLabel={yearLabel}
                    sectionOptions={sections}
                    enrollment={editingEnrollment}
                    onSave={save}
                    serverErrors={serverErrors}
                    processing={busy}
                />
            )}

            {viewing && (
                <ProfileDialog
                    key={viewing.id}
                    student={viewing}
                    history={history[viewing.id] ?? []}
                    attendance={attendance[viewing.id]}
                    yearId={yearId}
                    yearLabel={yearLabel}
                    isCurrentYear={yearId === activeId}
                    onClose={() => setViewId(null)}
                    onEdit={handlers.onEdit}
                    onArchive={handlers.onArchive}
                    onRestore={restoreStudent}
                />
            )}

            <Dialog open={!!toArchive} onOpenChange={(o) => !o && setToArchive(null)}>
                <DialogContent className="border-[#D8E0E8] bg-white text-[#17324D] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Archive this student?</DialogTitle>
                        <DialogDescription className="text-[#607184]">
                            {toArchive && `${fullName(toArchive)} will be hidden from your lists. Attendance, grades and enrollment history are kept, and you can restore the student any time.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" className="border-[#D8E0E8]" onClick={() => setToArchive(null)}>Cancel</Button>
                        <Button onClick={confirmArchive} disabled={busy} className="bg-[#C65353] text-white hover:bg-[#b04545]">
                            {busy && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />}Archive
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}