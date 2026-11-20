import { Head } from '@inertiajs/react';
import {
    ArrowLeft, Copy, Eye, FilePlus2, FileText, Paperclip, Pencil, Printer, Search, Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { initialPlans, resources } from '@/data/lessonPlansSample';
import { sections, subjects } from '@/data/scheduleSample';
import AppLayout from '@/layouts/AppLayout';

/* Theme: Navy #17324D | Teal #247A73 | Mint #E8F3F1 | Border #D8E0E8 | Gray #607184 | Danger #C65353 */

/* ---------- helpers ---------- */

const subjectOf = (id) => subjects.find((s) => s.id === id) ?? subjects[0];
const resourceOf = (id) => resources.find((r) => r.id === id);

const parseISO = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
};
const toISO = (date) => date.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
const formatDate = (iso) =>
    parseISO(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const formatLong = (iso) =>
    parseISO(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const addDays = (iso, n) => {
    const d = parseISO(iso);
    d.setDate(d.getDate() + n);
    return toISO(d);
};

const emptyPlan = () => ({
    id: null, date: toISO(new Date()), subject: '', section: '', topic: '',
    objectives: '', competencies: '', procedures: '', activities: '', assessment: '',
    resourceIds: [], status: 'draft',
});

const selectCls =
    'h-9 w-full rounded-md border border-[#D8E0E8] bg-white px-3 text-sm text-[#17324D] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73]';

const statusStyles = {
    draft:     { label: 'Draft',     bg: '#EEF2F6', fg: '#4A5B6E', dot: '#607184' },
    completed: { label: 'Completed', bg: '#E3F3EA', fg: '#1F6B4B', dot: '#2E8B65' },
};

function StatusBadge({ status }) {
    const s = statusStyles[status];
    return (
        <span
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: s.bg, color: s.fg }}
        >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: s.dot }} aria-hidden />
            {s.label}
        </span>
    );
}

function SubjectChip({ id }) {
    const s = subjectOf(id);
    return (
        <span
            className="inline-block max-w-full truncate rounded px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: s.bg, color: s.fg, borderLeft: `3px solid ${s.border}` }}
        >
            {s.name}
        </span>
    );
}

/* ---------- list ---------- */

function RowActions({ plan, handlers }) {
    const btn = 'size-8 text-[#607184] hover:bg-[#E8F3F1]';
    return (
        <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className={btn} aria-label={`View ${plan.topic}`} onClick={() => handlers.onView(plan)}>
                <Eye className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className={btn} aria-label={`Edit ${plan.topic}`} onClick={() => handlers.onEdit(plan)}>
                <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className={btn} aria-label={`Duplicate ${plan.topic}`} onClick={() => handlers.onDuplicate(plan)}>
                <Copy className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8 text-[#C65353] hover:bg-[#F9E6E6]" aria-label={`Delete ${plan.topic}`} onClick={() => handlers.onDelete(plan)}>
                <Trash2 className="size-4" />
            </Button>
        </div>
    );
}

function PlanTable({ plans, handlers }) {
    return (
        <div className="hidden overflow-x-auto rounded-lg border border-[#D8E0E8] bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-[#D8E0E8] bg-[#F8FAFC] text-[#607184]">
                    <tr>
                        <th scope="col" className="px-4 py-3 font-medium">Date</th>
                        <th scope="col" className="px-4 py-3 font-medium">Topic</th>
                        <th scope="col" className="px-4 py-3 font-medium">Section</th>
                        <th scope="col" className="px-4 py-3 font-medium">Files</th>
                        <th scope="col" className="px-4 py-3 font-medium">Status</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium"><span className="sr-only">Actions</span></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E0E8]">
                    {plans.map((p) => (
                        <tr key={p.id} className="hover:bg-[#F4FAF9]">
                            <td className="whitespace-nowrap px-4 py-3 text-[#17324D]">{formatDate(p.date)}</td>
                            <td className="max-w-xs px-4 py-3">
                                <button
                                    type="button"
                                    onClick={() => handlers.onView(p)}
                                    className="block max-w-full truncate rounded text-left font-medium text-[#17324D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73]"
                                >
                                    {p.topic}
                                </button>
                                <div className="mt-1"><SubjectChip id={p.subject} /></div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-[#607184]">{p.section}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-[#607184]">
                                {p.resourceIds.length > 0 ? (
                                    <span className="inline-flex items-center gap-1"><Paperclip className="size-3.5" aria-hidden />{p.resourceIds.length}</span>
                                ) : '—'}
                            </td>
                            <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                            <td className="px-4 py-3"><div className="flex justify-end"><RowActions plan={p} handlers={handlers} /></div></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function PlanCards({ plans, handlers }) {
    return (
        <ul className="space-y-3 md:hidden">
            {plans.map((p) => (
                <li key={p.id} className="rounded-lg border border-[#D8E0E8] bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                        <button type="button" onClick={() => handlers.onView(p)} className="text-left font-medium text-[#17324D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73]">
                            {p.topic}
                        </button>
                        <StatusBadge status={p.status} />
                    </div>
                    <div className="mt-1.5"><SubjectChip id={p.subject} /></div>
                    <p className="mt-2 text-sm text-[#607184]">
                        {formatDate(p.date)} · {p.section}
                        {p.resourceIds.length > 0 && ` · ${p.resourceIds.length} file${p.resourceIds.length > 1 ? 's' : ''}`}
                    </p>
                    <div className="mt-2 flex justify-end border-t border-[#D8E0E8] pt-2"><RowActions plan={p} handlers={handlers} /></div>
                </li>
            ))}
        </ul>
    );
}

function ListScreen({ plans, handlers, onNew }) {
    const [search, setSearch] = useState('');
    const [subject, setSubject] = useState('all');
    const [section, setSection] = useState('all');
    const [status, setStatus] = useState('all');

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return plans
            .filter((p) => (subject === 'all' || p.subject === subject))
            .filter((p) => (section === 'all' || p.section === section))
            .filter((p) => (status === 'all' || p.status === status))
            .filter((p) => !q || p.topic.toLowerCase().includes(q))
            .sort((a, b) => b.date.localeCompare(a.date));
    }, [plans, search, subject, section, status]);

    const drafts = plans.filter((p) => p.status === 'draft').length;
    const hasFilters = search || subject !== 'all' || section !== 'all' || status !== 'all';
    const clear = () => { setSearch(''); setSubject('all'); setSection('all'); setStatus('all'); };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
                <div className="relative w-full sm:w-64">
                    <Label htmlFor="search" className="sr-only">Search lesson plans</Label>
                    <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-[#607184]" aria-hidden />
                    <Input id="search" placeholder="Search by topic" value={search} onChange={(e) => setSearch(e.target.value)} className="border-[#D8E0E8] bg-white pl-9" />
                </div>
                <div className="w-full sm:w-44">
                    <label htmlFor="f-subject" className="sr-only">Subject</label>
                    <select id="f-subject" className={selectCls} value={subject} onChange={(e) => setSubject(e.target.value)}>
                        <option value="all">All subjects</option>
                        {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="w-full sm:w-44">
                    <label htmlFor="f-section" className="sr-only">Section</label>
                    <select id="f-section" className={selectCls} value={section} onChange={(e) => setSection(e.target.value)}>
                        <option value="all">All sections</option>
                        {sections.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div role="group" aria-label="Status" className="inline-flex rounded-md border border-[#D8E0E8] bg-white p-0.5">
                    {[['all', 'All'], ['draft', 'Drafts'], ['completed', 'Completed']].map(([id, label]) => (
                        <button
                            key={id} type="button" aria-pressed={status === id} onClick={() => setStatus(id)}
                            className={`rounded px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73] ${
                                status === id ? 'bg-[#247A73] text-white' : 'text-[#17324D] hover:bg-[#E8F3F1]'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-sm text-[#607184]" aria-live="polite">
                Showing {filtered.length} of {plans.length} plans · {drafts} draft{drafts === 1 ? '' : 's'} to finish
            </p>

            {filtered.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#D8E0E8] bg-white p-10 text-center">
                    <FileText className="mx-auto size-8 text-[#607184]" aria-hidden />
                    <p className="mt-2 font-medium text-[#17324D]">{plans.length === 0 ? 'No lesson plans yet' : 'No plans match your filters'}</p>
                    <p className="mt-1 text-sm text-[#607184]">
                        {plans.length === 0 ? 'Create your first lesson plan to get started.' : 'Try a different search or clear the filters.'}
                    </p>
                    <div className="mt-4 flex justify-center gap-2">
                        {hasFilters && <Button variant="outline" className="border-[#D8E0E8]" onClick={clear}>Clear filters</Button>}
                        <Button onClick={onNew} className="bg-[#247A73] text-white hover:bg-[#1d6560]"><FilePlus2 className="mr-2 size-4" aria-hidden />New lesson plan</Button>
                    </div>
                </div>
            ) : (
                <>
                    <PlanTable plans={filtered} handlers={handlers} />
                    <PlanCards plans={filtered} handlers={handlers} />
                </>
            )}
        </div>
    );
}

/* ---------- editor ---------- */

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

function validate(f) {
    const e = {};
    if (!f.date) e.date = 'Choose a lesson date.';
    if (!f.subject) e.subject = 'Choose a subject.';
    if (!f.section) e.section = 'Choose a section.';
    if (!f.topic.trim()) e.topic = 'Enter the lesson topic.';
    if (f.status === 'completed') {
        if (!f.objectives.trim()) e.objectives = 'Add objectives before marking as completed.';
        if (!f.procedures.trim()) e.procedures = 'Add procedures before marking as completed.';
    }
    return e;
}

function EditorScreen({ initial, onSave, onCancel }) {
    const [form, setForm] = useState(initial);
    const [errors, setErrors] = useState({});
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const toggleResource = (id) =>
        set('resourceIds', form.resourceIds.includes(id) ? form.resourceIds.filter((r) => r !== id) : [...form.resourceIds, id]);

    const submit = (e) => {
        e.preventDefault();
        const errs = validate(form);
        setErrors(errs);
        if (Object.keys(errs).length) {
            toast.error('Please fix the highlighted fields.');
            return;
        }
        onSave({ ...form, topic: form.topic.trim() });
    };

    const ta = 'min-h-28 border-[#D8E0E8] bg-white';

    return (
        <form onSubmit={submit} noValidate className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 rounded-lg border border-[#D8E0E8] bg-white p-4 shadow-sm lg:col-span-2">
                <Field id="topic" label="Topic" error={errors.topic}>
                    <Input id="topic" value={form.topic} onChange={(e) => set('topic', e.target.value)} placeholder="e.g. Adding Unlike Fractions" className="border-[#D8E0E8]" aria-invalid={!!errors.topic} />
                </Field>
                <Field id="objectives" label="Objectives" hint="What should learners be able to do by the end of the lesson?" error={errors.objectives}>
                    <Textarea id="objectives" className={ta} value={form.objectives} onChange={(e) => set('objectives', e.target.value)} />
                </Field>
                <Field id="competencies" label="Competencies" hint="Learning competency from your curriculum guide.">
                    <Textarea id="competencies" className={`${ta} min-h-20`} value={form.competencies} onChange={(e) => set('competencies', e.target.value)} />
                </Field>
                <Field id="procedures" label="Procedures" hint="Step-by-step flow with time per step." error={errors.procedures}>
                    <Textarea id="procedures" className={`${ta} min-h-40`} value={form.procedures} onChange={(e) => set('procedures', e.target.value)} />
                </Field>
                <Field id="activities" label="Activities">
                    <Textarea id="activities" className={`${ta} min-h-20`} value={form.activities} onChange={(e) => set('activities', e.target.value)} />
                </Field>
                <Field id="assessment" label="Assessment" hint="How will you check learning? (quiz, seatwork, oral questions)">
                    <Textarea id="assessment" className={`${ta} min-h-20`} value={form.assessment} onChange={(e) => set('assessment', e.target.value)} />
                </Field>
            </div>

            <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
                <div className="space-y-4 rounded-lg border border-[#D8E0E8] bg-white p-4 shadow-sm">
                    <Field id="date" label="Lesson date" error={errors.date}>
                        <Input id="date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="border-[#D8E0E8]" />
                    </Field>
                    <Field id="subject" label="Subject" error={errors.subject}>
                        <select id="subject" className={selectCls} value={form.subject} onChange={(e) => set('subject', e.target.value)}>
                            <option value="">Select subject</option>
                            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </Field>
                    <Field id="section" label="Section" error={errors.section}>
                        <select id="section" className={selectCls} value={form.section} onChange={(e) => set('section', e.target.value)}>
                            <option value="">Select section</option>
                            {sections.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </Field>
                    <fieldset className="space-y-1.5">
                        <legend className="text-sm font-medium">Status</legend>
                        <div className="inline-flex rounded-md border border-[#D8E0E8] p-0.5">
                            {['draft', 'completed'].map((s) => (
                                <button
                                    key={s} type="button" aria-pressed={form.status === s} onClick={() => set('status', s)}
                                    className={`rounded px-3 py-1.5 text-sm font-medium capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73] ${
                                        form.status === s ? 'bg-[#247A73] text-white' : 'text-[#17324D] hover:bg-[#E8F3F1]'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </fieldset>
                </div>

                <fieldset className="rounded-lg border border-[#D8E0E8] bg-white p-4 shadow-sm">
                    <legend className="px-1 text-sm font-medium">Teaching materials</legend>
                    <ul className="mt-1 max-h-56 space-y-1 overflow-y-auto">
                        {resources.map((r) => (
                            <li key={r.id}>
                                <label className="flex cursor-pointer items-start gap-2 rounded px-1.5 py-1.5 text-sm hover:bg-[#E8F3F1]">
                                    <input
                                        type="checkbox" className="mt-0.5 size-4 accent-[#247A73]"
                                        checked={form.resourceIds.includes(r.id)} onChange={() => toggleResource(r.id)}
                                    />
                                    <span className="min-w-0">
                                        <span className="block truncate text-[#17324D]">{r.title}</span>
                                        <span className="text-xs text-[#607184]">{r.category} · {r.type}</span>
                                    </span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </fieldset>

                <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 border-[#D8E0E8]" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" className="flex-1 bg-[#247A73] text-white hover:bg-[#1d6560]">Save plan</Button>
                </div>
            </div>
        </form>
    );
}

/* ---------- printable view ---------- */

function DocSection({ title, children }) {
    return (
        <section className="break-inside-avoid">
            <h3 className="border-b border-[#D8E0E8] pb-1 text-sm font-semibold uppercase tracking-wide text-[#247A73]">{title}</h3>
            <div className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#17324D]">
                {children?.trim?.() ? children : <span className="text-[#607184]">Not provided.</span>}
            </div>
        </section>
    );
}

function ViewScreen({ plan }) {
    const s = subjectOf(plan.subject);
    const attached = plan.resourceIds.map(resourceOf).filter(Boolean);
    return (
        <article className="mx-auto max-w-3xl space-y-6 rounded-lg border border-[#D8E0E8] bg-white p-6 shadow-sm print:max-w-none print:border-0 print:p-0 print:shadow-none">
            <header className="space-y-3">
                <p className="text-sm font-medium text-[#607184]">Daily Lesson Plan</p>
                <h2 className="text-2xl font-semibold text-[#17324D]">{plan.topic}</h2>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-md bg-[#F8FAFC] p-3 text-sm sm:grid-cols-4 print:bg-transparent print:p-0">
                    <div><dt className="text-xs text-[#607184]">Date</dt><dd className="font-medium">{formatLong(plan.date)}</dd></div>
                    <div><dt className="text-xs text-[#607184]">Subject</dt><dd className="font-medium">{s.name}</dd></div>
                    <div><dt className="text-xs text-[#607184]">Section</dt><dd className="font-medium">{plan.section}</dd></div>
                    <div><dt className="text-xs text-[#607184]">Status</dt><dd className="mt-0.5"><StatusBadge status={plan.status} /></dd></div>
                </dl>
            </header>

            <DocSection title="Objectives">{plan.objectives}</DocSection>
            <DocSection title="Competencies">{plan.competencies}</DocSection>
            <DocSection title="Procedures">{plan.procedures}</DocSection>
            <DocSection title="Activities">{plan.activities}</DocSection>
            <DocSection title="Assessment">{plan.assessment}</DocSection>

            <section className="break-inside-avoid">
                <h3 className="border-b border-[#D8E0E8] pb-1 text-sm font-semibold uppercase tracking-wide text-[#247A73]">Teaching materials</h3>
                {attached.length ? (
                    <ul className="mt-2 space-y-1 text-sm text-[#17324D]">
                        {attached.map((r) => (
                            <li key={r.id} className="flex items-center gap-2">
                                <Paperclip className="size-3.5 text-[#607184]" aria-hidden />{r.title}
                                <span className="text-xs text-[#607184]">({r.type})</span>
                            </li>
                        ))}
                    </ul>
                ) : <p className="mt-2 text-sm text-[#607184]">No materials attached.</p>}
            </section>
        </article>
    );
}

/* ---------- page ---------- */

export default function LessonPlans() {
    const [plans, setPlans] = useState(initialPlans);
    const [screen, setScreen] = useState({ mode: 'list', plan: null, key: 0 });
    const [toDelete, setToDelete] = useState(null);

    const go = (mode, plan = null) => setScreen((s) => ({ mode, plan, key: s.key + 1 }));

    const handlers = {
        onView: (p) => go('view', p),
        onEdit: (p) => go('edit', p),
        onDelete: (p) => setToDelete(p),
        onDuplicate: (p) => {
            const copy = {
                ...p, id: Date.now(), topic: `${p.topic} (copy)`, status: 'draft',
                date: addDays(p.date, 7), resourceIds: [...p.resourceIds],
            };
            setPlans((list) => [...list, copy]);
            toast.success('Plan duplicated as a draft, set one week later.');
            go('edit', copy);
        },
    };

    const save = (plan) => {
        const isNew = plan.id === null;
        const saved = isNew ? { ...plan, id: Date.now() } : plan;
        setPlans((list) => (isNew ? [...list, saved] : list.map((p) => (p.id === saved.id ? saved : p))));
        toast.success(isNew ? 'Lesson plan created.' : 'Lesson plan saved.');
        go('list');
    };

    const confirmDelete = () => {
        setPlans((list) => list.filter((p) => p.id !== toDelete.id));
        toast.success('Lesson plan deleted.');
        setToDelete(null);
    };

    // The editor edits existing plans or a blank one
    const editorInitial = screen.plan ?? emptyPlan();
    const isExisting = screen.plan && plans.some((p) => p.id === screen.plan.id);

    const layoutProps = {
        list: {
            title: 'Lesson Plans',
            description: 'Create, reuse and print your daily lesson plans.',
            actions: (
                <Button onClick={() => go('edit')} className="bg-[#247A73] text-white hover:bg-[#1d6560]">
                    <FilePlus2 className="mr-2 size-4" aria-hidden />New lesson plan
                </Button>
            ),
        },
        edit: {
            title: isExisting ? 'Edit lesson plan' : 'New lesson plan',
            description: 'Draft now and finish later. Mark it completed when it is ready to teach.',
            actions: (
                <Button variant="outline" onClick={() => go('list')} className="border-[#D8E0E8] bg-white text-[#17324D] hover:bg-[#E8F3F1]">
                    <ArrowLeft className="mr-2 size-4" aria-hidden />Back to list
                </Button>
            ),
        },
        view: {
            title: 'Lesson plan',
            description: undefined,
            actions: (
                <>
                    <Button variant="outline" onClick={() => go('list')} className="border-[#D8E0E8] bg-white text-[#17324D] hover:bg-[#E8F3F1] print:hidden">
                        <ArrowLeft className="mr-2 size-4" aria-hidden />Back
                    </Button>
                    <Button variant="outline" onClick={() => go('edit', screen.plan)} className="border-[#D8E0E8] bg-white text-[#17324D] hover:bg-[#E8F3F1] print:hidden">
                        <Pencil className="mr-2 size-4" aria-hidden />Edit
                    </Button>
                    <Button onClick={() => window.print()} className="bg-[#247A73] text-white hover:bg-[#1d6560] print:hidden">
                        <Printer className="mr-2 size-4" aria-hidden />Print
                    </Button>
                </>
            ),
        },
    }[screen.mode];

    return (
        <AppLayout {...layoutProps}>
            <Head title="Lesson Plans" />

            {screen.mode === 'list' && (
                <ListScreen plans={plans} handlers={handlers} onNew={() => go('edit')} />
            )}
            {screen.mode === 'edit' && (
                <EditorScreen key={screen.key} initial={editorInitial} onSave={save} onCancel={() => go('list')} />
            )}
            {screen.mode === 'view' && <ViewScreen plan={screen.plan} />}

            <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
                <DialogContent className="border-[#D8E0E8] bg-white text-[#17324D] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete this lesson plan?</DialogTitle>
                        <DialogDescription className="text-[#607184]">
                            {toDelete && `“${toDelete.topic}” will be removed. This cannot be undone.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" className="border-[#D8E0E8]" onClick={() => setToDelete(null)}>Keep it</Button>
                        <Button onClick={confirmDelete} className="bg-[#C65353] text-white hover:bg-[#b04545]">Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}