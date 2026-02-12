'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { useHeader } from '@/components/tailwind/HeaderContext';
import {
    Database,
    Shield,
    Sliders,
    ChevronRight
} from 'lucide-react';

/**
 * Settings tab definitions.
 * Each tab maps to a child route under /tailwind/admin/settings/.
 */
const SETTINGS_TABS = [
    {
        label: 'Reference Data',
        description: 'Industries, Categories & Skills',
        href: '/tailwind/admin/settings/reference',
        icon: Database
    },
    {
        label: 'General',
        description: 'Platform configuration',
        href: '/tailwind/admin/settings/general',
        icon: Sliders
    },
    {
        label: 'Security',
        description: 'Auth & session policies',
        href: '/tailwind/admin/settings/security',
        icon: Shield
    }
];

/**
 * Settings layout with a vertical tab sidebar.
 * Each tab has its own URL for deep-linking support.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { setTitle, setActions } = useHeader();

    useEffect(() => {
        setTitle('Platform Settings');
        setActions(null);
    }, [setTitle, setActions]);

    return (
        <div className="flex gap-6 min-h-[calc(100vh-12rem)]">
            {/* Vertical Tab Sidebar */}
            <aside className="w-60 shrink-0 hidden lg:block">
                <nav className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden sticky top-24">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Settings
                        </h3>
                    </div>
                    <div className="p-2">
                        {SETTINGS_TABS.map((tab) => {
                            const isActive = pathname === tab.href || pathname?.startsWith(tab.href + '/');
                            const Icon = tab.icon;
                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${isActive
                                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                                    <div className="flex-1 min-w-0">
                                        <span className="font-medium block">{tab.label}</span>
                                        <span className={`text-[11px] block truncate ${isActive ? 'text-blue-500/70 dark:text-blue-400/60' : 'text-slate-400 dark:text-slate-500'}`}>
                                            {tab.description}
                                        </span>
                                    </div>
                                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />}
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </aside>

            {/* Mobile Tab Selector */}
            <div className="lg:hidden w-full mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {SETTINGS_TABS.map((tab) => {
                        const isActive = pathname === tab.href || pathname?.startsWith(tab.href + '/');
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
                {children}
            </div>
        </div>
    );
}
