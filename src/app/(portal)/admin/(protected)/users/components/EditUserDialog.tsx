'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, User, Mail, Shield, Save } from 'lucide-react';

// Schema Validation
const editUserSchema = z.object({
    first_name: z.string().min(2, 'First name is required'),
    last_name: z.string().min(2, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    role: z.enum(['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'WORKER'])
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
}

interface EditUserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: User | null;
}

export default function EditUserDialog({ isOpen, onClose, onSuccess, user }: EditUserDialogProps) {
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<EditUserFormData>({
        resolver: zodResolver(editUserSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            role: 'WORKER'
        }
    });

    useEffect(() => {
        if (user && isOpen) {
            reset({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role as any
            });
        }
    }, [user, isOpen, reset]);

    // Handle Close & Reset
    const handleClose = () => {
        reset();
        setServerError('');
        onClose();
    };

    const onSubmit = async (data: EditUserFormData) => {
        if (!user) return;
        setServerError('');

        try {
            const token = localStorage.getItem('token');
            // Assuming PUT /api/v1/users/[id] or PATCH logic. 
            // The user requested "Users need an edit popup too".
            // If explicit ID endpoint exists, use it. Else check how API handles updates.
            // Often it's POST /update or PUT /:id. I'll try PUT /api/v1/users with id in body or query if pattern differs.
            // Standard convention: PUT /api/v1/users?id=... or body id.
            // Let's assume standard PUT /api/v1/users/[id] or similar.
            // Actually, based on previous plan, I said "PUT /api/v1/users".
            // Let's try PUT /api/v1/users with id in body.

            const res = await fetch(`/api/v1/users`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: user.id,
                    ...data
                })
            });
            const result = await res.json();

            if (result.status) {
                onSuccess();
                onClose();
            } else {
                setServerError(result.message || 'Failed to update user');
            }
        } catch (error) {
            setServerError('An unexpected error occurred');
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Edit User
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Update details for <span className="font-medium text-slate-900 dark:text-white">{user.first_name}</span></p>
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
                                    />
                                </div>
                                {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name <span className="text-red-500">*</span></label>
                                <input
                                    {...register('last_name')}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
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
                                />
                            </div>
                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
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
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
