import { Link, router, usePage } from '@inertiajs/react';
import {
    BookOpenText, CalendarDays, ChevronDown, ClipboardCheck, FolderOpen,
    GraduationCap, LayoutDashboard, ListChecks, LogOut, Menu, Settings, User, Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';

const mainNav = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Schedule', href: '/schedule', icon: CalendarDays },
    { label: 'Lesson Plans', href: '/lesson-plans', icon: BookOpenText },
    { label: 'Tasks', href: '/tasks', icon: ListChecks },
    { label: 'Materials', href: '/materials', icon: FolderOpen },
    { label: 'Students', href: '/students', icon: Users },
    { label: 'Attendance', href: '/attendance', icon: ClipboardCheck },
    { label: 'Grades', href: '/grades', icon: GraduationCap },
];
const footerNav = [{ label: 'Settings & Backup', href: '/settings', icon: Settings }];

function NavItem({ item, active }) {
    const Icon = item.icon;
    const base =
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ' +
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E6B85C] ';
    const state = active
        ? 'bg-[#247A73] text-white'
        : 'text-white/80 hover:bg-white/10 hover:text-white';

    return (
        <Link href={item.href} aria-current={active ? 'page' : undefined} className={base + state}>
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{item.label}</span>
        </Link>
    );
}

function SidebarBody({ isActive }) {
    return (
        <div className="flex h-full flex-col bg-[#17324D] text-white">
            <div className="flex h-14 shrink-0 items-center gap-2 px-4">
                <div className="flex size-8 items-center justify-center rounded-md bg-[#247A73]">
                    <GraduationCap className="size-4" aria-hidden />
                </div>
                <span className="text-sm font-semibold leading-tight">Teacher Assistant</span>
            </div>

            <Separator className="bg-white/10" />

            <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {mainNav.map((i) => (
                    <NavItem key={i.href} item={i} active={isActive(i.href)} />
                ))}
            </nav>

            <Separator className="bg-white/10" />

            <div className="space-y-1 px-3 py-3">
                {footerNav.map((i) => (
                    <NavItem key={i.href} item={i} active={isActive(i.href)} />
                ))}
            </div>
        </div>
    );
}

/** Props: title, description (optional), actions (optional node), children */
export default function AppLayout({ title, description, actions, children }) {
    const { url, props } = usePage();
    const user = props.auth?.user;
    const flash = props.flash;
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    useEffect(() => setOpen(false), [url]);

    const path = url.split('?')[0];
    const isActive = (href) => path === href || path.startsWith(href + '/');
    const initials = (user?.name ?? 'T')
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    const today = new Date().toLocaleDateString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#17324D]">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 lg:block">
                <SidebarBody isActive={isActive} />
            </aside>

            {/* Small-window drawer */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent
                    side="left"
                    className="w-56 border-0 bg-[#17324D] p-0 text-white [&>button]:text-white"
                >
                    <SheetTitle className="sr-only">Navigation</SheetTitle>
                    <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
                    <SidebarBody isActive={isActive} />
                </SheetContent>
            </Sheet>

            <div className="lg:pl-56">
                {/* Top bar */}
                <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[#D8E0E8] bg-white px-4 sm:px-5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-[#607184] hover:bg-[#E8F3F1] lg:hidden"
                        onClick={() => setOpen(true)}
                        aria-label="Open navigation"
                    >
                        <Menu className="size-5" />
                    </Button>

                    <p className="text-sm text-[#607184]">{today}</p>

                    <div className="ml-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="gap-2 px-2 text-[#17324D] hover:bg-[#E8F3F1]">
                                    <Avatar className="size-7">
                                        <AvatarFallback className="bg-[#E8F3F1] text-xs font-semibold text-[#247A73]">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden text-sm sm:inline">{user?.name}</span>
                                    <ChevronDown className="size-4 text-[#607184]" aria-hidden />
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                align="end"
                                className="w-56 border-[#D8E0E8] bg-white text-[#17324D]"
                            >
                                <DropdownMenuLabel className="font-normal">
                                    <p className="text-sm font-medium">{user?.name}</p>
                                    <p className="truncate text-xs text-[#607184]">{user?.email}</p>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-[#D8E0E8]" />
                                <DropdownMenuItem asChild className="focus:bg-[#E8F3F1]">
                                    <Link href="/profile">
                                        <User className="mr-2 size-4" /> Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => router.post('/logout')}
                                    className="text-[#C65353] focus:bg-[#C65353]/10 focus:text-[#C65353]"
                                >
                                    <LogOut className="mr-2 size-4" /> Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page header + content */}
                <main className="w-full px-4 py-4 sm:px-5">
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-semibold text-[#17324D]">{title}</h1>
                            {description && (
                                <p className="mt-1 max-w-prose text-sm text-[#607184]">{description}</p>
                            )}
                        </div>
                        {actions && <div className="flex items-center gap-2">{actions}</div>}
                    </div>

                    {children}
                </main>
            </div>

            <Toaster richColors position="top-right" />
        </div>
    );
}