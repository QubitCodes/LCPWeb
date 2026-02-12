'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';
import BetaBadge from '@/components/sidebar/BetaBadge';

interface NavItemProps {
    /** The route path this nav item links to */
    href: string;
    /** Lucide icon component to render */
    icon: LucideIcon;
    /** Display label for the nav item */
    label: string;
    /** Whether to show a "BETA" badge next to the label */
    isBeta?: boolean;
    /** Optional array of paths for multi-path active detection (e.g. Overview matches multiple dashboard routes) */
    activePaths?: string[];
}

/**
 * NavItem - A single sidebar navigation link with icon, label,
 * active state highlighting, and optional beta badge.
 * Supports multi-path active matching via `activePaths`.
 */
export default function NavItem({ href, icon: Icon, label, isBeta = false, activePaths }: NavItemProps) {
    const pathname = usePathname();
    const active = activePaths
        ? activePaths.some(path => pathname === path || pathname.startsWith(path + '/'))
        : pathname === href || pathname.startsWith(href + '/');

    return (
        <Link
            href={href}
            className={`group flex items-center px-4 py-2.5 mx-3 rounded-lg transition-all duration-200 mb-1 ${active
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }`}
        >
            <Icon className={`w-5 h-5 mr-3 transition-colors ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`} />
            <span className={`text-sm font-medium ${active ? 'font-semibold' : ''}`}>{label}</span>
            {isBeta && <BetaBadge />}
        </Link>
    );
}
