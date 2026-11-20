import { Head } from '@inertiajs/react';
import {
    AlertTriangle, BookOpenText, Check, ClipboardCheck, ClipboardList, Clock,
    FileText, FolderOpen, Minus, Pencil, Plus, Search, Trash2,
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
import { sections, subjects } from '@/data/scheduleSample';
import { initialTasks } from '@/data/tasksSample';
import AppLayout from '@/layouts/AppLayout';

/* Theme: Navy #17324D | Teal #247A73 | Mint #E8F3F1 | Border #D8E0E8 | Gray #607184
          Warm #E6B85C | Success #2E8B65 | Warning #C58A2B | Danger #C65353 */

/* ---------- config & helpers ---------- */

const categories = {
    lesson_prep:    { label: 'Lesson prep',    icon: BookOpenText,   bg: '#E8F3F1', fg: '#1B5F59' },
    checking:       { label: 'Checking',       icon: ClipboardCheck, bg: '#E6EDF5', fg: '#17324D' },
    examination:    { label: 'Examination',    icon: FileText,       bg: '#FBF1DB', fg: '#6F4B0E' },
    paperwork:      { label: 'Paperwork',      icon: FolderOpen,     bg: '#EEF2F6', fg: '#4A5B6E' },
    grade_encoding: { label: 'Grade encoding', icon: Pencil,         bg: '#E3F3EA', fg: '#1F6B4B' },
};

const priorities = {
    high:   { label: 'High',   color: '#C65353', rank: 0 },
    medium: { label: 'Medium', color: '#C58A2B', rank: 1 },
    low:    { label: 'Low',    color: '#607184', rank: 2 },
};

const statusStyles = {
    pending:     { label: 'Pending',     bg: '#EEF2F6', fg: '#4A5B6E', dot: '#607184' },
    in_progress: { label: 'In Progress', bg: '#E8F3F1', fg: '#1B5F59', dot: '#247A73' },
    completed:   { label: 'Completed',   bg: '#E3F3EA', fg: '#1F6B4B', dot: '#2E8B65' },
    overdue:     { label: 'Overdue',     bg: '#F9E6E6', fg: '#A63F3F', dot: '#C65353' },
};

const subjectName = (id) => subjects.find((s) => s.id === id)?.name;
const classLabel = (t) => [subjectName(t.subject), t.section].filter(Boolean).join(' · ');

const toISO = (d) => d.toLocaleDateString('en-CA');
const parseISO = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
};
const diffDays = (a, b) => Math.round((parseISO(a) - parseISO(b)) / 86400000);

const effStatus = (t, today) => (t.status !== 'completed' && t.due && t.due < today ? 'overdue' : t.status);

function dueInfo(t, today) {
    if (!t.due) return { label: 'No due date', color: '#607184' };
    const n = diffDays(t.due, today);
    const short = parseISO(t.due).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (t.status === 'completed') return { label: short, color: '#607184' };
    if (n < 0) return { label: `${-n} day${n === -1 ? '' : 's'} overdue`, color: '#A63F3F' };
    if (n === 0) return { label: 'Today', color: '#8A5F12' };
    if (n === 1) return { label: 'Tomorrow', color: '#8A5F12' };
    if (n <= 6) return { label: parseISO(t.due).toLocaleDateString(undefined, { weekday: 'long' }), color: '#607184' };
    return { label: short, color: '#607184' };
}

const fmtStamp = (iso) =>
    new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const sortTasks = (list, today) =>
    [...list].sort((a, b) => {
        const ac = a.status === 'completed' ? 1 : 0;
        const bc = b.status === 'completed' ? 1 : 0;
        if (ac !== bc) return ac - bc;
        const ad = a.due || '9999';
        const bd = b.due || '9999';
        if (ad !== bd) return ad.localeCompare(bd);
        return priorities[a.priority].rank - priorities[b.priority].rank;
    });

const selectCls =
    'h-9 w-full rounded-md border border-[#D8E0E8] bg-white px-3 text-sm text-[#17324D] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73]';

/* ---------- small building blocks ---------- */

function StatusBadge({ status }) {
    const s = statusStyles[status];
    return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: s.bg, color: s.fg }}>
            <span className="size-1.5 rounded-full" style={{ backgroundColor: s.dot }} aria-hidden />
            {s.label}
        </span>
    );
}

function CategoryChip({ category }) {
    const c = categories[category];
    const Icon = c.icon;
    return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: c.bg, color: c.fg }}>
            <Icon className="size-3" aria-hidden />{c.label}
        </span>
    );
}

function PriorityLabel({ priority }) {
    const p = priorities[priority];
    return (
        <span className="inline-flex items-center gap-1.5 text-sm text-[#17324D]">
            <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />{p.label}
        </span>
    );
}

function ProgressBar({ value, total, label }) {
    const pct = total ? Math.round((value / total) * 100) : 0;
    return (
        <div className="h-2 overflow-hidden rounded-full bg-[#E8F3F1]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
            <div className="h-full rounded-full bg-[#247A73]" style={{ width: `${pct}%` }} />
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

function CompleteButton({ task, onToggle }) {
    const done = task.status === 'completed';
    return (
        <button
            type="button"
            onClick={() => onToggle(task)}
            aria-label={done ? `Reopen ${task.title}` : `Mark ${task.title} as completed`}
            aria-pressed={done}
            className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73] ${
                done ? 'border-[#2E8B65] bg-[#2E8B65] text-white' : 'border-[#B8C4D0] bg-white text-transparent hover:border-[#247A73] hover:text-[#247A73]'
            }`}
        >
            <Check className="size-3.5" aria-hidden />
        </button>
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

/* ---------- all-tasks list ---------- */

function RowActions({ task, handlers }) {
    return (
        <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="size-8 text-[#607184] hover:bg-[#E8F3F1]" aria-label={`Open ${task.title}`} onClick={() => handlers.onOpen(task)}>
                <Clock className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8 text-[#607184] hover:bg-[#E8F3F1]" aria-label={`Edit ${task.title}`} onClick={() => handlers.onEdit(task)}>
                <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8 text-[#C65353] hover:bg-[#F9E6E6]" aria-label={`Delete ${task.title}`} onClick={() => handlers.onDelete(task)}>
                <Trash2 className="size-4" />
            </Button>
        </div>
    );
}

function TaskTable({ tasks, today, handlers }) {
    return (
        <div className="hidden overflow-x-auto rounded-lg border border-[#D8E0E8] bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-[#D8E0E8] bg-[#F8FAFC] text-[#607184]">
                    <tr>
                        <th scope="col" className="w-12 px-4 py-3"><span className="sr-only">Done</span></th>
                        <th scope="col" className="px-2 py-3 font-medium">Task</th>
                        <th scope="col" className="px-4 py-3 font-medium">Priority</th>
                        <th scope="col" className="px-4 py-3 font-medium">Due</th>
                        <th scope="col" className="px-4 py-3 font-medium">Status</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium"><span className="sr-only">Actions</span></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E0E8]">
                    {tasks.map((t) => {
                        const due = dueInfo(t, today);
                        const done = t.status === 'completed';
                        return (
                            <tr key={t.id} className="hover:bg-[#F4FAF9]">
                                <td className="px-4 py-3"><CompleteButton task={t} onToggle={handlers.onToggle} /></td>
                                <td className="max-w-md px-2 py-3">
                                    <button
                                        type="button" onClick={() => handlers.onOpen(t)}
                                        className={`block max-w-full truncate rounded text-left font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73] ${done ? 'text-[#607184] line-through' : 'text-[#17324D]'}`}
                                    >
                                        {t.title}
                                    </button>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <CategoryChip category={t.category} />
                                        {classLabel(t) && <span className="truncate text-xs text-[#607184]">{classLabel(t)}</span>}
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3"><PriorityLabel priority={t.priority} /></td>
                                <td className="whitespace-nowrap px-4 py-3 font-medium" style={{ color: due.color }}>{due.label}</td>
                                <td className="px-4 py-3"><StatusBadge status={effStatus(t, today)} /></td>
                                <td className="px-4 py-3"><div className="flex justify-end"><RowActions task={t} handlers={handlers} /></div></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function TaskCards({ tasks, today, handlers }) {
    return (
        <ul className="space-y-3 md:hidden">
            {tasks.map((t) => {
                const due = dueInfo(t, today);
                const done = t.status === 'completed';
                return (
                    <li key={t.id} className="rounded-lg border border-[#D8E0E8] bg-white p-3 shadow-sm">
                        <div className="flex items-start gap-3">
                            <CompleteButton task={t} onToggle={handlers.onToggle} />
                            <div className="min-w-0 flex-1">
                                <button type="button" onClick={() => handlers.onOpen(t)} className={`text-left font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73] ${done ? 'text-[#607184] line-through' : 'text-[#17324D]'}`}>
                                    {t.title}
                                </button>
                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                    <CategoryChip category={t.category} />
                                    <StatusBadge status={effStatus(t, today)} />
                                </div>
                                <p className="mt-2 text-sm">
                                    <span className="font-medium" style={{ color: due.color }}>{due.label}</span>
                                    <span className="text-[#607184]"> · {priorities[t.priority].label} priority</span>
                                </p>
                                {classLabel(t) && <p className="text-xs text-[#607184]">{classLabel(t)}</p>}
                            </div>
                        </div>
                        <div className="mt-2 flex justify-end border-t border-[#D8E0E8] pt-2"><RowActions task={t} handlers={handlers} /></div>
                    </li>
                );
            })}
        </ul>
    );
}

function AllTasksView({ tasks, today, handlers, onNew }) {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('active');
    const [category, setCategory] = useState('all');
    const [priority, setPriority] = useState('all');

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return sortTasks(
            tasks
                .filter((t) => {
                    const s = effStatus(t, today);
                    if (status === 'active') return t.status !== 'completed';
                    return status === 'all' || s === status;
                })
                .filter((t) => category === 'all' || t.category === category)
                .filter((t) => priority === 'all' || t.priority === priority)
                .filter((t) => !q || t.title.toLowerCase().includes(q)),
            today,
        );
    }, [tasks, today, search, status, category, priority]);

    const hasFilters = search || status !== 'active' || category !== 'all' || priority !== 'all';
    const clear = () => { setSearch(''); setStatus('active'); setCategory('all'); setPriority('all'); };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
                <div className="relative w-full sm:w-64">
                    <Label htmlFor="task-search" className="sr-only">Search tasks</Label>
                    <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-[#607184]" aria-hidden />
                    <Input id="task-search" placeholder="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} className="border-[#D8E0E8] bg-white pl-9" />
                </div>
                <div className="w-full sm:w-40">
                    <label htmlFor="f-status" className="sr-only">Status</label>
                    <select id="f-status" className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="active">Active tasks</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="overdue">Overdue</option>
                        <option value="completed">Completed</option>
                        <option value="all">All statuses</option>
                    </select>
                </div>
                <div className="w-full sm:w-44">
                    <label htmlFor="f-category" className="sr-only">Category</label>
                    <select id="f-category" className={selectCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="all">All categories</option>
                        {Object.entries(categories).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
                    </select>
                </div>
                <div className="w-full sm:w-36">
                    <label htmlFor="f-priority" className="sr-only">Priority</label>
                    <select id="f-priority" className={selectCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
                        <option value="all">Any priority</option>
                        {Object.entries(priorities).map(([id, p]) => <option key={id} value={id}>{p.label}</option>)}
                    </select>
                </div>
            </div>

            <p className="text-sm text-[#607184]" aria-live="polite">Showing {filtered.length} of {tasks.length} tasks</p>

            {filtered.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#D8E0E8] bg-white p-10 text-center">
                    <ClipboardList className="mx-auto size-8 text-[#607184]" aria-hidden />
                    <p className="mt-2 font-medium text-[#17324D]">{tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}</p>
                    <p className="mt-1 text-sm text-[#607184]">{tasks.length === 0 ? 'Add a task to start tracking your work.' : 'Try a different search or clear the filters.'}</p>
                    <div className="mt-4 flex justify-center gap-2">
                        {hasFilters && <Button variant="outline" className="border-[#D8E0E8]" onClick={clear}>Clear filters</Button>}
                        <Button onClick={onNew} className="bg-[#247A73] text-white hover:bg-[#1d6560]"><Plus className="mr-2 size-4" aria-hidden />New task</Button>
                    </div>
                </div>
            ) : (
                <>
                    <TaskTable tasks={filtered} today={today} handlers={handlers} />
                    <TaskCards tasks={filtered} today={today} handlers={handlers} />
                </>
            )}
        </div>
    );
}

/* ---------- overdue view ---------- */

function OverdueView({ tasks, today, handlers }) {
    const list = sortTasks(tasks.filter((t) => effStatus(t, today) === 'overdue'), today);
    if (!list.length) {
        return (
            <div className="rounded-lg border border-dashed border-[#D8E0E8] bg-white p-10 text-center">
                <Check className="mx-auto size-8 text-[#2E8B65]" aria-hidden />
                <p className="mt-2 font-medium text-[#17324D]">Nothing is overdue</p>
                <p className="mt-1 text-sm text-[#607184]">You are on top of your deadlines.</p>
            </div>
        );
    }
    return (
        <div className="space-y-3">
            <p className="text-sm text-[#607184]">{list.length} task{list.length === 1 ? '' : 's'} past the due date. Oldest first.</p>
            <TaskTable tasks={list} today={today} handlers={handlers} />
            <TaskCards tasks={list} today={today} handlers={handlers} />
        </div>
    );
}

/* ---------- checking queue ---------- */

function CheckingQueue({ tasks, today, handlers, onNew }) {
    const queue = sortTasks(tasks.filter((t) => t.category === 'checking' && t.status !== 'completed'), today);

    if (!queue.length) {
        return (
            <div className="rounded-lg border border-dashed border-[#D8E0E8] bg-white p-10 text-center">
                <ClipboardCheck className="mx-auto size-8 text-[#2E8B65]" aria-hidden />
                <p className="mt-2 font-medium text-[#17324D]">All caught up</p>
                <p className="mt-1 text-sm text-[#607184]">No papers are waiting to be checked.</p>
                <Button onClick={onNew} className="mt-4 bg-[#247A73] text-white hover:bg-[#1d6560]"><Plus className="mr-2 size-4" aria-hidden />Add checking task</Button>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {queue.map((t) => {
                const due = dueInfo(t, today);
                const left = Math.max(t.total - t.checked, 0);
                return (
                    <article key={t.id} className="flex flex-col rounded-lg border border-[#D8E0E8] bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <button type="button" onClick={() => handlers.onOpen(t)} className="text-left font-medium text-[#17324D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73]">
                                    {t.title}
                                </button>
                                {classLabel(t) && <p className="mt-0.5 truncate text-xs text-[#607184]">{classLabel(t)}</p>}
                            </div>
                            <StatusBadge status={effStatus(t, today)} />
                        </div>

                        <p className="mt-2 text-sm">
                            <span className="font-medium" style={{ color: due.color }}>{due.label}</span>
                            <span className="text-[#607184]"> · {priorities[t.priority].label} priority</span>
                        </p>

                        <div className="mt-4">
                            <div className="mb-1.5 flex items-baseline justify-between text-sm">
                                <span className="font-medium text-[#17324D]">{t.checked} of {t.total} checked</span>
                                <span className="text-xs text-[#607184]">{left} left</span>
                            </div>
                            <ProgressBar value={t.checked} total={t.total} label={`${t.title} checking progress`} />
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="icon" className="size-9 border-[#D8E0E8]" aria-label={`One fewer paper checked for ${t.title}`} disabled={t.checked <= 0} onClick={() => handlers.onChecked(t, t.checked - 1)}>
                                <Minus className="size-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="size-9 border-[#D8E0E8]" aria-label={`One more paper checked for ${t.title}`} disabled={t.checked >= t.total} onClick={() => handlers.onChecked(t, t.checked + 1)}>
                                <Plus className="size-4" />
                            </Button>
                            <Button onClick={() => handlers.onChecked(t, t.total)} className="ml-auto bg-[#247A73] text-white hover:bg-[#1d6560]">
                                <Check className="mr-1.5 size-4" aria-hidden />All checked
                            </Button>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}

/* ---------- create / edit dialog ---------- */

function TaskFormDialog({ open, onOpenChange, initial, onSave }) {
    const [form, setForm] = useState(
        initial ?? {
            id: null, title: '', description: '', category: 'lesson_prep', priority: 'medium',
            due: '', status: 'pending', subject: '', section: '', checked: 0, total: 0, updates: [],
        },
    );
    const [errors, setErrors] = useState({});
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const isChecking = form.category === 'checking';

    const submit = (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.title.trim()) errs.title = 'Enter a task title.';
        if (!form.due) errs.due = 'Choose a due date.';
        if (isChecking) {
            if (!(Number(form.total) >= 1)) errs.total = 'Enter how many papers to check.';
            else if (Number(form.checked) < 0 || Number(form.checked) > Number(form.total)) errs.checked = 'Checked cannot be more than the total.';
        }
        setErrors(errs);
        if (Object.keys(errs).length) return;
        onSave({
            ...form,
            title: form.title.trim(),
            total: isChecking ? Number(form.total) : 0,
            checked: isChecking ? Number(form.checked) : 0,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-[#D8E0E8] bg-white text-[#17324D] sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{initial ? 'Edit task' : 'New task'}</DialogTitle>
                    <DialogDescription className="text-[#607184]">Track lesson prep, checking, exams, paperwork and encoding.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} noValidate className="space-y-4">
                    <Field id="t-title" label="Title" error={errors.title}>
                        <Input id="t-title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Check Quiz 4" className="border-[#D8E0E8]" aria-invalid={!!errors.title} />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field id="t-category" label="Category">
                            <select id="t-category" className={selectCls} value={form.category} onChange={(e) => set('category', e.target.value)}>
                                {Object.entries(categories).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
                            </select>
                        </Field>
                        <Field id="t-priority" label="Priority">
                            <select id="t-priority" className={selectCls} value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                                {Object.entries(priorities).map(([id, p]) => <option key={id} value={id}>{p.label}</option>)}
                            </select>
                        </Field>
                        <Field id="t-due" label="Due date" error={errors.due}>
                            <Input id="t-due" type="date" value={form.due} onChange={(e) => set('due', e.target.value)} className="border-[#D8E0E8]" />
                        </Field>
                        <Field id="t-status" label="Status">
                            <select id="t-status" className={selectCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </Field>
                        <Field id="t-subject" label="Subject (optional)">
                            <select id="t-subject" className={selectCls} value={form.subject} onChange={(e) => set('subject', e.target.value)}>
                                <option value="">None</option>
                                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </Field>
                        <Field id="t-section" label="Section (optional)">
                            <select id="t-section" className={selectCls} value={form.section} onChange={(e) => set('section', e.target.value)}>
                                <option value="">None</option>
                                {sections.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </Field>
                    </div>

                    {isChecking && (
                        <div className="grid gap-4 rounded-md bg-[#F8FAFC] p-3 sm:grid-cols-2">
                            <Field id="t-total" label="Papers to check" error={errors.total}>
                                <Input id="t-total" type="number" min="1" value={form.total} onChange={(e) => set('total', e.target.value)} className="border-[#D8E0E8] bg-white" />
                            </Field>
                            <Field id="t-checked" label="Already checked" error={errors.checked}>
                                <Input id="t-checked" type="number" min="0" value={form.checked} onChange={(e) => set('checked', e.target.value)} className="border-[#D8E0E8] bg-white" />
                            </Field>
                        </div>
                    )}

                    <Field id="t-desc" label="Notes (optional)">
                        <Textarea id="t-desc" value={form.description} onChange={(e) => set('description', e.target.value)} className="min-h-20 border-[#D8E0E8]" />
                    </Field>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" className="border-[#D8E0E8]" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" className="bg-[#247A73] text-white hover:bg-[#1d6560]">{initial ? 'Save changes' : 'Add task'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/* ---------- details + progress history dialog ---------- */

function DetailDialog({ task, today, onClose, onAddUpdate, onEdit, onDelete }) {
    const [status, setStatus] = useState(task.status);
    const [notes, setNotes] = useState('');
    const due = dueInfo(task, today);
    const history = [...task.updates].sort((a, b) => b.at.localeCompare(a.at));

    const submit = (e) => {
        e.preventDefault();
        if (!notes.trim() && status === task.status) {
            toast.error('Add a note or change the status.');
            return;
        }
        onAddUpdate(task, status, notes.trim());
        setNotes('');
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-[#D8E0E8] bg-white text-[#17324D] sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="pr-6">{task.title}</DialogTitle>
                    <DialogDescription asChild>
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[#607184]">
                            <CategoryChip category={task.category} />
                            <StatusBadge status={effStatus(task, today)} />
                            <span className="text-sm font-medium" style={{ color: due.color }}>Due: {due.label}</span>
                            <span className="text-sm">· {priorities[task.priority].label} priority</span>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                {classLabel(task) && <p className="text-sm text-[#607184]">{classLabel(task)}</p>}
                {task.description && <p className="whitespace-pre-line text-sm leading-relaxed">{task.description}</p>}

                {task.category === 'checking' && task.total > 0 && (
                    <div>
                        <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{task.checked} of {task.total} checked</span></div>
                        <ProgressBar value={task.checked} total={task.total} label="Checking progress" />
                    </div>
                )}

                <form onSubmit={submit} className="space-y-3 rounded-md bg-[#F8FAFC] p-3">
                    <p className="text-sm font-medium">Add a progress note</p>
                    <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                        <div>
                            <label htmlFor="u-status" className="sr-only">Status</label>
                            <select id="u-status" className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="u-notes" className="sr-only">Progress note</label>
                            <Textarea id="u-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did you do? What is left?" className="min-h-16 border-[#D8E0E8] bg-white" />
                        </div>
                    </div>
                    <div className="flex justify-end"><Button type="submit" className="bg-[#247A73] text-white hover:bg-[#1d6560]">Add update</Button></div>
                </form>

                <div>
                    <p className="mb-2 text-sm font-medium">Progress history</p>
                    <ol className="space-y-3 border-l-2 border-[#D8E0E8] pl-4">
                        {history.map((u) => (
                            <li key={u.id} className="relative">
                                <span className="absolute -left-[22px] top-1.5 size-2.5 rounded-full border-2 border-white" style={{ backgroundColor: statusStyles[u.status].dot }} aria-hidden />
                                <div className="flex flex-wrap items-center gap-2">
                                    <StatusBadge status={u.status} />
                                    <span className="text-xs text-[#607184]">{fmtStamp(u.at)}</span>
                                </div>
                                {u.notes && <p className="mt-1 text-sm">{u.notes}</p>}
                            </li>
                        ))}
                    </ol>
                </div>

                <DialogFooter className="gap-2 sm:justify-between sm:gap-0">
                    <Button variant="ghost" className="text-[#C65353] hover:bg-[#F9E6E6]" onClick={() => onDelete(task)}>
                        <Trash2 className="mr-2 size-4" aria-hidden />Delete
                    </Button>
                    <Button variant="outline" className="border-[#D8E0E8]" onClick={() => onEdit(task)}>
                        <Pencil className="mr-2 size-4" aria-hidden />Edit task
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ---------- page ---------- */

export default function Tasks() {
    const today = toISO(new Date());
    const [tasks, setTasks] = useState(initialTasks);
    const [view, setView] = useState('all');
    const [form, setForm] = useState({ open: false, task: null, key: 0 });
    const [openId, setOpenId] = useState(null);
    const [toDelete, setToDelete] = useState(null);

    const openTask = tasks.find((t) => t.id === openId) ?? null;
    const stamp = (status, notes) => ({ id: Date.now() + Math.random(), status, notes, at: new Date().toISOString() });
    const patch = (id, fn) => setTasks((list) => list.map((t) => (t.id === id ? fn(t) : t)));

    const handlers = {
        onOpen: (t) => setOpenId(t.id),
        onEdit: (t) => { setOpenId(null); setForm((f) => ({ open: true, task: t, key: f.key + 1 })); },
        onDelete: (t) => { setOpenId(null); setToDelete(t); },
        onToggle: (t) => {
            const next = t.status === 'completed' ? 'pending' : 'completed';
            patch(t.id, (x) => ({
                ...x, status: next,
                checked: next === 'completed' && x.category === 'checking' ? x.total : x.checked,
                updates: [...x.updates, stamp(next, next === 'completed' ? 'Marked as completed.' : 'Reopened.')],
            }));
            toast.success(next === 'completed' ? 'Task completed.' : 'Task reopened.');
        },
        onChecked: (t, value) => {
            const n = Math.min(Math.max(value, 0), t.total);
            const finished = n === t.total;
            patch(t.id, (x) => ({
                ...x, checked: n,
                status: finished ? 'completed' : n > 0 && x.status === 'pending' ? 'in_progress' : x.status,
                updates: finished ? [...x.updates, stamp('completed', `All ${x.total} papers checked.`)] : x.updates,
            }));
            if (finished) toast.success('All papers checked. Task completed.');
        },
    };

    const addUpdate = (t, status, notes) => {
        patch(t.id, (x) => ({
            ...x, status,
            checked: status === 'completed' && x.category === 'checking' ? x.total : x.checked,
            updates: [...x.updates, stamp(status, notes || `Status changed to ${statusStyles[status].label}.`)],
        }));
        toast.success('Progress note added.');
    };

    const saveTask = (t) => {
        const isNew = t.id === null;
        if (isNew) {
            setTasks((list) => [...list, { ...t, id: Date.now(), updates: [stamp(t.status, 'Task created.')] }]);
        } else {
            patch(t.id, (x) => ({
                ...t,
                updates: t.status !== x.status ? [...x.updates, stamp(t.status, `Status changed to ${statusStyles[t.status].label}.`)] : x.updates,
            }));
        }
        setForm((f) => ({ ...f, open: false }));
        toast.success(isNew ? 'Task added.' : 'Task saved.');
    };

    const confirmDelete = () => {
        setTasks((list) => list.filter((t) => t.id !== toDelete.id));
        toast.success('Task deleted.');
        setToDelete(null);
    };

    const openNew = () => setForm((f) => ({ open: true, task: null, key: f.key + 1 }));

    const stats = useMemo(() => {
        const open = tasks.filter((t) => t.status !== 'completed');
        const overdue = open.filter((t) => effStatus(t, today) === 'overdue');
        const soon = open.filter((t) => t.due && diffDays(t.due, today) >= 0 && diffDays(t.due, today) <= 1);
        const checkingOpen = open.filter((t) => t.category === 'checking');
        const papers = checkingOpen.reduce((n, t) => n + (t.total - t.checked), 0);
        return { open: open.length, overdue: overdue.length, soon: soon.length, checking: checkingOpen.length, papers };
    }, [tasks, today]);

    const views = [
        { id: 'all', label: 'All tasks', count: stats.open },
        { id: 'checking', label: 'Checking queue', count: stats.checking },
        { id: 'overdue', label: 'Overdue', count: stats.overdue },
    ];

    return (
        <AppLayout
            title="Tasks"
            description="Lesson prep, checking, exams, paperwork and deadlines in one place."
            actions={
                <Button onClick={openNew} className="bg-[#247A73] text-white hover:bg-[#1d6560]">
                    <Plus className="mr-2 size-4" aria-hidden />New task
                </Button>
            }
        >
            <Head title="Tasks" />

            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatTile icon={ClipboardList} label="Open tasks" value={stats.open} hint="Not yet completed" />
                    <StatTile icon={AlertTriangle} label="Overdue" value={stats.overdue} hint="Needs attention" tone="#A63F3F" toneBg="#F9E6E6" />
                    <StatTile icon={Clock} label="Due today or tomorrow" value={stats.soon} hint="Coming up next" tone="#8A5F12" toneBg="#FBF1DB" />
                    <StatTile icon={ClipboardCheck} label="Papers to check" value={stats.papers} hint={`${stats.checking} activities in queue`} tone="#17324D" toneBg="#E6EDF5" />
                </div>

                <div role="group" aria-label="Task views" className="inline-flex flex-wrap rounded-md border border-[#D8E0E8] bg-white p-0.5">
                    {views.map((v) => (
                        <button
                            key={v.id} type="button" aria-pressed={view === v.id} onClick={() => setView(v.id)}
                            className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73] ${
                                view === v.id ? 'bg-[#247A73] text-white' : 'text-[#17324D] hover:bg-[#E8F3F1]'
                            }`}
                        >
                            {v.label}
                            <span
                                className={`rounded-full px-1.5 text-xs ${view === v.id ? 'bg-white/20 text-white' : v.id === 'overdue' && v.count > 0 ? 'bg-[#F9E6E6] text-[#A63F3F]' : 'bg-[#EEF2F6] text-[#4A5B6E]'}`}
                            >
                                {v.count}
                            </span>
                        </button>
                    ))}
                </div>

                {view === 'all' && <AllTasksView tasks={tasks} today={today} handlers={handlers} onNew={openNew} />}
                {view === 'checking' && <CheckingQueue tasks={tasks} today={today} handlers={handlers} onNew={openNew} />}
                {view === 'overdue' && <OverdueView tasks={tasks} today={today} handlers={handlers} />}
            </div>

            <TaskFormDialog
                key={form.key}
                open={form.open}
                onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
                initial={form.task}
                onSave={saveTask}
            />

            {openTask && (
                <DetailDialog
                    key={openTask.id}
                    task={openTask}
                    today={today}
                    onClose={() => setOpenId(null)}
                    onAddUpdate={addUpdate}
                    onEdit={handlers.onEdit}
                    onDelete={handlers.onDelete}
                />
            )}

            <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
                <DialogContent className="border-[#D8E0E8] bg-white text-[#17324D] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete this task?</DialogTitle>
                        <DialogDescription className="text-[#607184]">
                            {toDelete && `“${toDelete.title}” and its progress history will be removed. This cannot be undone.`}
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