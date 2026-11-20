import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle, ArrowRight, CalendarCheck, ClipboardCheck,
    ClipboardList, FilePlus2, FileText, GraduationCap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    attendanceWeek, checkingQueue, recentLessonPlans,
    tasks, todaySchedule, upcomingExams,
} from '@/data/dashboardSample';
import AppLayout from '@/layouts/AppLayout';

/* Theme: Navy #17324D | Teal #247A73 | Mint #E8F3F1 | Border #D8E0E8 | Gray #607184
          Warm #E6B85C | Success #2E8B65 | Warning #C58A2B | Danger #C65353 */

/* ---------- small building blocks ---------- */

function Panel({ title, description, href, linkLabel = 'View all', children, className = '' }) {
    return (
        <Card className={`border-[#D8E0E8] bg-white shadow-sm ${className}`}>
            <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-3">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold text-[#17324D]">{title}</CardTitle>
                    {description && (
                        <CardDescription className="text-sm text-[#607184]">{description}</CardDescription>
                    )}
                </div>
                {href && (
                    <Link
                        href={href}
                        className="inline-flex shrink-0 items-center gap-1 rounded text-sm font-medium text-[#247A73] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73]"
                    >
                        {linkLabel} <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                )}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

function EmptyState({ children }) {
    return <p className="py-6 text-center text-sm text-[#607184]">{children}</p>;
}

const statusStyles = {
    Pending:       { bg: '#EEF2F6', fg: '#4A5B6E', dot: '#607184' },
    'In Progress': { bg: '#E8F3F1', fg: '#1B5F59', dot: '#247A73' },
    Completed:     { bg: '#E3F3EA', fg: '#1F6B4B', dot: '#2E8B65' },
    Overdue:       { bg: '#F9E6E6', fg: '#A63F3F', dot: '#C65353' },
    Draft:         { bg: '#EEF2F6', fg: '#4A5B6E', dot: '#607184' },
};

function StatusBadge({ status }) {
    const s = statusStyles[status] ?? statusStyles.Pending;
    return (
        <span
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: s.bg, color: s.fg }}
        >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: s.dot }} aria-hidden />
            {status}
        </span>
    );
}

const dueColors = { overdue: '#A63F3F', soon: '#8A5F12', normal: '#607184' };

/* ---------- stat tiles ---------- */

function StatTile({ icon: Icon, label, value, hint, tone = '#247A73', toneBg = '#E8F3F1' }) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-[#D8E0E8] bg-white p-4 shadow-sm">
            <div
                className="flex size-11 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: toneBg, color: tone }}
            >
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

/* ---------- today's schedule ---------- */

const stateChip = {
    done:     { label: 'Done', bg: '#EEF2F6', fg: '#4A5B6E' },
    now:      { label: 'Now',  bg: '#247A73', fg: '#FFFFFF' },
    next:     { label: 'Next', bg: '#FBF1DB', fg: '#8A5F12' },
    upcoming: null,
};

function ScheduleList({ items }) {
    if (!items.length) return <EmptyState>No classes scheduled today.</EmptyState>;

    return (
        <ul className="space-y-2">
            {items.map((c) => {
                const chip = stateChip[c.state];
                const isNow = c.state === 'now';
                return (
                    <li
                        key={c.id}
                        className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border px-3 py-2.5 ${
                            isNow ? 'border-[#247A73] bg-[#E8F3F1]' : 'border-[#D8E0E8] bg-white'
                        } ${c.state === 'done' ? 'opacity-70' : ''}`}
                        aria-current={isNow ? 'true' : undefined}
                    >
                        <div className="w-28 shrink-0 text-sm">
                            <p className="font-medium text-[#17324D]">{c.start}</p>
                            <p className="text-xs text-[#607184]">to {c.end}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-[#17324D]">{c.subject}</p>
                            <p className="truncate text-sm text-[#607184]">{c.section} · {c.room}</p>
                        </div>
                        {chip && (
                            <span
                                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                                style={{ backgroundColor: chip.bg, color: chip.fg }}
                            >
                                {chip.label}
                            </span>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

/* ---------- deadlines ---------- */

function TaskList({ items }) {
    if (!items.length) return <EmptyState>Nothing pending. Nice work!</EmptyState>;

    return (
        <ul className="divide-y divide-[#D8E0E8]">
            {items.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                        <p className="font-medium leading-snug text-[#17324D]">{t.title}</p>
                        <p className="mt-0.5 text-xs text-[#607184]">
                            {t.category} · {t.priority} priority
                        </p>
                        <p className="mt-0.5 text-xs font-medium" style={{ color: dueColors[t.dueTone] }}>
                            {t.due}
                        </p>
                    </div>
                    <StatusBadge status={t.status} />
                </li>
            ))}
        </ul>
    );
}

/* ---------- attendance graph (no chart library needed) ---------- */

function AttendanceChart({ data }) {
    const { classSize, days, sectionLabel } = data;
    const totals = days.reduce(
        (a, d) => ({ present: a.present + d.present, late: a.late + d.late, absent: a.absent + d.absent }),
        { present: 0, late: 0, absent: 0 },
    );
    const rate = Math.round(((totals.present + totals.late) / (classSize * days.length)) * 100);

    const summary =
        `Attendance for ${sectionLabel}, ${classSize} students. ` +
        days.map((d) => `${d.day}: ${d.present} present, ${d.late} late, ${d.absent} absent`).join('. ');

    const legend = [
        { label: 'Present', color: '#247A73' },
        { label: 'Late',    color: '#E6B85C' },
        { label: 'Absent',  color: '#C65353' },
    ];

    return (
        <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                <p className="text-sm text-[#607184]">
                    <span className="text-2xl font-semibold text-[#17324D]">{rate}%</span>{' '}
                    average attendance · {totals.absent} absences this week
                </p>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#607184]">
                    {legend.map((l) => (
                        <li key={l.label} className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-sm" style={{ backgroundColor: l.color }} aria-hidden />
                            {l.label}
                        </li>
                    ))}
                </ul>
            </div>

            <div role="img" aria-label={summary}>
                <div className="flex h-44 items-end gap-3 border-b border-[#D8E0E8] sm:gap-6">
                    {days.map((d) => (
                        <div
                            key={d.day}
                            className="flex h-full flex-1 flex-col-reverse overflow-hidden rounded-t-md"
                            title={`${d.day}: ${d.present} present, ${d.late} late, ${d.absent} absent`}
                        >
                            {[
                                { n: d.present, color: '#247A73' },
                                { n: d.late,    color: '#E6B85C' },
                                { n: d.absent,  color: '#C65353' },
                            ].map((seg, i) =>
                                seg.n > 0 ? (
                                    <div
                                        key={i}
                                        style={{ height: `${(seg.n / classSize) * 100}%`, backgroundColor: seg.color }}
                                    />
                                ) : null,
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-2 flex gap-3 sm:gap-6">
                    {days.map((d) => (
                        <div key={d.day} className="flex-1 text-center">
                            <p className="text-sm font-medium text-[#17324D]">{d.day}</p>
                            <p className="text-xs text-[#607184]">{d.present + d.late}/{classSize}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ---------- checking queue ---------- */

function CheckingQueue({ items }) {
    if (!items.length) return <EmptyState>All activities are checked.</EmptyState>;

    return (
        <ul className="space-y-4">
            {items.map((q) => {
                const pct = Math.round((q.checked / q.total) * 100);
                return (
                    <li key={q.id}>
                        <div className="flex items-baseline justify-between gap-2">
                            <p className="truncate font-medium text-[#17324D]">{q.title}</p>
                            <p className="shrink-0 text-xs text-[#607184]">{q.checked}/{q.total} checked</p>
                        </div>
                        <p className="mb-1.5 truncate text-xs text-[#607184]">{q.classLabel}</p>
                        <div
                            className="h-2 overflow-hidden rounded-full bg-[#E8F3F1]"
                            role="progressbar"
                            aria-valuenow={pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${q.title} checking progress`}
                        >
                            <div className="h-full rounded-full bg-[#247A73]" style={{ width: `${pct}%` }} />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

/* ---------- exams & lesson plans ---------- */

function ExamList({ items }) {
    if (!items.length) return <EmptyState>No upcoming examinations.</EmptyState>;
    return (
        <ul className="divide-y divide-[#D8E0E8]">
            {items.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                        <p className="truncate font-medium text-[#17324D]">{e.title}</p>
                        <p className="text-xs text-[#607184]">{e.date} · {e.section}</p>
                    </div>
                    <StatusBadge status={e.prep} />
                </li>
            ))}
        </ul>
    );
}

function LessonPlanList({ items }) {
    if (!items.length) return <EmptyState>No lesson plans yet.</EmptyState>;
    return (
        <ul className="divide-y divide-[#D8E0E8]">
            {items.map((l) => (
                <li key={l.id}>
                    <Link
                        href="/lesson-plans"
                        className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 hover:bg-[#E8F3F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#247A73]"
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <FileText className="size-4 shrink-0 text-[#607184]" aria-hidden />
                            <div className="min-w-0">
                                <p className="truncate font-medium text-[#17324D]">{l.topic}</p>
                                <p className="text-xs text-[#607184]">{l.subject} · {l.date}</p>
                            </div>
                        </div>
                        <StatusBadge status={l.status} />
                    </Link>
                </li>
            ))}
        </ul>
    );
}

/* ---------- page ---------- */

export default function Dashboard() {
    const overdueCount = tasks.filter((t) => t.status === 'Overdue').length;
    const pendingCount = tasks.filter((t) => t.status !== 'Completed' && t.status !== 'Overdue').length;
    const toCheck = checkingQueue.reduce((sum, q) => sum + (q.total - q.checked), 0);

    return (
        <AppLayout
            title="Dashboard"
            description="Your teaching day at a glance."
            actions={
                <>
                    <Button asChild variant="outline" className="border-[#D8E0E8] bg-white text-[#17324D] hover:bg-[#E8F3F1]">
                        <Link href="/attendance"><CalendarCheck className="mr-2 size-4" aria-hidden />Record attendance</Link>
                    </Button>
                    <Button asChild className="bg-[#247A73] text-white hover:bg-[#1d6560]">
                        <Link href="/lesson-plans"><FilePlus2 className="mr-2 size-4" aria-hidden />New lesson plan</Link>
                    </Button>
                </>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-4">
                {/* Summary tiles */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatTile icon={GraduationCap} label="Classes today" value={todaySchedule.length} hint="Next: English at 9:30 AM" />
                    <StatTile icon={ClipboardCheck} label="Papers to check" value={toCheck} hint={`${checkingQueue.length} activities in queue`} />
                    <StatTile icon={ClipboardList} label="Pending tasks" value={pendingCount} hint="Due this week" tone="#8A5F12" toneBg="#FBF1DB" />
                    <StatTile icon={AlertTriangle} label="Overdue" value={overdueCount} hint="Needs attention" tone="#A63F3F" toneBg="#F9E6E6" />
                </div>

                {/* Schedule + deadlines */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <Panel title="Today's schedule" description="Your classes in order" href="/schedule" linkLabel="Full timetable" className="lg:col-span-2">
                        <ScheduleList items={todaySchedule} />
                    </Panel>

                    <Panel title="Deadlines & tasks" description="Overdue first, then due soon" href="/tasks">
                        <TaskList items={tasks} />
                    </Panel>
                </div>

                {/* Attendance graph + checking queue */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <Panel title="Attendance this week" description={attendanceWeek.sectionLabel} href="/attendance" className="lg:col-span-2">
                        <AttendanceChart data={attendanceWeek} />
                    </Panel>

                    <Panel title="Checking queue" description="Activities waiting to be checked" href="/tasks">
                        <CheckingQueue items={checkingQueue} />
                    </Panel>
                </div>

                {/* Exams + lesson plans */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Panel title="Upcoming examinations" description="Preparation status" href="/tasks">
                        <ExamList items={upcomingExams} />
                    </Panel>

                    <Panel title="Recent lesson plans" description="Jump back in" href="/lesson-plans">
                        <LessonPlanList items={recentLessonPlans} />
                    </Panel>
                </div>
            </div>
        </AppLayout>
    );
}