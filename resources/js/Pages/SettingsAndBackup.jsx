import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle, ArrowRight, Check, Database, Download, FolderOpen, HardDrive, Loader2,
    Lock, Pencil, Plus, RotateCcw, ShieldCheck, Trash2, Upload,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Sample data is now used ONLY by the Profile & preferences and Backup & restore tabs.
import {
    backupFileName, initialBackups, initialPreferences, initialProfile, storageUsage,
} from '@/data/settingsSample';
import AppLayout from '@/layouts/AppLayout';

/* Theme: Navy #17324D | Teal #247A73 | Mint #E8F3F1 | Border #D8E0E8 | Gray #607184
          Warm #E6B85C | Success #2E8B65 | Danger #C65353 */

/* ---------- server routes (change them here if your route keys differ) ---------- */

const R = {
    year:     (y)    => (y ? `/settings/academic-years/${y.id}` : '/settings/academic-years'),
    activate: (y)    => `/settings/academic-years/${y.id}/activate`,
    periods:  (y, p) => `/settings/academic-years/${y.id}/grading-periods${p ? `/${p.id}` : ''}`,
    sections: (y, s) => `/settings/academic-years/${y.id}/sections${s ? `/${s.id}` : ''}`,
    level:    (l)    => (l ? `/settings/grade-levels/${l.id}` : '/settings/grade-levels'),
    subject:  (s)    => (s ? `/settings/subjects/${s.id}` : '/settings/subjects'),
};

/* Server field name -> form field id used in the dialogs */
const FIELD_MAP = { start_date: 'start', end_date: 'end', grade_level_id: 'level' };

/* ---------- helpers ---------- */

const parseISO = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const formatDate = (iso) => parseISO(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const formatStamp = (iso) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const daysSince = (iso) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
const formatBytes = (n) => (n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`);
const ago = (iso) => { const d = daysSince(iso); return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`; };
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const selectCls =
    'h-9 w-full rounded-md border border-[#D8E0E8] bg-white px-3 text-sm text-[#17324D] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73]';

/* ---------- small building blocks ---------- */

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

const noticeTones = {
    warn:    'border-[#E6B85C] bg-[#FBF1DB] text-[#6F4B0E]',
    danger:  'border-[#C65353]/40 bg-[#F9E6E6] text-[#A63F3F]',
    info:    'border-[#D8E0E8] bg-[#E8F3F1] text-[#1B5F59]',
    success: 'border-[#2E8B65]/30 bg-[#E3F3EA] text-[#1F6B4B]',
};

function Notice({ tone = 'warn', icon: Icon = AlertTriangle, children }) {
    return (
        <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${noticeTones[tone]}`}>
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden /><div>{children}</div>
        </div>
    );
}

function Card({ title, description, actions, children }) {
    return (
        <section className="rounded-lg border border-[#D8E0E8] bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h2 className="font-semibold text-[#17324D]">{title}</h2>
                    {description && <p className="mt-0.5 text-sm text-[#607184]">{description}</p>}
                </div>
                {actions}
            </div>
            {children}
        </section>
    );
}

function Switch({ checked, onChange, id, label }) {
    return (
        <button
            type="button" id={id} role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73] focus-visible:ring-offset-2 ${checked ? 'bg-[#247A73]' : 'bg-[#B8C4D0]'}`}
        >
            <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
    );
}

function StatTile({ icon: Icon, label, value, hint, tone = '#247A73', toneBg = '#E8F3F1' }) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-[#D8E0E8] bg-white p-4 shadow-sm">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: toneBg, color: tone }}><Icon className="size-5" aria-hidden /></div>
            <div className="min-w-0">
                <p className="text-2xl font-semibold leading-none text-[#17324D]">{value}</p>
                <p className="mt-1 truncate text-sm font-medium text-[#17324D]">{label}</p>
                <p className="truncate text-xs text-[#607184]">{hint}</p>
            </div>
        </div>
    );
}

/**
 * Generic add / edit dialog driven by a list of fields.
 * `serverErrors` are validation errors returned by Laravel (already mapped to field ids).
 */
function FormDialog({ open, onOpenChange, title, description, fields, initial, submitLabel = 'Save', validate, onSave, serverErrors = {}, processing = false }) {
    const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.id, initial?.[f.id] ?? ''])));
    const [errors, setErrors] = useState({});
    const set = (k, v) => setValues((x) => ({ ...x, [k]: v }));
    const errorFor = (id) => errors[id] ?? serverErrors[id];

    const submit = (e) => {
        e.preventDefault();
        const errs = {};
        fields.forEach((f) => { if (f.required !== false && !String(values[f.id]).trim()) errs[f.id] = `Enter ${f.label.toLowerCase()}.`; });
        if (!Object.keys(errs).length && validate) Object.assign(errs, validate(values));
        setErrors(errs);
        if (Object.keys(errs).length) return;
        onSave(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-[#D8E0E8] bg-white text-[#17324D] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription className="text-[#607184]">{description}</DialogDescription>}
                </DialogHeader>
                <form onSubmit={submit} noValidate className="space-y-4">
                    {fields.map((f) => (
                        <Field key={f.id} id={`fd-${f.id}`} label={f.label} hint={f.hint} error={errorFor(f.id)}>
                            {f.type === 'select' ? (
                                <select
                                    id={`fd-${f.id}`} className={selectCls} value={values[f.id]}
                                    onChange={(e) => set(f.id, f.options.find((o) => String(o.value) === e.target.value)?.value ?? '')}
                                >
                                    <option value="">Select…</option>
                                    {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            ) : (
                                <Input id={`fd-${f.id}`} type={f.type ?? 'text'} value={values[f.id]} placeholder={f.placeholder} onChange={(e) => set(f.id, e.target.value)} className="border-[#D8E0E8]" aria-invalid={!!errorFor(f.id)} />
                            )}
                        </Field>
                    ))}
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" className="border-[#D8E0E8]" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-[#247A73] text-white hover:bg-[#1d6560]">
                            {processing && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />}{submitLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Delete', onConfirm, processing = false }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-[#D8E0E8] bg-white text-[#17324D] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="text-[#607184]">{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" className="border-[#D8E0E8]" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={onConfirm} disabled={processing} className="bg-[#C65353] text-white hover:bg-[#b04545]">
                        {processing && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />}{confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* =====================================================================
   TAB 1: PROFILE & PREFERENCES  (sample data)
   ===================================================================== */

function GeneralTab() {
    const [profile, setProfile] = useState(initialProfile);
    const [profileErrors, setProfileErrors] = useState({});
    const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
    const [pwErrors, setPwErrors] = useState({});
    const [prefs, setPrefs] = useState(initialPreferences);

    const saveProfile = (e) => {
        e.preventDefault();
        const errs = {};
        if (!profile.name.trim()) errs.name = 'Enter your name.';
        if (!isEmail(profile.email)) errs.email = 'Enter a valid email address.';
        setProfileErrors(errs);
        if (!Object.keys(errs).length) toast.success('Profile saved.');
    };

    const changePassword = (e) => {
        e.preventDefault();
        const errs = {};
        if (!pw.current) errs.current = 'Enter your current password.';
        if (pw.next.length < 8) errs.next = 'Use at least 8 characters.';
        if (pw.confirm !== pw.next) errs.confirm = 'The passwords do not match.';
        setPwErrors(errs);
        if (Object.keys(errs).length) return;
        setPw({ current: '', next: '', confirm: '' });
        toast.success('Password changed.');
    };

    const setPref = (k, v) => setPrefs((p) => ({ ...p, [k]: v }));
    const savePrefs = (e) => {
        e.preventDefault();
        if (Number(prefs.timetableEnd) <= Number(prefs.timetableStart)) { toast.error('The timetable must end after it starts.'); return; }
        toast.success('Preferences saved.');
    };

    const hours = Array.from({ length: 17 }, (_, i) => i + 5); // 5..21
    const hourLabel = (h) => (prefs.timeFormat === '24h' ? `${String(h).padStart(2, '0')}:00` : `${h % 12 || 12}:00 ${h >= 12 ? 'PM' : 'AM'}`);

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Profile" description="The account you use to sign in on this computer.">
                <form onSubmit={saveProfile} noValidate className="space-y-4">
                    <Field id="p-name" label="Name" error={profileErrors.name}>
                        <Input id="p-name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="border-[#D8E0E8]" />
                    </Field>
                    <Field id="p-email" label="Email (used to sign in)" error={profileErrors.email}>
                        <Input id="p-email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="border-[#D8E0E8]" />
                    </Field>
                    <Button type="submit" className="bg-[#247A73] text-white hover:bg-[#1d6560]">Save profile</Button>
                </form>
            </Card>

            <Card title="Change password" description="Use a password you do not use anywhere else.">
                <form onSubmit={changePassword} noValidate className="space-y-4">
                    <Field id="pw-current" label="Current password" error={pwErrors.current}>
                        <Input id="pw-current" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className="border-[#D8E0E8]" />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field id="pw-new" label="New password" hint="At least 8 characters." error={pwErrors.next}>
                            <Input id="pw-new" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className="border-[#D8E0E8]" />
                        </Field>
                        <Field id="pw-confirm" label="Confirm new password" error={pwErrors.confirm}>
                            <Input id="pw-confirm" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} className="border-[#D8E0E8]" />
                        </Field>
                    </div>
                    <Button type="submit" variant="outline" className="border-[#D8E0E8]">Change password</Button>
                </form>
            </Card>

            <div className="lg:col-span-2">
                <Card title="Preferences" description="How the app looks and behaves for you.">
                    <form onSubmit={savePrefs} noValidate className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            <Field id="pr-school" label="School name" hint="Shown on printed lists and reports.">
                                <Input id="pr-school" value={prefs.schoolName} onChange={(e) => setPref('schoolName', e.target.value)} className="border-[#D8E0E8]" />
                            </Field>
                            <Field id="pr-title" label="Position on printouts">
                                <Input id="pr-title" value={prefs.teacherTitle} onChange={(e) => setPref('teacherTitle', e.target.value)} className="border-[#D8E0E8]" />
                            </Field>
                            <Field id="pr-landing" label="Open this page after sign-in">
                                <select id="pr-landing" className={selectCls} value={prefs.landing} onChange={(e) => setPref('landing', e.target.value)}>
                                    <option value="dashboard">Dashboard</option>
                                    <option value="schedule">Schedule</option>
                                    <option value="attendance">Attendance</option>
                                </select>
                            </Field>
                            <Field id="pr-time" label="Time format">
                                <select id="pr-time" className={selectCls} value={prefs.timeFormat} onChange={(e) => setPref('timeFormat', e.target.value)}>
                                    <option value="12h">12-hour (7:30 AM)</option>
                                    <option value="24h">24-hour (07:30)</option>
                                </select>
                            </Field>
                            <Field id="pr-start" label="Timetable starts at">
                                <select id="pr-start" className={selectCls} value={prefs.timetableStart} onChange={(e) => setPref('timetableStart', e.target.value)}>
                                    {hours.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                                </select>
                            </Field>
                            <Field id="pr-end" label="Timetable ends at">
                                <select id="pr-end" className={selectCls} value={prefs.timetableEnd} onChange={(e) => setPref('timetableEnd', e.target.value)}>
                                    {hours.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                                </select>
                            </Field>
                        </div>

                        <div className="rounded-md bg-[#F8FAFC] p-3">
                            <div className="grid gap-4 sm:grid-cols-[1fr_220px] sm:items-end">
                                <div>
                                    <p className="flex items-center gap-2 text-sm font-medium"><Lock className="size-4 text-[#247A73]" aria-hidden />Lock the app when idle</p>
                                    <p className="mt-0.5 text-xs text-[#607184]">This app holds student records, attendance and grades. Locking after a few idle minutes keeps them private if you step away.</p>
                                </div>
                                <div>
                                    <label htmlFor="pr-lock" className="sr-only">Lock after</label>
                                    <select id="pr-lock" className={selectCls} value={prefs.autoLock} onChange={(e) => setPref('autoLock', e.target.value)}>
                                        <option value="5">After 5 minutes</option>
                                        <option value="15">After 15 minutes</option>
                                        <option value="30">After 30 minutes</option>
                                        <option value="never">Never</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="bg-[#247A73] text-white hover:bg-[#1d6560]">Save preferences</Button>
                    </form>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Card title="Grading setup" description="Grading weights, passing grade, absent-score rule and conversion table.">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="max-w-prose text-sm text-[#607184]">Grading setup lives next to your scores so you can see its effect right away. Open Grades and choose the “Grading setup” tab.</p>
                        <Button asChild variant="outline" className="border-[#D8E0E8]"><Link href="/grades">Open Grades<ArrowRight className="ml-2 size-4" aria-hidden /></Link></Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}

/* =====================================================================
   TAB 2: ACADEMIC SETUP  (real data from SettingsController)
   ===================================================================== */

function RowItem({ title, subtitle, badge, onEdit, onDelete, extra }) {
    return (
        <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
            <div className="min-w-0 flex-1 basis-40">
                <p className="truncate text-sm font-medium text-[#17324D]">{title}{badge}</p>
                {subtitle && <p className="truncate text-xs text-[#607184]">{subtitle}</p>}
            </div>
            {extra}
            <div className="flex gap-0.5">
                {onEdit && <Button variant="ghost" size="icon" className="size-8 text-[#607184] hover:bg-[#E8F3F1]" aria-label={`Edit ${title}`} onClick={onEdit}><Pencil className="size-4" /></Button>}
                {onDelete && <Button variant="ghost" size="icon" className="size-8 text-[#C65353] hover:bg-[#F9E6E6]" aria-label={`Delete ${title}`} onClick={onDelete}><Trash2 className="size-4" /></Button>}
            </div>
        </li>
    );
}

function AcademicTab({ years, periods, levels, sections, subjects }) {
    const activeYear = years.find((y) => y.active) ?? years[0];
    const [selectedId, setSelectedId] = useState(activeYear?.id ?? null);

    const [form, setForm] = useState(null);         // { kind, item, key }
    const [toDelete, setToDelete] = useState(null); // { kind, item }
    const [serverErrors, setServerErrors] = useState({});
    const [busy, setBusy] = useState(false);

    // Falls back to the active year if the selected one no longer exists.
    const year = years.find((y) => y.id === selectedId) ?? activeYear;
    const yearId = year?.id;

    const yearPeriods = (periods[yearId] ?? []).slice().sort((a, b) => a.start.localeCompare(b.start));
    const yearSections = sections.filter((s) => s.year === yearId);
    const levelName = (id) => levels.find((l) => l.id === id)?.name ?? '—';
    const levelOptions = levels.map((l) => ({ value: l.id, label: l.name }));
    const open = (kind, item = null) => { setServerErrors({}); setForm({ kind, item, key: Date.now() }); };

    /** Shared request options: keep scroll, then close / clear state. */
    const reqOpts = (extra = {}) => ({
        preserveScroll: true,
        onStart: () => setBusy(true),
        onFinish: () => setBusy(false),
        ...extra,
    });

    /** Turn Laravel errors into dialog field errors; anything else becomes a toast. */
    const handleErrors = (errs, fieldIds) => {
        const mapped = {};
        const rest = [];
        Object.entries(errs).forEach(([key, msg]) => {
            const id = FIELD_MAP[key] ?? key;
            if (fieldIds.includes(id)) mapped[id] = msg; else rest.push(msg);
        });
        setServerErrors(mapped);
        if (rest.length) toast.error(rest[0]);
    };

    const setActive = (y) => router.patch(R.activate(y), {}, reqOpts());

    const configs = {
        year: {
            title: (e) => (e ? 'Edit school year' : 'Add school year'),
            fields: [
                { id: 'name', label: 'Name', placeholder: '2027–2028' },
                { id: 'start', label: 'Start date', type: 'date' },
                { id: 'end', label: 'End date', type: 'date' },
            ],
            validate: (v) => {
                const errs = {};
                if (v.end <= v.start) errs.end = 'The end date must be after the start date.';
                if (years.some((y) => y.id !== form?.item?.id && y.name.toLowerCase() === v.name.toLowerCase())) errs.name = 'This school year already exists.';
                return errs;
            },
            save: (v, e, o) => {
                const data = { name: v.name, start_date: v.start, end_date: v.end };
                return e ? router.put(R.year(e), data, o) : router.post(R.year(), data, o);
            },
        },
        period: {
            title: (e) => (e ? 'Edit grading period' : 'Add grading period'),
            description: () => `S.Y. ${year?.name}`,
            fields: [
                { id: 'name', label: 'Name', placeholder: '1st Quarter' },
                { id: 'start', label: 'Start date', type: 'date' },
                { id: 'end', label: 'End date', type: 'date' },
            ],
            validate: (v) => {
                const errs = {};
                if (v.end <= v.start) errs.end = 'The end date must be after the start date.';
                else if (v.start < year.start || v.end > year.end) errs.start = `Dates must fall within the school year (${formatDate(year.start)} to ${formatDate(year.end)}).`;
                else {
                    const clash = yearPeriods.find((p) => p.id !== form?.item?.id && v.start <= p.end && p.start <= v.end);
                    if (clash) errs.start = `This overlaps with ${clash.name}.`;
                }
                return errs;
            },
            save: (v, e, o) => {
                const data = { name: v.name, start_date: v.start, end_date: v.end };
                return e ? router.put(R.periods(year, e), data, o) : router.post(R.periods(year), data, o);
            },
        },
        level: {
            title: (e) => (e ? 'Edit grade level' : 'Add grade level'),
            fields: [{ id: 'name', label: 'Name', placeholder: 'Grade 5' }],
            validate: (v) => (levels.some((l) => l.id !== form?.item?.id && l.name.toLowerCase() === v.name.toLowerCase()) ? { name: 'This grade level already exists.' } : {}),
            save: (v, e, o) => {
                const data = { name: v.name };
                return e ? router.put(R.level(e), data, o) : router.post(R.level(), data, o);
            },
        },
        section: {
            title: (e) => (e ? 'Edit section' : 'Add section'),
            description: () => `S.Y. ${year?.name}`,
            fields: [
                { id: 'level', label: 'Grade level', type: 'select', options: levelOptions },
                { id: 'name', label: 'Section name', placeholder: 'Mabini' },
            ],
            validate: (v) => (yearSections.some((s) => s.id !== form?.item?.id && s.level === v.level && s.name.toLowerCase() === v.name.toLowerCase()) ? { name: 'This section already exists for the grade level.' } : {}),
            save: (v, e, o) => {
                const data = { grade_level_id: v.level, name: v.name };
                return e ? router.put(R.sections(year, e), data, o) : router.post(R.sections(year), data, o);
            },
        },
        subject: {
            title: (e) => (e ? 'Edit subject' : 'Add subject'),
            fields: [
                { id: 'level', label: 'Grade level', type: 'select', options: levelOptions },
                { id: 'name', label: 'Subject name', placeholder: 'Mathematics' },
                { id: 'code', label: 'Code (optional)', placeholder: 'MATH4', required: false },
            ],
            validate: (v) => (subjects.some((s) => s.id !== form?.item?.id && s.level === v.level && s.name.toLowerCase() === v.name.toLowerCase()) ? { name: 'This subject already exists for the grade level.' } : {}),
            save: (v, e, o) => {
                const data = { grade_level_id: v.level, name: v.name, code: v.code || null };
                return e ? router.put(R.subject(e), data, o) : router.post(R.subject(), data, o);
            },
        },
    };

    const cfg = form ? configs[form.kind] : null;

    const submit = (values) => {
        setServerErrors({});
        const fieldIds = cfg.fields.map((f) => f.id);
        cfg.save(values, form.item, reqOpts({
            onSuccess: () => setForm(null), // the success toast comes from the server flash message
            onError: (errs) => handleErrors(errs, fieldIds),
        }));
    };

    const requestDelete = (kind, item) => {
        if (kind === 'level') {
            const used = sections.filter((s) => s.level === item.id).length + subjects.filter((s) => s.level === item.id).length;
            if (used) { toast.error(`${item.name} is used by ${used} section${used === 1 ? '' : 's'} or subject${used === 1 ? '' : 's'}. Remove or reassign them first.`); return; }
        }
        setToDelete({ kind, item });
    };

    const confirmDelete = () => {
        const { kind, item } = toDelete;
        const url = {
            period:  () => R.periods(year, item),
            level:   () => R.level(item),
            section: () => R.sections(year, item),
            subject: () => R.subject(item),
        }[kind]();
        router.delete(url, reqOpts({
            onSuccess: () => setToDelete(null),
            onError: (errs) => { setToDelete(null); toast.error(Object.values(errs)[0] ?? 'This item could not be removed.'); },
        }));
    };

    const addBtn = (kind, label, disabled = false) => (
        <Button variant="outline" size="sm" className="border-[#D8E0E8]" disabled={disabled} onClick={() => open(kind)}>
            <Plus className="mr-1.5 size-4" aria-hidden />{label}
        </Button>
    );
    const needsYear = !year;

    return (
        <div className="space-y-4">
            <Card title="School years" description="Records are kept for every school year. Only one year is active at a time." actions={addBtn('year', 'Add school year')}>
                {years.length === 0 ? (
                    <p className="py-4 text-center text-sm text-[#607184]">No school years yet. Add your first school year to start setting up sections and grading periods.</p>
                ) : (
                    <ul className="divide-y divide-[#D8E0E8]">
                        {years.map((y) => (
                            <RowItem
                                key={y.id} title={`S.Y. ${y.name}`} subtitle={`${formatDate(y.start)} to ${formatDate(y.end)}`}
                                badge={y.active ? <span className="ml-2 rounded-full bg-[#E3F3EA] px-2 py-0.5 text-xs font-medium text-[#1F6B4B]">Active</span> : null}
                                extra={!y.active && <Button variant="outline" size="sm" className="border-[#D8E0E8]" disabled={busy} onClick={() => setActive(y)}>Make active</Button>}
                                onEdit={() => open('year', y)}
                            />
                        ))}
                    </ul>
                )}
            </Card>

            {year && (
                <div className="flex flex-wrap items-center gap-3">
                    <label htmlFor="as-year" className="text-sm font-medium text-[#17324D]">Showing school year</label>
                    <div className="w-48">
                        <select id="as-year" className={selectCls} value={yearId} onChange={(e) => setSelectedId(Number(e.target.value))}>
                            {years.map((y) => <option key={y.id} value={y.id}>S.Y. {y.name}{y.active ? ' (active)' : ''}</option>)}
                        </select>
                    </div>
                </div>
            )}

            <Card
                title="Grading periods"
                description={year ? `Quarters for S.Y. ${year.name}. Assessments must fall inside a period.` : 'Add a school year first.'}
                actions={addBtn('period', 'Add period', needsYear)}
            >
                {yearPeriods.length === 0 ? <p className="py-4 text-center text-sm text-[#607184]">No grading periods yet.</p> : (
                    <ul className="divide-y divide-[#D8E0E8]">
                        {yearPeriods.map((p) => <RowItem key={p.id} title={p.name} subtitle={`${formatDate(p.start)} to ${formatDate(p.end)}`} onEdit={() => open('period', p)} onDelete={() => requestDelete('period', p)} />)}
                    </ul>
                )}
            </Card>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card title="Grade levels" actions={addBtn('level', 'Add')}>
                    {levels.length === 0 ? <p className="py-4 text-center text-sm text-[#607184]">No grade levels yet.</p> : (
                        <ul className="divide-y divide-[#D8E0E8]">
                            {levels.map((l) => <RowItem key={l.id} title={l.name} onEdit={() => open('level', l)} onDelete={() => requestDelete('level', l)} />)}
                        </ul>
                    )}
                </Card>
                <Card title="Sections" description={year ? `S.Y. ${year.name}` : undefined} actions={addBtn('section', 'Add', needsYear)}>
                    {yearSections.length === 0 ? <p className="py-4 text-center text-sm text-[#607184]">No sections for this year.</p> : (
                        <ul className="divide-y divide-[#D8E0E8]">
                            {yearSections.map((s) => <RowItem key={s.id} title={`${levelName(s.level)} – ${s.name}`} onEdit={() => open('section', s)} onDelete={() => requestDelete('section', s)} />)}
                        </ul>
                    )}
                </Card>
                <Card title="Subjects" actions={addBtn('subject', 'Add')}>
                    {subjects.length === 0 ? <p className="py-4 text-center text-sm text-[#607184]">No subjects yet.</p> : (
                        <ul className="divide-y divide-[#D8E0E8]">
                            {subjects.map((s) => <RowItem key={s.id} title={s.name} subtitle={`${levelName(s.level)}${s.code ? ` · ${s.code}` : ''}`} onEdit={() => open('subject', s)} onDelete={() => requestDelete('subject', s)} />)}
                        </ul>
                    )}
                </Card>
            </div>

            <p className="text-xs text-[#607184]">Short web addresses (slugs) for these items are created automatically.</p>

            {form && (
                <FormDialog
                    key={form.key} open onOpenChange={(o) => !o && setForm(null)}
                    title={cfg.title(form.item)} description={cfg.description?.()} fields={cfg.fields}
                    initial={form.item} validate={cfg.validate} submitLabel={form.item ? 'Save changes' : 'Add'}
                    onSave={submit} serverErrors={serverErrors} processing={busy}
                />
            )}
            <ConfirmDialog
                open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}
                title="Remove this item?"
                description="Records that use it are kept for history. This only removes it from your setup lists."
                onConfirm={confirmDelete} processing={busy}
            />
        </div>
    );
}

/* =====================================================================
   TAB 3: BACKUP & RESTORE  (sample data)
   ===================================================================== */

function RestoreDialog({ target, onClose, onRestored }) {
    const [password, setPassword] = useState('');
    const [understood, setUnderstood] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(null); // null = not started
    const done = progress !== null && progress >= 100;

    useEffect(() => {
        if (progress === null || progress >= 100) return undefined;
        const t = setTimeout(() => setProgress((p) => Math.min(100, p + 14)), 200);
        return () => clearTimeout(t);
    }, [progress]);

    useEffect(() => { if (done) onRestored(target); }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

    const start = () => {
        if (target.encrypted && !password) { setError('Enter the backup password.'); return; }
        if (!understood) { setError('Confirm that you understand your current data will be replaced.'); return; }
        setError('');
        setProgress(0);
    };

    return (
        <Dialog open onOpenChange={(o) => !o && progress === null && onClose()}>
            <DialogContent className="border-[#D8E0E8] bg-white text-[#17324D] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{done ? 'Restore complete' : 'Restore from backup'}</DialogTitle>
                    <DialogDescription className="text-[#607184]">{target.label}</DialogDescription>
                </DialogHeader>

                {progress === null && (
                    <div className="space-y-4">
                        <Notice tone="danger">
                            Restoring <strong>replaces all current data</strong> with the contents of this backup. Anything recorded after {target.at ? formatStamp(target.at) : 'the backup was made'} will be lost. A safety backup of your current data is created first.
                        </Notice>
                        {target.encrypted && (
                            <Field id="rs-pw" label="Backup password" error={error && !password ? error : ''}>
                                <Input id="rs-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border-[#D8E0E8]" autoComplete="off" />
                            </Field>
                        )}
                        {target.unknownEncryption && (
                            <Field id="rs-pw" label="Backup password (if it has one)">
                                <Input id="rs-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border-[#D8E0E8]" autoComplete="off" />
                            </Field>
                        )}
                        <label className="flex cursor-pointer items-start gap-2 text-sm">
                            <input type="checkbox" className="mt-0.5 size-4 accent-[#247A73]" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />
                            I understand my current data will be replaced.
                        </label>
                        {error && (password || !target.encrypted) && <p className="text-sm text-[#C65353]" role="alert">{error}</p>}
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" className="border-[#D8E0E8]" onClick={onClose}>Cancel</Button>
                            <Button onClick={start} className="bg-[#C65353] text-white hover:bg-[#b04545]"><RotateCcw className="mr-2 size-4" aria-hidden />Restore now</Button>
                        </DialogFooter>
                    </div>
                )}

                {progress !== null && !done && (
                    <div className="space-y-3" aria-live="polite">
                        <p className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin text-[#247A73]" aria-hidden />Restoring your data. Please keep the app open.</p>
                        <div className="h-2 overflow-hidden rounded-full bg-[#E8F3F1]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Restore progress">
                            <div className="h-full rounded-full bg-[#247A73] transition-all" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}

                {done && (
                    <div className="space-y-4">
                        <Notice tone="success" icon={Check}>Your data was restored. In the finished desktop app, the application restarts here so the restored records load.</Notice>
                        <DialogFooter><Button onClick={onClose} className="bg-[#247A73] text-white hover:bg-[#1d6560]">Done</Button></DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function BackupTab() {
    const [backups, setBackups] = useState(initialBackups);
    const [includeFiles, setIncludeFiles] = useState(true);
    const [encrypt, setEncrypt] = useState(true);
    const [pw, setPw] = useState({ password: '', confirm: '' });
    const [pwErrors, setPwErrors] = useState({});
    const [progress, setProgress] = useState(null);
    const [verifying, setVerifying] = useState(null);
    const [auto, setAuto] = useState({ enabled: true, frequency: 'daily', keep: '10' });
    const [restore, setRestore] = useState(null);
    const [toDelete, setToDelete] = useState(null);
    const fileRef = useRef(null);

    const sorted = useMemo(() => backups.slice().sort((a, b) => b.at.localeCompare(a.at)), [backups]);
    const last = sorted[0];
    const verified = backups.some((b) => b.verifiedAt);
    const sinceLast = last ? daysSince(last.at) : null;

    const estSize = storageUsage.database + (includeFiles ? storageUsage.files : 0);

    // Simulated backup progress
    useEffect(() => {
        if (progress === null) return undefined;
        if (progress >= 100) {
            const at = new Date().toISOString();
            setBackups((l) => [...l, { id: Date.now(), kind: 'manual', at, size: estSize, includesFiles: includeFiles, encrypted: encrypt, verifiedAt: null }]);
            setProgress(null);
            setPw({ password: '', confirm: '' });
            toast.success('Backup created. Test it with “Verify” to be sure it can be restored.');
            return undefined;
        }
        const t = setTimeout(() => setProgress((p) => Math.min(100, p + 12)), 180);
        return () => clearTimeout(t);
    }, [progress]); // eslint-disable-line react-hooks/exhaustive-deps

    const createBackup = () => {
        const errs = {};
        if (encrypt) {
            if (pw.password.length < 8) errs.password = 'Use at least 8 characters.';
            if (pw.confirm !== pw.password) errs.confirm = 'The passwords do not match.';
        }
        setPwErrors(errs);
        if (Object.keys(errs).length) return;
        setProgress(0);
    };

    const verify = (b) => {
        setVerifying(b.id);
        setTimeout(() => {
            setBackups((l) => l.map((x) => (x.id === b.id ? { ...x, verifiedAt: new Date().toISOString() } : x)));
            setVerifying(null);
            toast.success('Backup verified. It can be restored.');
        }, 1200);
    };

    const startRestore = (b) => setRestore({
        id: b.id, label: backupFileName(b.at, b.kind === 'safety' ? 'safety' : 'backup'), at: b.at, encrypted: b.encrypted,
    });

    const onFile = (e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        if (!f.name.toLowerCase().endsWith('.ptas')) { toast.error('Choose a .ptas backup file.'); return; }
        setRestore({ id: null, label: f.name, at: null, encrypted: false, unknownEncryption: true });
    };

    const restored = () => {
        const at = new Date().toISOString();
        setBackups((l) => [...l, { id: Date.now(), kind: 'safety', at, size: storageUsage.database, includesFiles: false, encrypted: true, verifiedAt: null }]);
    };

    const kindLabel = { auto: 'Automatic', manual: 'Manual', safety: 'Safety (before restore)' };

    return (
        <div className="space-y-4">
            {!last && <Notice tone="danger">You have no backups yet. Create one now so your records are protected.</Notice>}
            {last && sinceLast > 7 && <Notice tone="warn">Your last backup was {sinceLast} days ago. Create a new one to protect recent work.</Notice>}
            {last && sinceLast <= 7 && !verified && <Notice tone="warn">You have backups, but none has been tested. Use “Verify” on a backup so you know it can be restored.</Notice>}
            {last && sinceLast <= 7 && verified && <Notice tone="success" icon={ShieldCheck}>Last backup {ago(last.at)}, and you have a verified backup.</Notice>}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatTile icon={Database} label="Database" value={formatBytes(storageUsage.database)} hint="Students, grades, plans" />
                <StatTile icon={FolderOpen} label="Teaching files" value={formatBytes(storageUsage.files)} hint="Stored on this computer" tone="#17324D" toneBg="#E6EDF5" />
                <StatTile icon={HardDrive} label="Backups" value={backups.length} hint={formatBytes(backups.reduce((n, b) => n + b.size, 0))} tone="#1F6B4B" toneBg="#E3F3EA" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card title="Create a backup" description="Saves a copy of your records to your backup folder.">
                    <div className="space-y-4">
                        <label className="flex cursor-pointer items-start gap-2 text-sm">
                            <input type="checkbox" className="mt-0.5 size-4 accent-[#247A73]" checked={includeFiles} onChange={(e) => setIncludeFiles(e.target.checked)} disabled={progress !== null} />
                            <span>Include teaching files <span className="text-[#607184]">(adds {formatBytes(storageUsage.files)})</span></span>
                        </label>

                        <div className="space-y-3">
                            <label className="flex cursor-pointer items-start gap-2 text-sm">
                                <input type="checkbox" className="mt-0.5 size-4 accent-[#247A73]" checked={encrypt} onChange={(e) => setEncrypt(e.target.checked)} disabled={progress !== null} />
                                <span>Protect with a password <span className="text-[#607184]">(recommended: backups contain student records)</span></span>
                            </label>
                            {encrypt && (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Field id="bk-pw" label="Password" error={pwErrors.password}>
                                        <Input id="bk-pw" type="password" autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} className="border-[#D8E0E8]" disabled={progress !== null} />
                                    </Field>
                                    <Field id="bk-pw2" label="Confirm password" error={pwErrors.confirm}>
                                        <Input id="bk-pw2" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} className="border-[#D8E0E8]" disabled={progress !== null} />
                                    </Field>
                                    <p className="text-xs text-[#C65353] sm:col-span-2">If you forget this password, the backup cannot be opened. Keep it somewhere safe.</p>
                                </div>
                            )}
                        </div>

                        {progress === null ? (
                            <div className="flex flex-wrap items-center gap-3">
                                <Button onClick={createBackup} className="bg-[#247A73] text-white hover:bg-[#1d6560]"><Download className="mr-2 size-4" aria-hidden />Back up now</Button>
                                <span className="text-xs text-[#607184]">About {formatBytes(estSize)}</span>
                            </div>
                        ) : (
                            <div className="space-y-2" aria-live="polite">
                                <p className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin text-[#247A73]" aria-hidden />Creating backup…</p>
                                <div className="h-2 overflow-hidden rounded-full bg-[#E8F3F1]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Backup progress">
                                    <div className="h-full rounded-full bg-[#247A73] transition-all" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                <Card title="Automatic backups" description="Let the app back up for you in the background.">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <label htmlFor="auto-on" className="text-sm font-medium">Back up automatically</label>
                            <Switch id="auto-on" label="Back up automatically" checked={auto.enabled} onChange={(v) => { setAuto({ ...auto, enabled: v }); toast.success(v ? 'Automatic backups turned on.' : 'Automatic backups turned off.'); }} />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field id="auto-freq" label="How often">
                                <select id="auto-freq" className={selectCls} value={auto.frequency} disabled={!auto.enabled} onChange={(e) => setAuto({ ...auto, frequency: e.target.value })}>
                                    <option value="daily">Every day</option>
                                    <option value="weekly">Every week</option>
                                    <option value="close">When I close the app</option>
                                </select>
                            </Field>
                            <Field id="auto-keep" label="Keep the latest">
                                <select id="auto-keep" className={selectCls} value={auto.keep} disabled={!auto.enabled} onChange={(e) => setAuto({ ...auto, keep: e.target.value })}>
                                    {['5', '10', '20'].map((n) => <option key={n} value={n}>{n} backups</option>)}
                                </select>
                            </Field>
                        </div>
                        <div className="rounded-md bg-[#F8FAFC] p-3">
                            <p className="text-xs text-[#607184]">Backup folder</p>
                            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                                <p className="break-all text-sm font-medium">Documents\PTAS Backups</p>
                                <Button variant="outline" size="sm" className="border-[#D8E0E8]" onClick={() => toast.info('The desktop app opens a folder picker here.')}>Change folder</Button>
                            </div>
                        </div>
                        <p className="text-xs text-[#607184]">Tip: also copy a backup to a USB drive or cloud folder now and then. A backup on the same computer will not help if the computer is lost.</p>
                    </div>
                </Card>
            </div>

            <Card
                title="Backup history"
                description="Newest first."
                actions={
                    <>
                        <input ref={fileRef} type="file" accept=".ptas" className="sr-only" onChange={onFile} aria-label="Choose a backup file to restore" />
                        <Button variant="outline" size="sm" className="border-[#D8E0E8]" onClick={() => fileRef.current?.click()}><Upload className="mr-1.5 size-4" aria-hidden />Restore from file</Button>
                    </>
                }
            >
                {sorted.length === 0 ? (
                    <p className="py-6 text-center text-sm text-[#607184]">No backups yet.</p>
                ) : (
                    <ul className="divide-y divide-[#D8E0E8]">
                        {sorted.map((b) => (
                            <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                                <div className="min-w-0 flex-1 basis-56">
                                    <p className="truncate text-sm font-medium text-[#17324D]">{backupFileName(b.at, b.kind === 'safety' ? 'safety' : 'backup')}</p>
                                    <p className="text-xs text-[#607184]">{formatStamp(b.at)} · {formatBytes(b.size)} · {kindLabel[b.kind]}</p>
                                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                                        <span className="rounded bg-[#EEF2F6] px-2 py-0.5 text-[#4A5B6E]">{b.includesFiles ? 'Records + files' : 'Records only'}</span>
                                        <span className="rounded bg-[#EEF2F6] px-2 py-0.5 text-[#4A5B6E]">{b.encrypted ? 'Password protected' : 'Not protected'}</span>
                                        {b.verifiedAt
                                            ? <span className="rounded bg-[#E3F3EA] px-2 py-0.5 font-medium text-[#1F6B4B]">Verified {ago(b.verifiedAt)}</span>
                                            : <span className="rounded bg-[#FBF1DB] px-2 py-0.5 font-medium text-[#8A5F12]">Not tested</span>}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <Button variant="outline" size="sm" className="border-[#D8E0E8]" disabled={verifying === b.id} onClick={() => verify(b)}>
                                        {verifying === b.id ? <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden /> : <ShieldCheck className="mr-1.5 size-4" aria-hidden />}Verify
                                    </Button>
                                    <Button variant="outline" size="sm" className="border-[#D8E0E8]" onClick={() => startRestore(b)}><RotateCcw className="mr-1.5 size-4" aria-hidden />Restore</Button>
                                    <Button variant="ghost" size="icon" className="size-8 text-[#C65353] hover:bg-[#F9E6E6]" aria-label={`Delete backup from ${formatStamp(b.at)}`} onClick={() => setToDelete(b)}><Trash2 className="size-4" /></Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                <p className="mt-3 text-xs text-[#607184]">“Verify” opens the backup and checks that it is complete without changing your current data.</p>
            </Card>

            {restore && <RestoreDialog key={restore.label + (restore.id ?? '')} target={restore} onClose={() => setRestore(null)} onRestored={restored} />}
            <ConfirmDialog
                open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}
                title="Delete this backup?"
                description={toDelete ? `The backup from ${formatStamp(toDelete.at)} will be removed from your backup folder.${backups.length === 1 ? ' It is your only backup.' : ''}` : ''}
                onConfirm={() => { setBackups((l) => l.filter((x) => x.id !== toDelete.id)); setToDelete(null); toast.success('Backup deleted.'); }}
            />
        </div>
    );
}

/* =====================================================================
   PAGE
   ===================================================================== */

export default function Settings({
    academicYears = [],
    gradingPeriods = {},
    gradeLevels = [],
    sections = [],
    subjects = [],
}) {
    const { flash } = usePage().props;
    const [tab, setTab] = useState('general');
    const tabs = [
        { id: 'general', label: 'Profile & preferences' },
        { id: 'academic', label: 'Academic setup' },
        { id: 'backup', label: 'Backup & restore' },
    ];

    // Success messages from the server (back()->with('success', ...)).
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
    }, [flash]);

    return (
        <AppLayout title="Settings & Backup" description="Your account, school year setup and data protection.">
            <Head title="Settings & Backup" />

            <div className="space-y-4">
                <div role="group" aria-label="Settings sections" className="inline-flex flex-wrap rounded-md border border-[#D8E0E8] bg-white p-0.5">
                    {tabs.map((t) => (
                        <button
                            key={t.id} type="button" aria-pressed={tab === t.id} onClick={() => setTab(t.id)}
                            className={`rounded px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73] ${tab === t.id ? 'bg-[#247A73] text-white' : 'text-[#17324D] hover:bg-[#E8F3F1]'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === 'general' && <GeneralTab />}
                {tab === 'academic' && (
                    <AcademicTab
                        years={academicYears} periods={gradingPeriods} levels={gradeLevels}
                        sections={sections} subjects={subjects}
                    />
                )}
                {tab === 'backup' && <BackupTab />}
            </div>
        </AppLayout>
    );
}