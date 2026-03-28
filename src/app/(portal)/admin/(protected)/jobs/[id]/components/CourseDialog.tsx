'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, X, Plus, Save, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/Toast';

const schema = z.object({
    title: z.string().min(2, 'Title is required'),
    description: z.string().optional(),
    is_active: z.boolean()
});

type FormData = z.infer<typeof schema>;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    jobId: string;
    course?: any | null;
}

export default function CourseDialog({ isOpen, onClose, onSuccess, jobId, course }: Props) {
    const toast = useToast();
    const [submitting, setSubmitting] = useState(false);

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: '',
            description: '',
            is_active: true
        }
    });

    useEffect(() => {
        if (isOpen && course) {
            reset({
                title: course.title || '',
                description: course.description || '',
                is_active: course.is_active !== false
            });
        } else if (isOpen) {
            reset({
                title: '',
                description: '',
                is_active: true
            });
        }
    }, [isOpen, course, reset]);

    const handleClose = () => {
        reset();
        onClose();
    };

    const onSubmit = async (data: FormData) => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const url = '/api/v1/courses';
            const method = course ? 'PUT' : 'POST';
            
            const payload = course 
                ? { ...data, id: course.id }
                : { ...data, job_id: parseInt(jobId) };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            
            if (res.ok && json.status) {
                toast.success('Success', `Course ${course ? 'updated' : 'added'} successfully.`);
                onSuccess();
                handleClose();
            } else {
                toast.error('Error', json.message || 'Operation failed.');
            }
        } catch (error) {
            console.error('Submit Error:', error);
            toast.error('Error', 'An unexpected error occurred.');
        } finally {
            setSubmitting(false);
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
                            {course ? <BookOpen className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                            {course ? 'Edit Certification Course' : 'Add New Course'}
                        </h3>
                        {course && <p className="text-sm text-slate-500 dark:text-slate-400">Update details for <span className="font-medium text-slate-900 dark:text-white">{course.title}</span></p>}
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="course-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Course Title</label>
                            <input
                                {...register('title')}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
                            <textarea
                                {...register('description')}
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Controller
                                control={control}
                                name="is_active"
                                render={({ field: { onChange, value } }) => (
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={value}
                                            onChange={(e) => onChange(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                                        <span className="ml-3 text-sm font-medium text-slate-900 dark:text-slate-300">Set as Active</span>
                                    </div>
                                )}
                            />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3 sticky bottom-0">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg transition-colors border border-transparent"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="course-form"
                        disabled={submitting}
                        className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : course ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {submitting ? 'Saving...' : course ? 'Save Changes' : 'Create Course'}
                    </button>
                </div>
            </div>
        </div>
    );
}
