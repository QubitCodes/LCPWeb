'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

/**
 * Reference type sub-tab definitions.
 * Each maps to /tailwind/admin/settings/reference/{type}.
 */
const REF_TABS = [
    { key: 'industries', label: 'Industries' },
    { key: 'categories', label: 'Categories' },
    { key: 'skills', label: 'Skills' }
];

/**
 * Reference data layout with horizontal sub-tabs.
 * Each tab has its own URL for deep-linking.
 */
export default function ReferenceLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Reference Data</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage lookup tables for Industries, Categories, and Skills.</p>
            </div>

            {/* Horizontal sub-tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                {REF_TABS.map((tab) => {
                    const href = `/tailwind/admin/settings/reference/${tab.key}`;
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={tab.key}
                            href={href}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            {tab.label}
                        </Link>
                    );
                })}
            </div>

            {children}
        </div>
    );
}
