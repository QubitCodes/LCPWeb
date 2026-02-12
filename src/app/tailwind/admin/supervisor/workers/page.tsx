'use client';

import { Users } from 'lucide-react';

export default function SupervisorWorkersPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Workers</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage your assigned team members.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">My Workers List</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    This page is under construction. It will list all workers under your supervision.
                </p>
            </div>
        </div>
    );
}
