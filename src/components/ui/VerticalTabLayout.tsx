'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, type LucideIcon } from 'lucide-react';

/**
 * Tab definition for the vertical sidebar.
 */
export interface VerticalTab {
    /** Display label */
    label: string;
    /** Optional description shown below the label */
    description?: string;
    /** Lucide icon component */
    icon?: LucideIcon;
    /** Full href route — used for navigation and active detection */
    href: string;
}

/**
 * Props for the VerticalTabLayout component.
 */
interface VerticalTabLayoutProps {
    /** Array of tab definitions with hrefs (URL slugs) */
    tabs: VerticalTab[];
    /** Section title displayed above the tabs */
    sectionTitle?: string;
    /** Children content rendered in the main area */
    children: React.ReactNode;
    /** Optional: custom active-path matching logic. Defaults to startsWith. */
    isActive?: (pathname: string, tabHref: string) => boolean;
}

/**
 * Reusable vertical tab sidebar layout.
 * Renders a sticky sidebar with tab navigation on desktop
 * and horizontal scrollable pills on mobile.
 *
 * URL slugs are fed via the `tabs[].href` prop — the component
 * uses `usePathname()` to determine the active tab automatically.
 *
 * @example
 * ```tsx
 * <VerticalTabLayout
 *     sectionTitle="Settings"
 *     tabs={[
 *         { label: 'General', description: 'Platform config', icon: Sliders, href: '/admin/settings/general' },
 *         { label: 'Security', description: 'Auth policies', icon: Shield, href: '/admin/settings/security' },
 *     ]}
 * >
 *     {children}
 * </VerticalTabLayout>
 * ```
 */
export default function VerticalTabLayout({
    tabs,
    sectionTitle,
    children,
    isActive: customIsActive
}: VerticalTabLayoutProps) {
    const pathname = usePathname();

    /**
     * Determine if a tab is active.
     * Uses custom matcher if provided, otherwise defaults to
     * exact match or startsWith for nested routes.
     */
    const checkActive = (tabHref: string): boolean => {
        if (customIsActive) return customIsActive(pathname || '', tabHref);
        return pathname === tabHref || (pathname?.startsWith(tabHref + '/') ?? false);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-12rem)]">
            {/* Desktop Vertical Sidebar */}
            <aside className="w-60 shrink-0 hidden lg:block">
                <nav className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden sticky top-24">
                    {sectionTitle && (
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                {sectionTitle}
                            </h3>
                        </div>
                    )}
                    <div className="p-2">
                        {tabs.map((tab) => {
                            const active = checkActive(tab.href);
                            const Icon = tab.icon;
                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    replace
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${active
                                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    {Icon && (
                                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <span className="font-medium block">{tab.label}</span>
                                        {tab.description && (
                                            <span className={`text-[11px] block truncate ${active ? 'text-blue-500/70 dark:text-blue-400/60' : 'text-slate-400 dark:text-slate-500'}`}>
                                                {tab.description}
                                            </span>
                                        )}
                                    </div>
                                    {active && <ChevronRight className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />}
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </aside>

            {/* Mobile Horizontal Pills */}
            <div className="lg:hidden w-full mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {tabs.map((tab) => {
                        const active = checkActive(tab.href);
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                replace
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${active
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {tab.icon && <tab.icon className="w-4 h-4" />}
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
