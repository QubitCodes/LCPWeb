'use client';

import SidebarContent from '@/components/SidebarContent';

interface SidebarProps {
    role: string;
    userName: string;
    onLogout: () => void;
}

export default function Sidebar({ role, userName, onLogout }: SidebarProps) {
    return (
        <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen fixed left-0 top-0 overflow-hidden z-50 transition-colors duration-200">
            <SidebarContent role={role} userName={userName} onLogout={onLogout} />
        </aside>
    );
}
