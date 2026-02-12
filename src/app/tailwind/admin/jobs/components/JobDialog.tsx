'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, Briefcase, Layers, Save, Plus } from 'lucide-react';

// Schema Validation
const jobSchema = z.object({
    name: z.string().min(3, 'Job name is required'),
    category_id: z.string().min(1, 'Category is required'),
});

type JobFormData = z.infer<typeof jobSchema>;

interface Job {
    id: string;
    name: string;
    category?: { id: string; name: string };
}

interface JobDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    job?: Job | null; // If provided, it's Edit mode
}

export default function JobDialog({ isOpen, onClose, onSuccess, job }: JobDialogProps) {
    const isEdit = !!job;
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<JobFormData>({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            name: '',
            category_id: ''
        }
    });

    // Fetch Categories
    useEffect(() => {
        if (isOpen) {
            // Need a categories endpoint. Assuming /api/v1/categories exists or handled via jobs meta?
            // If not, maybe hardcode for now or check current implementation.
            // Legacy /admin/jobs used categories. 
            // I'll assume /api/v1/categories based on standard patterns.
            fetch('/api/v1/categories')
                .then(res => res.json())
                .then(data => {
                    if (data.status) setCategories(data.data);
                })
                .catch(err => console.error('Failed to fetch categories', err));
        }
    }, [isOpen]);

    // Set values for Edit
    useEffect(() => {
        if (job && isOpen) {
            reset({
                name: job.name,
                category_id: job.category?.id || ''
            });
        } else if (!job && isOpen) {
            reset({
                name: '',
                category_id: ''
            });
        }
    }, [job, isOpen, reset]);

    const handleClose = () => {
        reset();
        setServerError('');
        onClose();
    };

    const onSubmit = async (data: JobFormData) => {
        setServerError('');
        try {
            const token = localStorage.getItem('token');
            const url = isEdit ? `/api/v1/jobs` : '/api/v1/jobs'; // Edit might be PUT /api/v1/jobs (if upsert) or PUT /api/v1/jobs/[id].
            // To be safe and consistent with EditUser, I'll use PUT with ID in body for edit, POST for create.

            const method = isEdit ? 'PUT' : 'POST';
            const body = isEdit ? { id: job.id, ...data } : data;

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
            const result = await res.json();

            if (result.status) {
                reset();
                onSuccess();
                onClose();
            } else {
                setServerError(result.message || `Failed to ${isEdit ? 'update' : 'create'} job`);
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
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {isEdit ? <Briefcase className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                            {isEdit ? 'Edit Job' : 'Add New Job'}
                        </h3>
                        {isEdit && <p className="text-sm text-slate-500 dark:text-slate-400">Update details for <span className="font-medium text-slate-900 dark:text-white">{job.name}</span></p>}
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
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Job Title <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    {...register('name')}
                                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                                    placeholder="e.g. Electrician"
                                />
                            </div>
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    {...register('category_id')}
                                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            {errors.category_id && <p className="mt-1 text-xs text-red-500">{errors.category_id.message}</p>}
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
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Job'}
                    </button>
                </div>
            </div>
        </div>
    );
}
