'use client';

import { Shield } from 'lucide-react';

/**
 * Security Settings placeholder page.
 * Future: Session limits, password policies, 2FA config.
 */
export default function SecuritySettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Security Settings</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Authentication and session policies.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Coming Soon</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm">
                    This section will allow configuration of session limits, password policies, multi-device login rules, and two-factor authentication.
                </p>
            </div>
        </div>
    );
}
