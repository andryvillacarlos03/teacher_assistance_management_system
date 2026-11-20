import { Head } from '@inertiajs/react';
import {
    AlertTriangle, ArrowLeft, Check, ClipboardCheck, Copy, GraduationCap, Pencil, Plus, Printer,
    Save, Trash2, Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { rosterFor } from '@/data/attendanceSample';
import {
    ASSESSMENT_TYPES, buildInitialGrades, gradeCombos, gradingPeriods,
    initialPolicy, initialSchemes, initialSubjectSchemes,
} from '@/data/gradesSample';
import { subjects } from '@/data/scheduleSample';
import AppLayout from '@/layouts/AppLayout';
import { TYPE_KEYS, computeStudentGrade, schemeIsValid, schemeTotal } from '@/lib/gradeCalc';

/* Theme: Navy #17324D | Teal #247A73 | Mint #E8F3F1 | Border #D8E0E8 | Gray #607184
          Warm #E6B85C | Success #2E8B65 | Danger #C65353 */

/* ---------- helpers ---------- */

const subjectName = (id) => subjects.find((s) => s.id === id)?.name ?? id;
const comboLabel = (c) => `${subjectName(c.subject)} · ${c.section}`;
const fullName = (s) => `${s.lastName}, ${s.firstName}${s.middleName ? ` ${s.middleName[0]}.` : ''}${s.suffix ? ` ${s.suffix}` : ''}`;
const parseISO = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const formatDate = (iso) => parseISO(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const pct1 = (n) => (n === null || n === undefined ? '—' : `${n.toFixed(1)}%`);

const STATUS = {
    scored:  { label: 'Scored',  bg: '#E8F3F1', fg: '#1B5F59' },
    pending: { label: 'Pending', bg: '#EEF2F6', fg: '#4A5B6E' },
    absent:  { label: 'Absent',  bg: '#F9E6E6', fg: '#A63F3F' },
    exempt:  { label: 'Exempt',  bg: '#E6EDF5', fg: '#17324D' },
};

const selectCls =
    'h-9 w-full rounded-md border border-[#D8E0E8] bg-white px-3 text-sm text-[#17324D] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73]';

/* ---------- small building blocks ---------- */

function Pill({ status }) {
    const s = STATUS[status];
    return <span className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: s.bg, color: s.fg }}>{s.label}</span>;
}

function TypeChip({ type }) {
    const t = ASSESSMENT_TYPES[type];
    return <span className="inline-block rounded px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: t.bg, color: t.fg }}>{t.label}</span>;
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
            {error && <p className="text-sm text-[#C65353]">{error}</p>}
        </div>
    );
}

function Notice({ tone = 'warn', icon: Icon = AlertTriangle, children }) {
    const styles = tone === 'warn'
        ? 'border-[#E6B85C] bg-[#FBF1DB] text-[#6F4B0E]'
        : 'border-[#D8E0E8] bg-[#E8F3F1] text-[#1B5F59]';
    return (
        <p className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${styles}`}>
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden /><span>{children}</span>
        </p>
    );
}

/* ---------- assessment dialog ---------- */

function AssessmentDialog({ open, onOpenChange, initial, period, onSave }) {
    const [form, setForm] = useState({
        title: initial?.title ?? '', type: initial?.type ?? 'written_work',
        date: initial?.date ?? '', max: initial?.max ?? '',
    });
    const [errors, setErrors] = useState({});
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const submit = (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.title.trim()) errs.title = 'Enter a title.';
        if (!(Number(form.max) > 0)) errs.max = 'Maximum score must be greater than 0.';
        if (!form.date) errs.date = 'Choose a date.';
        else if (form.date < period.start || form.date > period.end)
            errs.date = `Date must fall within the ${period.name} (${formatDate(period.start)} to ${formatDate(period.end)}).`;
        setErrors(errs);
        if (Object.keys(errs).length) return;
        onSave({ ...form, title: form.title.trim(), max: Number(form.max) });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-[#D8E0E8] bg-white text-[#17324D] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{initial ? 'Edit assessment' : 'New assessment'}</DialogTitle>
                    <DialogDescription className="text-[#607184]">{period.name}</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} noValidate className="space-y-4">
                    <Field id="a-title" label="Title" error={errors.title}>
                        <Input id="a-title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Quiz 3" className="border-[#D8E0E8]" aria-invalid={!!errors.title} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field id="a-type" label="Category">
                            <select id="a-type" className={selectCls} value={form.type} onChange={(e) => set('type', e.target.value)}>
                                {TYPE_KEYS.map((k) => <option key={k} value={k}>{ASSESSMENT_TYPES[k].label}</option>)}
                            </select>
                        </Field>
                        <Field id="a-max" label="Maximum score" error={errors.max}>
                            <Input id="a-max" type="number" min="1" step="any" value={form.max} onChange={(e) => set('max', e.target.value)} className="border-[#D8E0E8]" />
                        </Field>
                    </div>
                    <Field id="a-date" label="Date" error={errors.date}>
                        <Input id="a-date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="border-[#D8E0E8]" />
                    </Field>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" className="border-[#D8E0E8]" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" className="bg-[#247A73] text-white hover:bg-[#1d6560]">{initial ? 'Save changes' : 'Add assessment'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/* ---------- assessments list ---------- */

function AssessmentsView({ assessments, scores, roster, scheme, onScore, onEdit, onDelete, onNew }) {
    const stat = (a) => {
        const c = { scored: 0, pending: 0, absent: 0, exempt: 0, sum: 0 };
        roster.forEach((s) => {
            const r = scores[`${a.id}|${s.id}`];
            const st = r?.status ?? 'pending';
            c[st] += 1;
            if (st === 'scored') c.sum += r.score;
        });
        return { ...c, avg: c.scored ? (c.sum / c.scored / a.max) * 100 : null };
    };

    return (
        <div className="space-y-4">
            {scheme && (
                <p className="text-sm text-[#607184]">
                    Grading scheme: <span className="font-medium text-[#17324D]">{scheme.name}</span> ·{' '}
                    {TYPE_KEYS.map((k) => `${ASSESSMENT_TYPES[k].short} ${scheme.components[k]}%`).join(' · ')}
                </p>
            )}

            {TYPE_KEYS.map((type) => {
                const items = assessments.filter((a) => a.type === type).sort((a, b) => a.date.localeCompare(b.date));
                return (
                    <section key={type} className="rounded-lg border border-[#D8E0E8] bg-white shadow-sm">
                        <div className="flex items-center justify-between gap-3 border-b border-[#D8E0E8] px-4 py-3">
                            <h2 className="font-semibold text-[#17324D]">
                                {ASSESSMENT_TYPES[type].label}
                                {scheme && <span className="ml-2 text-sm font-normal text-[#607184]">{scheme.components[type]}% of grade</span>}
                            </h2>
                            <span className="text-sm text-[#607184]">{items.length} assessment{items.length === 1 ? '' : 's'}</span>
                        </div>

                        {items.length === 0 ? (
                            <div className="px-4 py-6 text-center">
                                <p className="text-sm text-[#607184]">No {ASSESSMENT_TYPES[type].label.toLowerCase()} yet for this period.</p>
                                <Button variant="outline" className="mt-3 border-[#D8E0E8]" onClick={() => onNew(type)}><Plus className="mr-2 size-4" aria-hidden />Add one</Button>
                            </div>
                        ) : (
                            <ul className="divide-y divide-[#D8E0E8]">
                                {items.map((a) => {
                                    const c = stat(a);
                                    return (
                                        <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                                            <div className="min-w-0 flex-1 basis-48">
                                                <button type="button" onClick={() => onScore(a)} className="rounded text-left font-medium text-[#17324D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73]">{a.title}</button>
                                                <p className="text-xs text-[#607184]">{formatDate(a.date)} · max {a.max} pts</p>
                                            </div>
                                            <div className="text-sm text-[#607184]">
                                                <span className="font-medium text-[#17324D]">{c.scored}</span> of {roster.length} scored
                                                {c.pending > 0 && <span className="ml-2 rounded-full bg-[#EEF2F6] px-2 py-0.5 text-xs font-medium text-[#4A5B6E]">{c.pending} pending</span>}
                                                {c.absent > 0 && <span className="ml-2 text-xs">{c.absent} absent</span>}
                                                {c.exempt > 0 && <span className="ml-2 text-xs">{c.exempt} exempt</span>}
                                            </div>
                                            <div className="w-24 text-sm text-[#607184]">Avg {pct1(c.avg)}</div>
                                            <div className="flex items-center gap-1">
                                                <Button size="sm" onClick={() => onScore(a)} className="bg-[#247A73] text-white hover:bg-[#1d6560]"><ClipboardCheck className="mr-1.5 size-4" aria-hidden />Scores</Button>
                                                <Button variant="ghost" size="icon" className="size-8 text-[#607184] hover:bg-[#E8F3F1]" aria-label={`Edit ${a.title}`} onClick={() => onEdit(a)}><Pencil className="size-4" /></Button>
                                                <Button variant="ghost" size="icon" className="size-8 text-[#C65353] hover:bg-[#F9E6E6]" aria-label={`Delete ${a.title}`} onClick={() => onDelete(a)}><Trash2 className="size-4" /></Button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                );
            })}
        </div>
    );
}

/* ---------- score entry ---------- */

function ScoreEntry({ assessment, roster, scores, onSave, onBack, onDirty }) {
    const [rows, setRows] = useState(() =>
        Object.fromEntries(roster.map((s) => {
            const r = scores[`${assessment.id}|${s.id}`];
            return [s.id, { score: r?.status === 'scored' ? String(r.score) : '', flag: r && r.status !== 'scored' ? r.status : '' }];
        })),
    );
    const [showErrors, setShowErrors] = useState(false);

    const touch = () => onDirty(true);
    const setRow = (id, patch) => { setRows((r) => ({ ...r, [id]: { ...r[id], ...patch } })); touch(); };

    const check = (row) => {
        if (row.flag || row.score === '') return null;
        const n = Number(row.score);
        if (Number.isNaN(n)) return 'Enter a number.';
        if (n < 0) return 'Score cannot be negative.';
        if (n > assessment.max) return `Cannot be more than ${assessment.max}.`;
        return null;
    };
    const statusOf = (row) => (row.flag ? row.flag : row.score !== '' ? 'scored' : 'pending');

    const counts = { scored: 0, pending: 0, absent: 0, exempt: 0 };
    let sum = 0; let hi = null; let lo = null;
    roster.forEach((s) => {
        const row = rows[s.id];
        const st = statusOf(row);
        counts[st] += 1;
        if (st === 'scored' && !check(row)) {
            const n = Number(row.score);
            sum += n; hi = hi === null ? n : Math.max(hi, n); lo = lo === null ? n : Math.min(lo, n);
        }
    });
    const avg = counts.scored ? (sum / counts.scored / assessment.max) * 100 : null;

    const save = () => {
        const bad = roster.filter((s) => check(rows[s.id]));
        if (bad.length) { setShowErrors(true); toast.error(`Fix ${bad.length} score${bad.length > 1 ? 's' : ''} before saving.`); return; }
        const next = {};
        roster.forEach((s) => {
            const row = rows[s.id];
            const st = statusOf(row);
            if (st === 'scored') next[s.id] = { status: 'scored', score: Number(row.score) };
            else if (st === 'absent' || st === 'exempt') next[s.id] = { status: st, score: null };
            // pending: no record
        });
        onSave(assessment, next);
    };

    const focusNext = (index) => {
        const next = roster[index + 1];
        if (next) document.getElementById(`score-${next.id}`)?.focus();
    };

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-[#D8E0E8] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <Button variant="ghost" size="sm" className="-ml-2 mb-1 text-[#607184]" onClick={onBack}><ArrowLeft className="mr-1.5 size-4" aria-hidden />Back to assessments</Button>
                        <h2 className="text-lg font-semibold text-[#17324D]">{assessment.title}</h2>
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-[#607184]"><TypeChip type={assessment.type} />{formatDate(assessment.date)} · maximum score {assessment.max}</p>
                    </div>
                    <Button onClick={save} className="bg-[#247A73] text-white hover:bg-[#1d6560]"><Save className="mr-2 size-4" aria-hidden />Save scores</Button>
                </div>
                <ul className="mt-4 flex flex-wrap gap-2 text-sm">
                    {Object.entries(counts).map(([k, v]) => (
                        <li key={k} className="rounded-md px-2.5 py-1" style={{ backgroundColor: STATUS[k].bg, color: STATUS[k].fg }}><span className="font-semibold">{v}</span> {STATUS[k].label}</li>
                    ))}
                    <li className="rounded-md bg-[#F8FAFC] px-2.5 py-1 text-[#607184]">Class average <span className="font-semibold text-[#17324D]">{pct1(avg)}</span></li>
                    {hi !== null && <li className="rounded-md bg-[#F8FAFC] px-2.5 py-1 text-[#607184]">High <span className="font-semibold text-[#17324D]">{hi}</span> · Low <span className="font-semibold text-[#17324D]">{lo}</span></li>}
                </ul>
            </div>

            <Notice tone="info" icon={Check}>Type a score and press Enter to move to the next student. Leave it blank if the paper is not checked yet. Blank scores are never counted as zero.</Notice>

            <div className="overflow-x-auto rounded-lg border border-[#D8E0E8] bg-white shadow-sm">
                <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="border-b border-[#D8E0E8] bg-[#F8FAFC] text-[#607184]">
                        <tr>
                            <th scope="col" className="w-10 px-4 py-3 font-medium">#</th>
                            <th scope="col" className="px-4 py-3 font-medium">Student</th>
                            <th scope="col" className="px-4 py-3 font-medium">Score (out of {assessment.max})</th>
                            <th scope="col" className="px-4 py-3 font-medium">%</th>
                            <th scope="col" className="px-4 py-3 font-medium">Other</th>
                            <th scope="col" className="px-4 py-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D8E0E8]">
                        {roster.map((s, i) => {
                            const row = rows[s.id];
                            const err = check(row);
                            const st = statusOf(row);
                            const n = Number(row.score);
                            return (
                                <tr key={s.id} className="hover:bg-[#F4FAF9]">
                                    <td className="px-4 py-2.5 text-[#607184]">{i + 1}</td>
                                    <td className="px-4 py-2.5 font-medium text-[#17324D]">{fullName(s)}</td>
                                    <td className="px-4 py-2.5">
                                        <label htmlFor={`score-${s.id}`} className="sr-only">Score for {fullName(s)}</label>
                                        <Input
                                            id={`score-${s.id}`} type="number" inputMode="decimal" min="0" max={assessment.max} step="any"
                                            value={row.score} disabled={!!row.flag}
                                            onChange={(e) => setRow(s.id, { score: e.target.value })}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); focusNext(i); } }}
                                            aria-invalid={!!err && showErrors}
                                            className={`h-9 w-28 bg-white ${err ? 'border-[#C65353]' : 'border-[#D8E0E8]'}`}
                                        />
                                        {err && <p className="mt-1 text-xs text-[#C65353]" role="alert">{err}</p>}
                                    </td>
                                    <td className="px-4 py-2.5 text-[#607184]">{st === 'scored' && !err ? `${((n / assessment.max) * 100).toFixed(0)}%` : '—'}</td>
                                    <td className="px-4 py-2.5">
                                        <label htmlFor={`flag-${s.id}`} className="sr-only">Mark {fullName(s)} as absent or exempt</label>
                                        <select
                                            id={`flag-${s.id}`} className={`${selectCls} w-28`} value={row.flag}
                                            onChange={(e) => setRow(s.id, { flag: e.target.value, score: e.target.value ? '' : row.score })}
                                        >
                                            <option value="">—</option>
                                            <option value="absent">Absent</option>
                                            <option value="exempt">Exempt</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-2.5"><Pill status={st} /></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end"><Button onClick={save} className="bg-[#247A73] text-white hover:bg-[#1d6560]"><Save className="mr-2 size-4" aria-hidden />Save scores</Button></div>
        </div>
    );
}

/* ---------- quarterly grades ---------- */

function QuarterlyView({ combo, period, roster, assessments, scores, scheme, policy, conversion, saved, onSaveGrades, onGoSetup }) {
    const [provisional, setProvisional] = useState(false);

    const rows = useMemo(
        () => roster.map((s) => ({
            s,
            g: computeStudentGrade({ studentId: s.id, assessments, scores, scheme, policy, conversion, allowProvisional: provisional }),
        })),
        [roster, assessments, scores, scheme, policy, conversion, provisional],
    );

    if (!scheme || !schemeIsValid(scheme)) {
        return (
            <div className="space-y-3">
                <Notice>
                    {scheme ? `${scheme.name} weights add up to ${schemeTotal(scheme)}%, not 100%.` : 'No grading scheme is assigned to this subject.'} Grades are not computed until this is fixed.
                </Notice>
                <Button variant="outline" className="border-[#D8E0E8]" onClick={onGoSetup}>Open grading setup</Button>
            </div>
        );
    }

    if (assessments.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-[#D8E0E8] bg-white p-10 text-center">
                <GraduationCap className="mx-auto size-8 text-[#607184]" aria-hidden />
                <p className="mt-2 font-medium text-[#17324D]">No assessments for this period yet</p>
                <p className="mt-1 text-sm text-[#607184]">Add assessments and enter scores to see grades here.</p>
            </div>
        );
    }

    const withGrade = rows.filter((r) => r.g.quarterly !== null);
    const final = rows.filter((r) => r.g.state === 'complete');
    const incomplete = rows.filter((r) => r.g.state === 'incomplete').length;
    const below = withGrade.filter((r) => r.g.quarterly < policy.passing).length;
    const grades = withGrade.map((r) => r.g.quarterly);
    const avg = grades.length ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : null;
    const canSave = rows.length > 0 && final.length === rows.length;
    const changed = saved && rows.some((r) => saved.grades[r.s.id] !== r.g.quarterly);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 print:hidden">
                <StatTile icon={GraduationCap} label="Class average" value={avg ?? '—'} hint={`${withGrade.length} of ${rows.length} students graded`} />
                <StatTile icon={Check} label="Highest · lowest" value={grades.length ? `${Math.max(...grades)} · ${Math.min(...grades)}` : '—'} hint="Quarterly grades" tone="#1F6B4B" toneBg="#E3F3EA" />
                <StatTile icon={AlertTriangle} label={`Below ${policy.passing}`} value={below} hint="Needs support" tone="#A63F3F" toneBg="#F9E6E6" />
                <StatTile icon={Users} label="Incomplete" value={incomplete} hint="Missing a component" tone="#8A5F12" toneBg="#FBF1DB" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#17324D]">
                    <input type="checkbox" className="size-4 accent-[#247A73]" checked={provisional} onChange={(e) => setProvisional(e.target.checked)} />
                    Show provisional grades (leave out components with no scores yet)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                    {saved && <span className="text-sm text-[#607184]">{changed ? 'Scores changed since the last save.' : `Saved ${formatDate(saved.at)}.`}</span>}
                    <Button onClick={onSaveGrades} disabled={!canSave} className="bg-[#247A73] text-white hover:bg-[#1d6560]"><Save className="mr-2 size-4" aria-hidden />Save quarterly grades</Button>
                </div>
            </div>
            {!canSave && <p className="text-xs text-[#607184] print:hidden">Quarterly grades can be saved once every student has scores in all three categories and none are pending.</p>}

            <div className="overflow-x-auto rounded-lg border border-[#D8E0E8] bg-white shadow-sm print:border-0 print:shadow-none">
                <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b border-[#D8E0E8] bg-[#F8FAFC] text-[#607184]">
                        <tr>
                            <th scope="col" className="px-4 py-3 font-medium">Student</th>
                            {TYPE_KEYS.map((k) => <th key={k} scope="col" className="px-3 py-3 text-center font-medium">{ASSESSMENT_TYPES[k].short} <span className="font-normal">({scheme.components[k]}%)</span></th>)}
                            <th scope="col" className="px-3 py-3 text-center font-medium">Initial</th>
                            <th scope="col" className="px-3 py-3 text-center font-medium">Quarterly</th>
                            <th scope="col" className="px-4 py-3 font-medium">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D8E0E8]">
                        {rows.map(({ s, g }) => {
                            const low = g.quarterly !== null && g.quarterly < policy.passing;
                            return (
                                <tr key={s.id} className="hover:bg-[#F4FAF9]">
                                    <td className="px-4 py-2.5 font-medium text-[#17324D]">{fullName(s)}</td>
                                    {TYPE_KEYS.map((k) => <td key={k} className="px-3 py-2.5 text-center text-[#17324D]">{pct1(g.pcts[k])}</td>)}
                                    <td className="px-3 py-2.5 text-center text-[#607184]">{g.initial === null ? '—' : g.initial.toFixed(2)}</td>
                                    <td className={`px-3 py-2.5 text-center text-base font-semibold ${low ? 'text-[#A63F3F]' : 'text-[#17324D]'} ${g.state === 'provisional' ? 'italic' : ''}`}>{g.quarterly ?? '—'}</td>
                                    <td className="px-4 py-2.5 text-xs">
                                        {g.state === 'incomplete' && <span className="text-[#8A5F12]">Incomplete: missing {TYPE_KEYS.filter((k) => g.pcts[k] === null).map((k) => ASSESSMENT_TYPES[k].short).join(', ')}</span>}
                                        {g.state === 'provisional' && <span className="text-[#8A5F12]">Provisional{g.pending > 0 ? `: ${g.pending} pending` : ''}</span>}
                                        {g.state === 'complete' && (low ? <span className="font-medium text-[#A63F3F]">Below passing</span> : <span className="text-[#1F6B4B]">Passed</span>)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-[#607184]">
                {scheme.name}. Absent scores are {policy.absent === 'zero' ? 'counted as zero' : 'left out'}; pending scores are never counted as zero.
                Conversion: {conversion.mode === 'table' ? 'conversion table' : 'none (initial grade rounded)'}. Passing grade: {policy.passing}.
            </p>
        </div>
    );
}

/* ---------- grading setup ---------- */

function SetupView({ schemes, setSchemes, subjectSchemes, setSubjectSchemes, policy, setPolicy }) {
    const updateScheme = (id, patch) => setSchemes((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    const setWeight = (id, key, value) =>
        setSchemes((list) => list.map((s) => (s.id === id ? { ...s, components: { ...s.components, [key]: value === '' ? '' : Number(value) } } : s)));
    const usedBy = (id) => Object.values(subjectSchemes).filter((x) => x === id).length;

    const addScheme = () => setSchemes((list) => [...list, { id: Date.now(), name: `New scheme ${list.length + 1}`, components: { ...list[0].components } }]);
    const removeScheme = (s) => {
        setSchemes((list) => list.filter((x) => x.id !== s.id));
        toast.success('Scheme removed.');
    };

    const rows = policy.conversion.rows;
    const setConversion = (patch) => setPolicy((p) => ({ ...p, conversion: { ...p.conversion, ...patch } }));

    return (
        <div className="space-y-6">
            <Notice>
                The weights, passing grade and conversion rule on this page are <strong>samples</strong>. Confirm them against current DepEd guidance and your school’s policy before relying on computed grades. Changes apply right away.
            </Notice>

            <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold text-[#17324D]">Grading schemes</h2>
                    <Button variant="outline" className="border-[#D8E0E8]" onClick={addScheme}><Plus className="mr-2 size-4" aria-hidden />Add scheme</Button>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                    {schemes.map((s) => {
                        const total = schemeTotal(s);
                        const valid = schemeIsValid(s);
                        return (
                            <div key={s.id} className="rounded-lg border border-[#D8E0E8] bg-white p-4 shadow-sm">
                                <div className="flex items-start gap-2">
                                    <div className="flex-1">
                                        <Label htmlFor={`sch-${s.id}`} className="sr-only">Scheme name</Label>
                                        <Input id={`sch-${s.id}`} value={s.name} onChange={(e) => updateScheme(s.id, { name: e.target.value })} className="border-[#D8E0E8] font-medium" />
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-[#C65353] hover:bg-[#F9E6E6]" aria-label={`Delete ${s.name}`} disabled={usedBy(s.id) > 0 || schemes.length === 1} title={usedBy(s.id) > 0 ? 'Assigned to a subject' : 'Delete scheme'} onClick={() => removeScheme(s)}>
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-3">
                                    {TYPE_KEYS.map((k) => (
                                        <div key={k} className="space-y-1.5">
                                            <Label htmlFor={`w-${s.id}-${k}`} className="text-xs">{ASSESSMENT_TYPES[k].label}</Label>
                                            <div className="relative">
                                                <Input id={`w-${s.id}-${k}`} type="number" min="0" max="100" step="any" value={s.components[k]} onChange={(e) => setWeight(s.id, k, e.target.value)} className="border-[#D8E0E8] pr-7" />
                                                <span className="pointer-events-none absolute right-3 top-2 text-sm text-[#607184]">%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className={`mt-3 flex items-center gap-1.5 text-sm ${valid ? 'text-[#1F6B4B]' : 'font-medium text-[#A63F3F]'}`} role={valid ? undefined : 'alert'}>
                                    {valid ? <Check className="size-4" aria-hidden /> : <AlertTriangle className="size-4" aria-hidden />}
                                    {valid ? 'Total is 100%.' : `Total is ${total}%. It must be 100% before grades are computed.`}
                                </p>
                                <p className="mt-1 text-xs text-[#607184]">Used by {usedBy(s.id)} subject{usedBy(s.id) === 1 ? '' : 's'}.</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="space-y-3">
                <h2 className="font-semibold text-[#17324D]">Scheme for each subject</h2>
                <div className="overflow-x-auto rounded-lg border border-[#D8E0E8] bg-white shadow-sm">
                    <table className="w-full min-w-[420px] text-left text-sm">
                        <thead className="border-b border-[#D8E0E8] bg-[#F8FAFC] text-[#607184]">
                            <tr><th scope="col" className="px-4 py-3 font-medium">Subject</th><th scope="col" className="px-4 py-3 font-medium">Grading scheme</th></tr>
                        </thead>
                        <tbody className="divide-y divide-[#D8E0E8]">
                            {subjects.map((sub) => (
                                <tr key={sub.id}>
                                    <td className="px-4 py-2.5 font-medium text-[#17324D]">{sub.name}</td>
                                    <td className="px-4 py-2.5">
                                        <label htmlFor={`ss-${sub.id}`} className="sr-only">Scheme for {sub.name}</label>
                                        <select id={`ss-${sub.id}`} className={`${selectCls} max-w-xs`} value={subjectSchemes[sub.id] ?? ''} onChange={(e) => setSubjectSchemes((m) => ({ ...m, [sub.id]: Number(e.target.value) }))}>
                                            {schemes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="font-semibold text-[#17324D]">Rules</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-4 rounded-lg border border-[#D8E0E8] bg-white p-4 shadow-sm">
                        <Field id="passing" label="Passing grade">
                            <Input id="passing" type="number" min="0" max="100" value={policy.passing} onChange={(e) => setPolicy((p) => ({ ...p, passing: Number(e.target.value) }))} className="w-28 border-[#D8E0E8]" />
                        </Field>
                        <fieldset className="space-y-2">
                            <legend className="text-sm font-medium">When a student is absent for an assessment</legend>
                            {[['excluded', 'Leave the score out of the computation'], ['zero', 'Count it as zero']].map(([v, label]) => (
                                <label key={v} className="flex cursor-pointer items-center gap-2 text-sm">
                                    <input type="radio" name="absent" className="size-4 accent-[#247A73]" checked={policy.absent === v} onChange={() => setPolicy((p) => ({ ...p, absent: v }))} />{label}
                                </label>
                            ))}
                            <p className="text-xs text-[#607184]">Pending scores are never counted as zero. Exempt scores are always left out.</p>
                        </fieldset>
                    </div>

                    <div className="space-y-3 rounded-lg border border-[#D8E0E8] bg-white p-4 shadow-sm">
                        <fieldset className="space-y-2">
                            <legend className="text-sm font-medium">Conversion of the initial grade</legend>
                            {[['none', 'None: use the initial grade, rounded'], ['table', 'Use a conversion table']].map(([v, label]) => (
                                <label key={v} className="flex cursor-pointer items-center gap-2 text-sm">
                                    <input
                                        type="radio" name="conversion" className="size-4 accent-[#247A73]" checked={policy.conversion.mode === v}
                                        onChange={() => setConversion({ mode: v, rows: v === 'table' && rows.length === 0 ? [{ id: 1, from: 0, grade: 60 }, { id: 2, from: 60, grade: 75 }, { id: 3, from: 100, grade: 100 }] : rows })}
                                    />{label}
                                </label>
                            ))}
                        </fieldset>
                        {policy.conversion.mode === 'table' && (
                            <div className="space-y-2">
                                <Notice>Placeholder rows. Replace them with the table your school provides.</Notice>
                                <p className="text-xs text-[#607184]">A student gets the grade of the highest row whose “initial grade from” value is not above their initial grade.</p>
                                <ul className="space-y-2">
                                    {rows.map((r) => (
                                        <li key={r.id} className="flex items-center gap-2">
                                            <label className="sr-only" htmlFor={`cf-${r.id}`}>Initial grade from</label>
                                            <Input id={`cf-${r.id}`} type="number" step="any" value={r.from} onChange={(e) => setConversion({ rows: rows.map((x) => (x.id === r.id ? { ...x, from: e.target.value } : x)) })} className="w-24 border-[#D8E0E8]" />
                                            <span className="text-sm text-[#607184]">and above becomes</span>
                                            <label className="sr-only" htmlFor={`cg-${r.id}`}>Quarterly grade</label>
                                            <Input id={`cg-${r.id}`} type="number" step="any" value={r.grade} onChange={(e) => setConversion({ rows: rows.map((x) => (x.id === r.id ? { ...x, grade: e.target.value } : x)) })} className="w-24 border-[#D8E0E8]" />
                                            <Button variant="ghost" size="icon" className="size-8 text-[#C65353] hover:bg-[#F9E6E6]" aria-label="Remove row" onClick={() => setConversion({ rows: rows.filter((x) => x.id !== r.id) })}><Trash2 className="size-4" /></Button>
                                        </li>
                                    ))}
                                </ul>
                                <Button variant="outline" size="sm" className="border-[#D8E0E8]" onClick={() => setConversion({ rows: [...rows, { id: Date.now(), from: '', grade: '' }] })}><Plus className="mr-1.5 size-4" aria-hidden />Add row</Button>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

/* ---------- page ---------- */

export default function Grades() {
    const initial = useMemo(() => buildInitialGrades(), []);
    const [assessments, setAssessments] = useState(initial.assessments);
    const [scores, setScores] = useState(initial.scores);
    const [schemes, setSchemes] = useState(initialSchemes);
    const [subjectSchemes, setSubjectSchemes] = useState(initialSubjectSchemes);
    const [policy, setPolicy] = useState(initialPolicy);
    const [saved, setSaved] = useState({});

    const [view, setView] = useState('assessments');
    const [periodId, setPeriodId] = useState('q2');
    const [comboKey, setComboKey] = useState(gradeCombos[0].key);
    const [scoringId, setScoringId] = useState(null);
    const [dirty, setDirty] = useState(false);
    const [pending, setPending] = useState(null);
    const [dialog, setDialog] = useState({ open: false, assessment: null, type: 'written_work', key: 0 });
    const [toDelete, setToDelete] = useState(null);

    const combo = gradeCombos.find((c) => c.key === comboKey);
    const period = gradingPeriods.find((p) => p.id === periodId);
    const roster = useMemo(() => rosterFor(combo.section), [combo]);
    const scheme = schemes.find((s) => s.id === subjectSchemes[combo.subject]);
    const list = useMemo(
        () => assessments.filter((a) => a.subject === combo.subject && a.section === combo.section && a.period === periodId),
        [assessments, combo, periodId],
    );
    const scoring = list.find((a) => a.id === scoringId) ?? null;
    const savedKey = `${periodId}|${comboKey}`;

    const guard = (fn) => (dirty ? setPending(() => fn) : fn());
    const leave = (fn) => guard(() => { setScoringId(null); setDirty(false); fn(); });

    const saveAssessment = (data) => {
        const { assessment, key, type } = dialog;
        if (assessment) setAssessments((l) => l.map((a) => (a.id === assessment.id ? { ...a, ...data } : a)));
        else setAssessments((l) => [...l, { id: Date.now(), subject: combo.subject, section: combo.section, period: periodId, ...data }]);
        setDialog({ open: false, assessment: null, type, key });
        toast.success(assessment ? 'Assessment updated.' : 'Assessment added.');
    };

    const confirmDelete = () => {
        const a = toDelete;
        setAssessments((l) => l.filter((x) => x.id !== a.id));
        setScores((s) => Object.fromEntries(Object.entries(s).filter(([k]) => !k.startsWith(`${a.id}|`))));
        setToDelete(null);
        toast.success('Assessment deleted.');
    };

    const saveScores = (assessment, next) => {
        setScores((s) => {
            const rest = Object.fromEntries(Object.entries(s).filter(([k]) => !k.startsWith(`${assessment.id}|`)));
            Object.entries(next).forEach(([sid, rec]) => { rest[`${assessment.id}|${sid}`] = rec; });
            return rest;
        });
        setDirty(false);
        setScoringId(null);
        toast.success('Scores saved.');
    };

    const saveGrades = () => {
        const grades = {};
        roster.forEach((s) => {
            grades[s.id] = computeStudentGrade({ studentId: s.id, assessments: list, scores, scheme, policy, conversion: policy.conversion }).quarterly;
        });
        setSaved((x) => ({ ...x, [savedKey]: { at: new Date().toLocaleDateString('en-CA'), grades } }));
        toast.success(`${period.name} grades saved for ${comboLabel(combo)}.`);
    };

    const views = [
        { id: 'assessments', label: 'Assessments & scores' },
        { id: 'grades', label: 'Quarterly grades' },
        { id: 'setup', label: 'Grading setup' },
    ];
    const showSelectors = view !== 'setup';

    return (
        <AppLayout
            title="Grades"
            description="Record scores and compute quarterly grades with your own grading setup."
            actions={
                view === 'grades' ? (
                    <Button variant="outline" onClick={() => window.print()} className="border-[#D8E0E8] bg-white text-[#17324D] hover:bg-[#E8F3F1] print:hidden"><Printer className="mr-2 size-4" aria-hidden />Print summary</Button>
                ) : view === 'assessments' && !scoring ? (
                    <Button onClick={() => setDialog((d) => ({ open: true, assessment: null, type: 'written_work', key: d.key + 1 }))} className="bg-[#247A73] text-white hover:bg-[#1d6560]"><Plus className="mr-2 size-4" aria-hidden />New assessment</Button>
                ) : null
            }
        >
            <Head title="Grades" />

            <div className="mb-4 hidden print:block">
                <h2 className="text-xl font-semibold text-[#17324D]">Quarterly Grade Summary</h2>
                <p className="text-sm text-[#607184]">{comboLabel(combo)} · {period.name} · S.Y. 2026–2027</p>
            </div>

            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 print:hidden">
                    <div role="group" aria-label="Grades views" className="inline-flex flex-wrap rounded-md border border-[#D8E0E8] bg-white p-0.5">
                        {views.map((v) => (
                            <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => leave(() => setView(v.id))}
                                className={`rounded px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73] ${view === v.id ? 'bg-[#247A73] text-white' : 'text-[#17324D] hover:bg-[#E8F3F1]'}`}>
                                {v.label}
                            </button>
                        ))}
                    </div>

                    {showSelectors && (
                        <>
                            <div className="w-full sm:w-40">
                                <label htmlFor="g-period" className="sr-only">Grading period</label>
                                <select id="g-period" className={selectCls} value={periodId} onChange={(e) => leave(() => setPeriodId(e.target.value))}>
                                    {gradingPeriods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="w-full sm:w-72">
                                <label htmlFor="g-combo" className="sr-only">Subject and section</label>
                                <select id="g-combo" className={selectCls} value={comboKey} onChange={(e) => leave(() => setComboKey(e.target.value))}>
                                    {gradeCombos.map((c) => <option key={c.key} value={c.key}>{comboLabel(c)}</option>)}
                                </select>
                            </div>
                        </>
                    )}
                </div>

                {view === 'assessments' && !scoring && (
                    <AssessmentsView
                        assessments={list} scores={scores} roster={roster} scheme={scheme}
                        onScore={(a) => setScoringId(a.id)}
                        onEdit={(a) => setDialog((d) => ({ open: true, assessment: a, type: a.type, key: d.key + 1 }))}
                        onDelete={setToDelete}
                        onNew={(type) => setDialog((d) => ({ open: true, assessment: null, type, key: d.key + 1 }))}
                    />
                )}
                {view === 'assessments' && scoring && (
                    <ScoreEntry key={scoring.id} assessment={scoring} roster={roster} scores={scores} onSave={saveScores} onDirty={setDirty} onBack={() => guard(() => { setScoringId(null); })} />
                )}
                {view === 'grades' && (
                    <QuarterlyView
                        combo={combo} period={period} roster={roster} assessments={list} scores={scores}
                        scheme={scheme} policy={policy} conversion={policy.conversion}
                        saved={saved[savedKey]} onSaveGrades={saveGrades} onGoSetup={() => setView('setup')}
                    />
                )}
                {view === 'setup' && (
                    <SetupView schemes={schemes} setSchemes={setSchemes} subjectSchemes={subjectSchemes} setSubjectSchemes={setSubjectSchemes} policy={policy} setPolicy={setPolicy} />
                )}
            </div>

            <AssessmentDialog
                key={dialog.key}
                open={dialog.open}
                onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
                initial={dialog.assessment ?? { type: dialog.type }}
                period={period}
                onSave={saveAssessment}
            />

            <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
                <DialogContent className="border-[#D8E0E8] bg-white text-[#17324D] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete this assessment?</DialogTitle>
                        <DialogDescription className="text-[#607184]">{toDelete && `“${toDelete.title}” and all of its scores will be removed. This cannot be undone.`}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" className="border-[#D8E0E8]" onClick={() => setToDelete(null)}>Keep it</Button>
                        <Button onClick={confirmDelete} className="bg-[#C65353] text-white hover:bg-[#b04545]">Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
                <DialogContent className="border-[#D8E0E8] bg-white text-[#17324D] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Discard unsaved scores?</DialogTitle>
                        <DialogDescription className="text-[#607184]">You have scores that are not saved yet. If you continue, they will be lost.</DialogDescription>
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