'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Briefcase, Layers, Save, ArrowLeft, Star, Plus, Trash2, Building } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';

// Support an array for nested dynamic skills
const skillSubSchema = z.object({
    skill_id: z.string().min(1, 'Skill is required'),
    level: z.string().min(1, 'Difficulty is required')
});

const jobSchema = z.object({
    name: z.string().min(2, 'Job name is required'),
    category_id: z.string().min(1, 'Category is required'),
    skills: z.array(skillSubSchema).optional()
});

type JobFormData = z.infer<typeof jobSchema>;

export default function EditJobPage() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const jobId = params.id as string;

    const [industries, setIndustries] = useState<{ id: string; name: string }[]>([]);
    const [categories, setCategories] = useState<{ id: string; name: string; industry_id: string | number }[]>([]);
    const [masterSkills, setMasterSkills] = useState<{ id: string; name: string }[]>([]);
    const [selectedIndustry, setSelectedIndustry] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<JobFormData>({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            name: '',
            category_id: '',
            skills: []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'skills'
    });

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = localStorage.getItem('token');

                // Fetch Industries + Categories + Skills simultaneously 
                const [indRes, catRes, skillRes, jobRes] = await Promise.all([
                    fetch('/api/v1/industries', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/v1/categories', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/v1/skills', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`/api/v1/jobs/${jobId}`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                const indData = await indRes.json();
                const catData = await catRes.json();
                const skillData = await skillRes.json();
                const jobData = await jobRes.json();
                
                if (indData.status) setIndustries(indData.data);
                if (catData.status) setCategories(catData.data);
                if (skillData.status) setMasterSkills(skillData.data);

                if (jobData.status && jobData.data) {
                    const job = jobData.data;

                    // Automatically select the correct parent industry if category exists
                    if (job.category?.id && catData.data) {
                        const matchedCat = catData.data.find((c: any) => c.id === job.category.id);
                        if (matchedCat && matchedCat.industry_id) {
                            setSelectedIndustry(matchedCat.industry_id.toString());
                        }
                    }

                    // Parse existing mapping to UI schema
                    const existingSkills = job.skills ? job.skills.map((s: any) => ({
                        skill_id: s.skill_id || s.id,
                        level: s.JobSkill?.difficulty_level || 'BASIC'
                    })) : [];

                    reset({
                        name: job.name || '',
                        category_id: job.category?.id || '',
                        skills: existingSkills
                    });
                } else {
                    toast.error('Error', jobData.message || 'Failed to load job details.');
                }
            } catch (error) {
                console.error('Failed to load edit dependencies:', error);
                toast.error('Error', 'A network error occurred while loading data.');
            } finally {
                setLoading(false);
            }
        };

        if (jobId) fetchInitialData();
    }, [jobId, reset]);

    const onSubmit = async (data: JobFormData) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/jobs`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: jobId, ...data })
            });
            const result = await res.json();

            if (result.status) {
                toast.success('Settings Saved', 'Job definition updated successfully!');
                setTimeout(() => {
                    router.push(`/admin/jobs/${jobId}`);
                    router.refresh();
                }, 1000);
            } else {
                toast.error('Save Failed', result.message || 'Failed to update job');
            }
        } catch (error) {
            toast.error('Error', 'An unexpected error occurred during update.');
        }
    };

    if (loading) {
        return (
            <div className="p-12 flex justify-center items-center text-slate-500">
                <Loader2 className="animate-spin w-8 h-8 text-blue-600 mr-3" />
                <span>Loading definitions...</span>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Job Details</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update basic information and assign required skills.</p>
                </div>
                <Link
                    href={`/admin/jobs/${jobId}`}
                    className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Details
                </Link>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Core Parameters Block */}
                    <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                            <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            Basic Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Job Title <span className="text-red-500">*</span></label>
                                <input
                                    {...register('name')}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                                    placeholder="e.g. Master Electrician"
                                />
                                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Industry <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        value={selectedIndustry}
                                        onChange={(e) => {
                                            setSelectedIndustry(e.target.value);
                                            reset({ ...control._formValues, category_id: '' } as any);
                                        }}
                                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option value="">Select Industry...</option>
                                        {industries.map(ind => (
                                            <option key={ind.id} value={ind.id}>{ind.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        {...register('category_id')}
                                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option value="">Select Category...</option>
                                    {categories.filter(c => c.industry_id?.toString() === selectedIndustry).map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            {errors.category_id && <p className="mt-1 text-xs text-red-500">{errors.category_id.message}</p>}
                            {!selectedIndustry && <p className="mt-1 text-xs text-slate-500">Select an industry first</p>}
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Skills Editor */}
                    <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2 mb-5">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <Star className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                                Required Skills
                            </h4>
                            <button
                                type="button"
                                onClick={() => append({ skill_id: '', level: 'BASIC' })}
                                className="text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Skill
                            </button>
                        </div>

                        {fields.length === 0 ? (
                            <div className="text-center py-8 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                                <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-slate-500 dark:text-slate-400 text-sm">No skills assigned yet. Click "Add Skill" to get started.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex flex-col sm:flex-row items-end gap-3 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <div className="w-full sm:flex-1">
                                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Select Skill</label>
                                            <select
                                                {...register(`skills.${index}.skill_id` as const)}
                                                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            >
                                                <option value="">Choose Skill...</option>
                                                {masterSkills.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                            {errors?.skills?.[index]?.skill_id && <p className="text-xs text-red-500 mt-1">{errors.skills[index]?.skill_id?.message}</p>}
                                        </div>
                                        <div className="w-full sm:w-1/3">
                                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Difficulty Level</label>
                                            <select
                                                {...register(`skills.${index}.level` as const)}
                                                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            >
                                                <option value="BASIC">Beginner / Foundation</option>
                                            <option value="INTERMEDIATE">Intermediate / Practitioner</option>
                                            <option value="ADVANCED">Advanced / Expert</option>
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="h-10 px-3 inline-flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors self-end w-full sm:w-auto"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Submitter Box */}
                <div className="pt-4 flex justify-end gap-3 sticky bottom-4 z-10">
                    <Link
                        href={`/admin/jobs/${jobId}`}
                        className="px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
