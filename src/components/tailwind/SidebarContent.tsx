'use client';

import Image from 'next/image';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    DollarSign,
    Award,
    History,
    Settings,
    UserCheck,
    CreditCard,
    Bell,
    X,
    BookOpen
} from 'lucide-react';
import NavItem from '@/components/tailwind/sidebar/NavItem';
import ProfileDropdown from '@/components/tailwind/sidebar/ProfileDropdown';
import SectionLabel from '@/components/tailwind/sidebar/SectionLabel';

interface SidebarContentProps {
    role: string;
    userName: string;
    onLogout: () => void;
    onClose?: () => void;
}

export default function SidebarContent({ role, userName, onLogout, onClose }: SidebarContentProps) {
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role);
    const isSupervisor = role === 'SUPERVISOR';

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors duration-200">
            {/* Logo Area */}
            <div className="p-5 flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-3">
                    <div className="w-full flex justify-center items-center">
                        <Image
                            src="/assets/LCP_Logo.svg"
                            alt="LCP Logo"
                            width={140}
                            height={40}
                            className="h-8 w-auto"
                            priority
                        />
                    </div>
                </div>
                {onClose ? (
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                ) : (
                    <button className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white relative transition-colors">
                        <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                        <Bell className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                <SectionLabel label="Control Center" />

                <nav className="space-y-0.5">
                    {/* Dashboard Redirects */}
                    <NavItem
                        href={isAdmin ? '/tailwind/admin/dashboard' : isSupervisor ? '/tailwind/admin/supervisor' : '/tailwind/admin/worker'}
                        icon={LayoutDashboard}
                        label="Overview"
                        activePaths={['/tailwind/admin/dashboard', '/tailwind/admin/supervisor', '/tailwind/admin/worker']}
                    />

                    {/* Admin Links */}
                    {isAdmin && (
                        <>
                            <NavItem href="/tailwind/admin/users" icon={Users} label="Admins" />
                            {/*
                             * Jobs / Courses merged into a single sidebar entry.
                             * Rationale: Currently 1 Job = 1 Course, so they share the same page.
                             * The standalone Courses link has been removed from sidebar.
                             * The /courses route is still accessible via URL and from the Jobs page.
                             */}
                            <NavItem href="/tailwind/admin/companies" icon={Briefcase} label="Companies" />
                            <NavItem href="/tailwind/admin/jobs" icon={BookOpen} label="Jobs / Courses" isBeta />

                            {role === 'SUPER_ADMIN' && (
                                <>
                                    <NavItem href="/tailwind/admin/payments" icon={DollarSign} label="Payments" />
                                    <NavItem href="/tailwind/admin/recommendations" icon={Award} label="Approvals" />
                                </>
                            )}

                            <SectionLabel label="Settings" className="mt-6" />

                            <NavItem href="/tailwind/admin/settings/reference" icon={Settings} label="Platform Settings" />
                        </>
                    )}

                    {/* Supervisor Links */}
                    {isSupervisor && (
                        <>
                            <NavItem href="/tailwind/admin/supervisor/workers" icon={UserCheck} label="My Workers" />
                            <NavItem href="/tailwind/admin/supervisor/recommendations" icon={Award} label="Recommendations" />
                            <NavItem href="/tailwind/admin/enrollments" icon={CreditCard} label="Enrollments" />
                        </>
                    )}

                    {/* Shared Links */}
                    {role === 'SUPER_ADMIN' && <NavItem href="/tailwind/admin/enrollments" icon={CreditCard} label="Enrollments" />}

                    {isAdmin && <NavItem href="/tailwind/admin/audit-logs" icon={History} label="Audit Logs" />}
                </nav>
            </div>

            {/* User Profile Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
                <ProfileDropdown userName={userName} role={role} onLogout={onLogout} />

                {/* Developer Credit */}
                <div className="mt-3 text-center">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        Developed by <a href="https://qubit.codes" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium transition-colors">Qubit Codes</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
