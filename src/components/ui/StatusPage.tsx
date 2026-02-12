'use client';

import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

/**
 * Props for the reusable StatusPage component.
 */
interface StatusPageProps {
    /** HTTP status code to display prominently (e.g. 404, 500, 403). */
    code: number;
    /** Short headline (e.g. "Page Not Found"). */
    title: string;
    /** Longer description explaining what happened. */
    description?: string;
    /** Primary CTA — defaults to "Go Home" pointing at /admin/dashboard. */
    primaryAction?: {
        label: string;
        href: string;
    };
    /** Optional secondary CTA (e.g. "Go Back"). */
    showBackButton?: boolean;
}

/**
 * StatusPage — a full-screen branded error/status page.
 * Reusable for 404, 500, 403, maintenance, etc.
 *
 * @example
 * <StatusPage code={404} title="Page Not Found" description="We couldn't find the page you were looking for." />
 * <StatusPage code={500} title="Server Error" description="Something went wrong on our end." />
 * <StatusPage code={403} title="Access Denied" description="You don't have permission to view this page." />
 */
export default function StatusPage({
    code,
    title,
    description = 'Something unexpected happened. Please try again or navigate back.',
    primaryAction = { label: 'Go to Dashboard', href: '/admin/dashboard' },
    showBackButton = true,
}: StatusPageProps) {
    /** Map status code ranges to accent colors. */
    const accent =
        code >= 500
            ? { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', glow: 'bg-red-600/10' }
            : code === 403
                ? { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'bg-amber-600/10' }
                : { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', glow: 'bg-blue-600/10' };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden px-4">
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full ${accent.glow} blur-[120px] opacity-60`} />
            </div>

            <div className="relative z-10 text-center max-w-lg">
                {/* Status code */}
                {/* <div className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full ${accent.bg} ${accent.border} border mb-6`}>
                    <span className={`text-sm font-semibold ${accent.text} tracking-wider`}>{code} ERROR</span>
                </div> */}

                {/* Large code number */}
                <h1 className="text-[120px] sm:text-[160px] font-black leading-none text-slate-200 dark:text-slate-800 select-none mb-6">
                    {code}
                </h1>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white -mt-4 mb-3">
                    {title}
                </h2>

                {/* Description */}
                <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mb-8 leading-relaxed">
                    {description}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-center gap-3 flex-wrap">
                    {showBackButton && (
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Go Back
                        </button>
                    )}
                    <Link
                        href={primaryAction.href}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-px"
                    >
                        <Home className="w-4 h-4" />
                        {primaryAction.label}
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <p className="absolute bottom-6 text-xs text-slate-400 dark:text-slate-600">
                © 2026 Labour Certification Platform
            </p>
        </div>
    );
}
