import { Head } from '@inertiajs/react';
import {
    ExternalLink, FileImage, FileSpreadsheet, FileText, FolderOpen, LayoutGrid, List,
    Paperclip, Pencil, Presentation, Search, Trash2, Upload,
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
import { initialPlans } from '@/data/lessonPlansSample';
import { initialMaterials, materialCategories } from '@/data/materialsSample';
import { subjects } from '@/data/scheduleSample';
import AppLayout from '@/layouts/AppLayout';

/* Theme: Navy #17324D | Teal #247A73 | Mint #E8F3F1 | Border #D8E0E8 | Gray #607184 | Danger #C65353 */

/* ---------- config & helpers ---------- */

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPT = '.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.webp';

const fileTypes = {
    pdf:         { label: 'PDF',          icon: FileText,        bg: '#F9E6E6', fg: '#A63F3F' },
    document:    { label: 'Document',     icon: FileText,        bg: '#E6EDF5', fg: '#17324D' },
    presentation:{ label: 'Presentation', icon: Presentation,    bg: '#FBF1DB', fg: '#6F4B0E' },
    spreadsheet: { label: 'Spreadsheet',  icon: FileSpreadsheet, bg: '#E3F3EA', fg: '#1F6B4B' },
    image:       { label: 'Image',        icon: FileImage,       bg: '#E8F3F1', fg: '#1B5F59' },
};

const typeOfExt = (ext) => {
    const e = ext.toLowerCase();
    if (e === 'pdf') return 'pdf';
    if (['doc', 'docx', 'txt'].includes(e)) return 'document';
    if (['ppt', 'pptx'].includes(e)) return 'presentation';
    if (['xls', 'xlsx', 'csv'].includes(e)) return 'spreadsheet';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(e)) return 'image';
    return null;
};

const extOf = (name) => (name.includes('.') ? name.split('.').pop() : '');
const subjectOf = (id) => subjects.find((s) => s.id === id);

const formatBytes = (n) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};
const parseISO = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
};
const formatDate = (iso) =>
    parseISO(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const todayISO = () => new Date().toLocaleDateString('en-CA');
const prettyTitle = (fileName) =>
    fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
        .replace(/^./, (c) => c.toUpperCase());

const selectCls =
    'h-9 w-full rounded-md border border-[#D8E0E8] bg-white px-3 text-sm text-[#17324D] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73]';

/* ---------- small building blocks ---------- */

function TypeIcon({ ext, size = 'size-12' }) {
    const t = fileTypes[typeOfExt(ext)] ?? fileTypes.document;
    const Icon = t.icon;
    return (
        <div className={`flex ${size} shrink-0 items-center justify-center rounded-lg`} style={{ backgroundColor: t.bg, color: t.fg }} aria-hidden>
            <Icon className="size-1/2" />
        </div>
    );
}

function Chip({ children, bg = '#EEF2F6', fg = '#4A5B6E', border }) {
    return (
        <span
            className="inline-block max-w-full truncate rounded px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: bg, color: fg, ...(border ? { borderLeft: `3px solid ${border}` } : {}) }}
        >
            {children}
        </span>
    );
}

function SubjectChip({ id }) {
    const s = subjectOf(id);
    if (!s) return <Chip>All subjects</Chip>;
    return <Chip bg={s.bg} fg={s.fg} border={s.border}>{s.name}</Chip>;
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

/* ---------- grid + list ---------- */

function ItemActions({ m, handlers }) {
    const btn = 'size-8 text-[#607184] hover:bg-[#E8F3F1]';
    return (
        <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className={btn} aria-label={`Open ${m.title}`} onClick={() => handlers.onOpenFile(m)}>
                <ExternalLink className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className={btn} aria-label={`Edit details of ${m.title}`} onClick={() => handlers.onEdit(m)}>
                <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8 text-[#C65353] hover:bg-[#F9E6E6]" aria-label={`Delete ${m.title}`} onClick={() => handlers.onDelete(m)}>
                <Trash2 className="size-4" />
            </Button>
        </div>
    );
}

function GridView({ items, usage, handlers }) {
    return (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {items.map((m) => (
                <li key={m.id} className="flex flex-col rounded-lg border border-[#D8E0E8] bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <TypeIcon ext={m.ext} />
                        <div className="min-w-0 flex-1">
                            <button
                                type="button" onClick={() => handlers.onDetails(m)}
                                className="block max-w-full truncate rounded text-left font-medium text-[#17324D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73]"
                                title={m.title}
                            >
                                {m.title}
                            </button>
                            <p className="mt-0.5 truncate text-xs text-[#607184]">
                                {fileTypes[typeOfExt(m.ext)]?.label ?? m.ext.toUpperCase()} · {formatBytes(m.size)}
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                        <Chip>{m.category}</Chip>
                        <SubjectChip id={m.subject} />
                    </div>

                    <p className="mb-4 mt-3 line-clamp-2 min-h-10 text-sm text-[#607184]">{m.description}</p>

                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#D8E0E8] pt-3">
                        <p className="flex items-center gap-1 text-xs text-[#607184]">
                            <Paperclip className="size-3.5" aria-hidden />
                            {usage(m).length === 0 ? 'Not attached' : `${usage(m).length} lesson plan${usage(m).length > 1 ? 's' : ''}`}
                        </p>
                        <ItemActions m={m} handlers={handlers} />
                    </div>
                </li>
            ))}
        </ul>
    );
}

function ListView({ items, usage, handlers }) {
    return (
        <div className="overflow-x-auto rounded-lg border border-[#D8E0E8] bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-[#D8E0E8] bg-[#F8FAFC] text-[#607184]">
                    <tr>
                        <th scope="col" className="px-4 py-3 font-medium">File</th>
                        <th scope="col" className="px-4 py-3 font-medium">Category</th>
                        <th scope="col" className="px-4 py-3 font-medium">Subject</th>
                        <th scope="col" className="px-4 py-3 font-medium">Size</th>
                        <th scope="col" className="px-4 py-3 font-medium">Added</th>
                        <th scope="col" className="px-4 py-3 font-medium">Used in</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium"><span className="sr-only">Actions</span></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E0E8]">
                    {items.map((m) => (
                        <tr key={m.id} className="hover:bg-[#F4FAF9]">
                            <td className="max-w-xs px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <TypeIcon ext={m.ext} size="size-9" />
                                    <div className="min-w-0">
                                        <button type="button" onClick={() => handlers.onDetails(m)} className="block max-w-full truncate rounded text-left font-medium text-[#17324D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73]">
                                            {m.title}
                                        </button>
                                        <p className="truncate text-xs text-[#607184]">{m.fileName}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3"><Chip>{m.category}</Chip></td>
                            <td className="px-4 py-3"><SubjectChip id={m.subject} /></td>
                            <td className="whitespace-nowrap px-4 py-3 text-[#607184]">{formatBytes(m.size)}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-[#607184]">{formatDate(m.uploaded)}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-[#607184]">{usage(m).length ? `${usage(m).length} plan${usage(m).length > 1 ? 's' : ''}` : '—'}</td>
                            <td className="px-4 py-3"><div className="flex justify-end"><ItemActions m={m} handlers={handlers} /></div></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ---------- upload / edit dialog ---------- */

function MaterialDialog({ open, onOpenChange, initial, onSave }) {
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [form, setForm] = useState({
        title: initial?.title ?? '', category: initial?.category ?? 'Worksheet',
        subject: initial?.subject ?? '', description: initial?.description ?? '',
    });
    const [errors, setErrors] = useState({});
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const pick = (f) => {
        if (!f) return;
        const ext = extOf(f.name);
        const next = {};
        if (!typeOfExt(ext)) next.file = 'This file type is not supported. Use PDF, Word, PowerPoint, Excel or an image.';
        else if (f.size > MAX_BYTES) next.file = `This file is ${formatBytes(f.size)}. The limit is 25 MB.`;
        setErrors((e) => ({ ...e, file: next.file }));
        if (next.file) { setFile(null); return; }
        setFile(f);
        if (!form.title.trim()) set('title', prettyTitle(f.name));
    };

    const submit = (e) => {
        e.preventDefault();
        const errs = {};
        if (!initial && !file) errs.file = 'Choose a file to upload.';
        if (errors.file && !file && !initial) errs.file = errors.file;
        if (!form.title.trim()) errs.title = 'Enter a title.';
        setErrors(errs);
        if (Object.keys(errs).length) return;

        onSave(
            initial
                ? { ...initial, ...form, title: form.title.trim() }
                : {
                    id: null, ...form, title: form.title.trim(),
                    fileName: file.name, ext: extOf(file.name).toLowerCase(), size: file.size, uploaded: todayISO(),
                },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-[#D8E0E8] bg-white text-[#17324D] sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{initial ? 'Edit material details' : 'Upload material'}</DialogTitle>
                    <DialogDescription className="text-[#607184]">
                        {initial ? 'Change how this file is labelled and organized.' : 'Files are stored on this computer. Maximum size 25 MB.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} noValidate className="space-y-4">
                    {initial ? (
                        <div className="flex items-center gap-3 rounded-md bg-[#F8FAFC] p-3">
                            <TypeIcon ext={initial.ext} size="size-10" />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{initial.fileName}</p>
                                <p className="text-xs text-[#607184]">{formatBytes(initial.size)} · added {formatDate(initial.uploaded)}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <p className="text-sm font-medium">File</p>
                            <label
                                htmlFor="m-file"
                                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
                                className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-center focus-within:ring-2 focus-within:ring-[#247A73] ${
                                    dragging ? 'border-[#247A73] bg-[#E8F3F1]' : 'border-[#D8E0E8] bg-[#F8FAFC] hover:bg-[#E8F3F1]'
                                }`}
                            >
                                <Upload className="size-6 text-[#247A73]" aria-hidden />
                                {file ? (
                                    <>
                                        <span className="max-w-full truncate text-sm font-medium">{file.name}</span>
                                        <span className="text-xs text-[#607184]">{formatBytes(file.size)} · click to choose a different file</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-sm font-medium">Drop a file here or click to browse</span>
                                        <span className="text-xs text-[#607184]">PDF, Word, PowerPoint, Excel or images</span>
                                    </>
                                )}
                                <input id="m-file" type="file" accept={ACCEPT} className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
                            </label>
                            {errors.file && <p className="text-sm text-[#C65353]" role="alert">{errors.file}</p>}
                        </div>
                    )}

                    <Field id="m-title" label="Title" error={errors.title}>
                        <Input id="m-title" value={form.title} onChange={(e) => set('title', e.target.value)} className="border-[#D8E0E8]" aria-invalid={!!errors.title} />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field id="m-category" label="Category">
                            <select id="m-category" className={selectCls} value={form.category} onChange={(e) => set('category', e.target.value)}>
                                {materialCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </Field>
                        <Field id="m-subject" label="Subject">
                            <select id="m-subject" className={selectCls} value={form.subject} onChange={(e) => set('subject', e.target.value)}>
                                <option value="">All subjects</option>
                                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </Field>
                    </div>

                    <Field id="m-desc" label="Description (optional)" hint="A short note helps you find this file later.">
                        <Textarea id="m-desc" value={form.description} onChange={(e) => set('description', e.target.value)} className="min-h-20 border-[#D8E0E8]" />
                    </Field>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" className="border-[#D8E0E8]" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" className="bg-[#247A73] text-white hover:bg-[#1d6560]">{initial ? 'Save changes' : 'Add material'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/* ---------- details + attach to lesson plans ---------- */

function DetailDialog({ material, plans, usage, onClose, onOpenFile, onEdit, onDelete, onAttach, onDetach }) {
    const [planId, setPlanId] = useState('');
    const linked = usage(material);
    const available = plans
        .filter((p) => !p.resourceIds.includes(material.id))
        .sort((a, b) => b.date.localeCompare(a.date));
    const t = fileTypes[typeOfExt(material.ext)];

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-[#D8E0E8] bg-white text-[#17324D] sm:max-w-xl">
                <DialogHeader>
                    <div className="flex items-start gap-3 pr-6">
                        <TypeIcon ext={material.ext} />
                        <div className="min-w-0">
                            <DialogTitle className="leading-snug">{material.title}</DialogTitle>
                            <DialogDescription asChild>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    <Chip>{material.category}</Chip>
                                    <SubjectChip id={material.subject} />
                                </div>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {material.description && <p className="text-sm leading-relaxed">{material.description}</p>}

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md bg-[#F8FAFC] p-3 text-sm sm:grid-cols-4">
                    <div className="col-span-2"><dt className="text-xs text-[#607184]">File name</dt><dd className="break-all font-medium">{material.fileName}</dd></div>
                    <div><dt className="text-xs text-[#607184]">Type</dt><dd className="font-medium">{t?.label ?? material.ext.toUpperCase()}</dd></div>
                    <div><dt className="text-xs text-[#607184]">Size</dt><dd className="font-medium">{formatBytes(material.size)}</dd></div>
                    <div><dt className="text-xs text-[#607184]">Added</dt><dd className="font-medium">{formatDate(material.uploaded)}</dd></div>
                </dl>

                <Button onClick={() => onOpenFile(material)} className="w-full bg-[#247A73] text-white hover:bg-[#1d6560] sm:w-auto sm:self-start">
                    <ExternalLink className="mr-2 size-4" aria-hidden />Open file
                </Button>

                <section className="space-y-3">
                    <h3 className="text-sm font-semibold">Lesson plans using this file</h3>
                    {linked.length === 0 ? (
                        <p className="text-sm text-[#607184]">Not attached to any lesson plan yet.</p>
                    ) : (
                        <ul className="divide-y divide-[#D8E0E8] rounded-md border border-[#D8E0E8]">
                            {linked.map((p) => (
                                <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{p.topic}</p>
                                        <p className="text-xs text-[#607184]">{formatDate(p.date)} · {p.section}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="shrink-0 text-[#C65353] hover:bg-[#F9E6E6]" onClick={() => onDetach(material, p)}>
                                        Remove
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="flex flex-wrap items-end gap-2">
                        <div className="min-w-0 flex-1">
                            <label htmlFor="attach-plan" className="mb-1.5 block text-sm font-medium">Attach to a lesson plan</label>
                            <select id="attach-plan" className={selectCls} value={planId} onChange={(e) => setPlanId(e.target.value)} disabled={available.length === 0}>
                                <option value="">{available.length ? 'Choose a lesson plan' : 'Attached to every plan'}</option>
                                {available.map((p) => <option key={p.id} value={p.id}>{formatDate(p.date)} · {p.topic}</option>)}
                            </select>
                        </div>
                        <Button
                            variant="outline" className="border-[#D8E0E8]" disabled={!planId}
                            onClick={() => { onAttach(material, Number(planId)); setPlanId(''); }}
                        >
                            <Paperclip className="mr-2 size-4" aria-hidden />Attach
                        </Button>
                    </div>
                </section>

                <DialogFooter className="gap-2 sm:justify-between sm:gap-0">
                    <Button variant="ghost" className="text-[#C65353] hover:bg-[#F9E6E6]" onClick={() => onDelete(material)}>
                        <Trash2 className="mr-2 size-4" aria-hidden />Delete
                    </Button>
                    <Button variant="outline" className="border-[#D8E0E8]" onClick={() => onEdit(material)}>
                        <Pencil className="mr-2 size-4" aria-hidden />Edit details
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ---------- page ---------- */

export default function Materials() {
    const [materials, setMaterials] = useState(initialMaterials);
    const [plans, setPlans] = useState(initialPlans); // local copy so attach / remove works in this static demo
    const [search, setSearch] = useState('');
    const [subject, setSubject] = useState('all');
    const [type, setType] = useState('all');
    const [category, setCategory] = useState('all');
    const [sort, setSort] = useState('newest');
    const [view, setView] = useState('grid');
    const [form, setForm] = useState({ open: false, material: null, key: 0 });
    const [detailId, setDetailId] = useState(null);
    const [toDelete, setToDelete] = useState(null);

    const usage = (m) => plans.filter((p) => p.resourceIds.includes(m.id));
    const detail = materials.find((m) => m.id === detailId) ?? null;

    const handlers = {
        onDetails: (m) => setDetailId(m.id),
        onOpenFile: (m) => toast.info(`Opening ${m.fileName}…`),
        onEdit: (m) => { setDetailId(null); setForm((f) => ({ open: true, material: m, key: f.key + 1 })); },
        onDelete: (m) => { setDetailId(null); setToDelete(m); },
    };
    const openUpload = () => setForm((f) => ({ open: true, material: null, key: f.key + 1 }));

    const save = (m) => {
        const isNew = m.id === null;
        setMaterials((list) => (isNew ? [{ ...m, id: Date.now() }, ...list] : list.map((x) => (x.id === m.id ? m : x))));
        setForm((f) => ({ ...f, open: false }));
        toast.success(isNew ? 'Material added to your library.' : 'Details saved.');
    };

    const confirmDelete = () => {
        setMaterials((list) => list.filter((m) => m.id !== toDelete.id));
        setPlans((list) => list.map((p) => ({ ...p, resourceIds: p.resourceIds.filter((id) => id !== toDelete.id) })));
        toast.success('Material deleted.');
        setToDelete(null);
    };

    const attach = (m, planId) => {
        setPlans((list) => list.map((p) => (p.id === planId ? { ...p, resourceIds: [...p.resourceIds, m.id] } : p)));
        toast.success('Attached to the lesson plan.');
    };
    const detach = (m, plan) => {
        setPlans((list) => list.map((p) => (p.id === plan.id ? { ...p, resourceIds: p.resourceIds.filter((id) => id !== m.id) } : p)));
        toast.success('Removed from the lesson plan.');
    };

    const categoryCounts = useMemo(() => {
        const counts = {};
        materials.forEach((m) => { counts[m.category] = (counts[m.category] ?? 0) + 1; });
        return counts;
    }, [materials]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = materials
            .filter((m) => subject === 'all' || m.subject === subject || (subject === 'none' && !m.subject))
            .filter((m) => type === 'all' || typeOfExt(m.ext) === type)
            .filter((m) => category === 'all' || m.category === category)
            .filter((m) => !q || [m.title, m.description, m.fileName].some((s) => s.toLowerCase().includes(q)));
        return list.sort((a, b) =>
            sort === 'name' ? a.title.localeCompare(b.title)
            : sort === 'size' ? b.size - a.size
            : b.uploaded.localeCompare(a.uploaded) || b.id - a.id);
    }, [materials, search, subject, type, category, sort]);

    const totalSize = materials.reduce((n, m) => n + m.size, 0);
    const hasFilters = search || subject !== 'all' || type !== 'all' || category !== 'all';
    const clear = () => { setSearch(''); setSubject('all'); setType('all'); setCategory('all'); };

    const chip = (id, label, count) => (
        <button
            key={id} type="button" aria-pressed={category === id} onClick={() => setCategory(id)}
            className={`shrink-0 rounded-full border px-3 py-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73] ${
                category === id ? 'border-[#247A73] bg-[#247A73] text-white' : 'border-[#D8E0E8] bg-white text-[#17324D] hover:bg-[#E8F3F1]'
            }`}
        >
            {label} <span className={category === id ? 'text-white/80' : 'text-[#607184]'}>{count}</span>
        </button>
    );

    return (
        <AppLayout
            title="Materials"
            description="Your teaching files, organized by subject and category."
            actions={
                <Button onClick={openUpload} className="bg-[#247A73] text-white hover:bg-[#1d6560]">
                    <Upload className="mr-2 size-4" aria-hidden />Upload material
                </Button>
            }
        >
            <Head title="Materials" />

            <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <Label htmlFor="mat-search" className="sr-only">Search materials</Label>
                        <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-[#607184]" aria-hidden />
                        <Input id="mat-search" placeholder="Search title, file name or notes" value={search} onChange={(e) => setSearch(e.target.value)} className="border-[#D8E0E8] bg-white pl-9" />
                    </div>
                    <div className="w-full sm:w-44">
                        <label htmlFor="mat-subject" className="sr-only">Subject</label>
                        <select id="mat-subject" className={selectCls} value={subject} onChange={(e) => setSubject(e.target.value)}>
                            <option value="all">All subjects</option>
                            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            <option value="none">Not tied to a subject</option>
                        </select>
                    </div>
                    <div className="w-full sm:w-40">
                        <label htmlFor="mat-type" className="sr-only">File type</label>
                        <select id="mat-type" className={selectCls} value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="all">All file types</option>
                            {Object.entries(fileTypes).map(([id, t]) => <option key={id} value={id}>{t.label}</option>)}
                        </select>
                    </div>
                    <div className="w-full sm:w-40">
                        <label htmlFor="mat-sort" className="sr-only">Sort by</label>
                        <select id="mat-sort" className={selectCls} value={sort} onChange={(e) => setSort(e.target.value)}>
                            <option value="newest">Newest first</option>
                            <option value="name">Name A–Z</option>
                            <option value="size">Largest first</option>
                        </select>
                    </div>
                    <div role="group" aria-label="Layout" className="ml-auto inline-flex rounded-md border border-[#D8E0E8] bg-white p-0.5">
                        {[['grid', 'Grid', LayoutGrid], ['list', 'List', List]].map(([id, label, Icon]) => (
                            <button
                                key={id} type="button" aria-pressed={view === id} aria-label={`${label} view`} onClick={() => setView(id)}
                                className={`rounded p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73] ${view === id ? 'bg-[#247A73] text-white' : 'text-[#17324D] hover:bg-[#E8F3F1]'}`}
                            >
                                <Icon className="size-4" aria-hidden />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Category chips */}
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Category">
                    {chip('all', 'All', materials.length)}
                    {materialCategories.filter((c) => categoryCounts[c]).map((c) => chip(c, c, categoryCounts[c]))}
                </div>

                <p className="text-sm text-[#607184]" aria-live="polite">
                    Showing {filtered.length} of {materials.length} files · {formatBytes(totalSize)} stored
                </p>

                {filtered.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[#D8E0E8] bg-white p-10 text-center">
                        <FolderOpen className="mx-auto size-8 text-[#607184]" aria-hidden />
                        <p className="mt-2 font-medium text-[#17324D]">{materials.length === 0 ? 'No materials yet' : 'No files match your search'}</p>
                        <p className="mt-1 text-sm text-[#607184]">{materials.length === 0 ? 'Upload worksheets, slides and visual aids to build your library.' : 'Try another search term or clear the filters.'}</p>
                        <div className="mt-4 flex justify-center gap-2">
                            {hasFilters && <Button variant="outline" className="border-[#D8E0E8]" onClick={clear}>Clear filters</Button>}
                            <Button onClick={openUpload} className="bg-[#247A73] text-white hover:bg-[#1d6560]"><Upload className="mr-2 size-4" aria-hidden />Upload material</Button>
                        </div>
                    </div>
                ) : view === 'grid' ? (
                    <GridView items={filtered} usage={usage} handlers={handlers} />
                ) : (
                    <ListView items={filtered} usage={usage} handlers={handlers} />
                )}
            </div>

            <MaterialDialog
                key={form.key}
                open={form.open}
                onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
                initial={form.material}
                onSave={save}
            />

            {detail && (
                <DetailDialog
                    key={detail.id}
                    material={detail}
                    plans={plans}
                    usage={usage}
                    onClose={() => setDetailId(null)}
                    onOpenFile={handlers.onOpenFile}
                    onEdit={handlers.onEdit}
                    onDelete={handlers.onDelete}
                    onAttach={attach}
                    onDetach={detach}
                />
            )}

            <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
                <DialogContent className="border-[#D8E0E8] bg-white text-[#17324D] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete this material?</DialogTitle>
                        <DialogDescription className="text-[#607184]">
                            {toDelete && (() => {
                                const n = usage(toDelete).length;
                                return `“${toDelete.title}” will be removed from your library${n ? ` and detached from ${n} lesson plan${n > 1 ? 's' : ''}` : ''}. This cannot be undone.`;
                            })()}
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