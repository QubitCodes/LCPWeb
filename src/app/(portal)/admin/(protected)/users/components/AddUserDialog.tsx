'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, User, Mail, Briefcase, Shield } from 'lucide-react';

// Schema Validation
const userSchema = z.object({
    first_name: z.string().min(2, 'First name is required'),
    last_name: z.string().min(2, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    role: z.enum(['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'WORKER']),
    company_id: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters')
}).refine((data) => {
    if (['SUPERVISOR', 'WORKER'].includes(data.role) && !data.company_id) {
        return false;
    }
    return true;
}, {
    message: "Company is required for Supervisors and Workers",
    path: ["company_id"],
});

type UserFormData = z.infer<typeof userSchema>;

interface AddUserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddUserDialog({ isOpen, onClose, onSuccess }: AddUserDialogProps) {
    const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            role: 'WORKER',
            company_id: '',
            password: ''
        }
    });

    const role = watch('role');

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

    const onSubmit = async (data: UserFormData) => {
        setServerError('');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (result.status) {
                reset();
                onSuccess();
                onClose();
            } else {
                setServerError(result.message || 'Failed to create user');
            }
        } catch (error) {
            setServerError('An unexpected error occurred');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New User</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Create a new user account</p>
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

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">First Name <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        {...register('first_name')}
                                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                                        placeholder="John"
                                    />
                                </div>
                                {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name <span className="text-red-500">*</span></label>
                                <input
                                    {...register('last_name')}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                                    placeholder="Doe"
                                />
                                {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    {...register('email')}
                                    type="email"
                                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                                    placeholder="john.doe@example.com"
                                />
                            </div>
                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password <span className="text-red-500">*</span></label>
                            <input
                                {...register('password')}
                                type="password"
                                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                                placeholder="••••••••"
                            />
                            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    {...register('role')}
                                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                >
                                    <option value="WORKER">Worker</option>
                                    <option value="SUPERVISOR">Supervisor</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                </select>
                            </div>
                            {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
                        </div>

                        {['SUPERVISOR', 'WORKER'].includes(role) && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        {...register('company_id')}
                                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option value="">Select Company</option>
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {errors.company_id && <p className="mt-1 text-xs text-red-500">{errors.company_id.message}</p>}
                            </div>
                        )}

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
                        {isSubmitting ? 'Creating...' : 'Create User'}
                    </button>
                </div>
            </div>
        </div>
    );
}
