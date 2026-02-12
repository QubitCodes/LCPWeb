'use client';

import { Sliders } from 'lucide-react';

/**
 * General Settings placeholder page.
 * Future: Platform name, theme config, email templates, feature flags.
 */
export default function GeneralSettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">General Settings</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Configure global platform parameters.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sliders className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Coming Soon</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm">
                    This section will allow configuration of platform name, branding, email templates, and feature flags.
                </p>
            </div>
        </div>
    );
}
