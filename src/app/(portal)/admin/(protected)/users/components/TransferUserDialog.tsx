'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, ArrowRightLeft, Briefcase, FileText } from 'lucide-react';

// Schema Validation
const transferSchema = z.object({
    new_company_id: z.string().min(1, 'Target company is required'),
    reason: z.string().min(5, 'Reason must be at least 5 characters')
});

type TransferFormData = z.infer<typeof transferSchema>;

interface User {
    id: string;
    first_name: string;
    last_name: string;
    company?: { id: string; name: string };
}

interface TransferUserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: User | null;
}

export default function TransferUserDialog({ isOpen, onClose, onSuccess, user }: TransferUserDialogProps) {
    const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<TransferFormData>({
        resolver: zodResolver(transferSchema),
        defaultValues: {
            new_company_id: '',
            reason: ''
        }
    });

    // Fetch Companies on mount/open
    useEffect(() => {
        if (isOpen) {
            fetch('/api/v1/companies')
                .then(res => res.json())
                .then(data => {
                    if (data.status) setCompanies(data.data);
                })
                .catch(err => console.error('Failed to fetch companies', err));
        }
    }, [isOpen]);

    // Handle Close & Reset
    const handleClose = () => {
        reset();
        setServerError('');
        onClose();
    };

    const onSubmit = async (data: TransferFormData) => {
        if (!user) return;
        setServerError('');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/users/change-company', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: user.id,
                    new_company_id: data.new_company_id,
                    reason: data.reason
                })
            });
            const result = await res.json();

            if (result.status) {
                reset();
                onSuccess();
                onClose();
            } else {
                setServerError(result.message || 'Failed to transfer user');
            }
        } catch (error) {
            setServerError('An unexpected error occurred');
        }
    };

    if (!isOpen || !user) return null;

    // Filter out current company from options
    const availableCompanies = companies.filter(c => c.id !== user.company?.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                            Transfer User
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Move <span className="font-medium text-slate-900 dark:text-white">{user.first_name} {user.last_name}</span> to a different company
                        </p>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">

                    {serverError && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
                            <span className="font-semibold">Error:</span> {serverError}
                        </div>
                    )}

                    <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="text-sm text-slate-500 dark:text-slate-400">Current Company</div>
                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2 mt-1">
                            <Briefcase className="w-4 h-4 text-slate-400" />
                            {user.company?.name || 'Unassigned'}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Company <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    {...register('new_company_id')}
                                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                >
                                    <option value="">Select Target Company</option>
                                    {availableCompanies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            {errors.new_company_id && <p className="mt-1 text-xs text-red-500">{errors.new_company_id.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason for Transfer <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <textarea
                                    {...register('reason')}
                                    rows={3}
                                    className="w-full py-2 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 resize-none"
                                    placeholder="Explain why this user is being transferred..."
                                />
                            </div>
                            {errors.reason && <p className="mt-1 text-xs text-red-500">{errors.reason.message}</p>}
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3 sticky bottom-0">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg transition-colors border border-transparent"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isSubmitting ? 'Transfer User' : 'Transfer User'}
                    </button>
                </div>
            </div>
        </div>
    );
}
