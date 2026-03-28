'use client';

import { Briefcase, Layers, Calendar, Edit, Loader2, Star, Building } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Job {
    id: string;
    name: string;
    category?: { id: string; name: string; industry?: { id: string; name: string } };
    skills?: any[];
    created_at: string;
}

export default function JobDetailsPage() {
    const params = useParams();
    const jobId = params.id as string;
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchJob = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/jobs/${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.status) {
                setJob(json.data);
            }
        } catch (error) {
            console.error('Failed to fetch job:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (jobId) {
            fetchJob();
        }
    }, [jobId]);

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center text-slate-500">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                <span className="ml-3">Loading job details...</span>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center">
                <Briefcase className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Job Not Found</h3>
                <p className="text-slate-500 max-w-sm mt-1">This job may have been deleted.</p>
            </div>
        );
    }

    const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => (
        <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                <p className="text-base font-semibold text-slate-900 dark:text-white mt-0.5 break-all max-w-[200px] sm:max-w-xs">{value || '- -'}</p>
            </div>
        </div>
    );

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column: Visual Identity & Status */}
                <div className="md:w-1/3 flex flex-col items-center text-center space-y-6">
                    <div className="relative group">
                        <div className="w-40 h-40 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden">
                            <Briefcase className="w-16 h-16 text-slate-400" />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{job.name}</h2>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className="text-sm font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-1 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
                                ID: {job.id}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 ring-1 ring-inset ring-blue-600/20">
                                ACTIVE JOB
                            </span>
                        </div>
                        <div className="mt-4 flex justify-center">
                            <Link
                                href={`/admin/jobs/${jobId}/edit`}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm active:scale-95"
                            >
                                <Edit className="w-4 h-4" />
                                Edit Job
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Info Grid & Core Skill Requirements */}
                <div className="md:w-2/3 flex flex-col gap-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DetailItem
                            icon={Building}
                            label="Industry"
                            value={job.category?.industry?.name || 'Unmapped'}
                        />
                        <DetailItem
                            icon={Layers}
                            label="Category"
                            value={job.category?.name || 'Uncategorized'}
                        />
                        <DetailItem
                            icon={Star}
                            label="Required Skills"
                            value={`${job.skills?.length || 0} Listed Skills`}
                        />
                        <DetailItem
                            icon={Calendar}
                            label="Date Registered"
                            value={new Date(job.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        />
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-4 pointer-events-none">
                            <Star className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                            <h3 className="font-semibold text-slate-900 dark:text-white">Assigned Skills Mastery</h3>
                        </div>

                        {job.skills && job.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {job.skills.map((skill: any, idx) => {
                                    const diff = skill.JobSkill?.difficulty_level || 'BASIC';
                                    const badgeConfig = {
                                        'BASIC': 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 ring-1 ring-inset ring-green-600/20',
                                        'INTERMEDIATE': 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 ring-1 ring-inset ring-amber-600/20',
                                        'ADVANCED': 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 ring-1 ring-inset ring-red-600/20'
                                    }[diff as 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'] || 'bg-slate-100 text-slate-700 ring-slate-200';

                                    const labelStr = { 'BASIC': 'Beginner', 'INTERMEDIATE': 'Intermediate', 'ADVANCED': 'Advanced' }[diff as 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'] || 'Beginner';

                                    return (
                                        <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {skill.name || `Skill ID: ${skill.skill_id}`}
                                            <span className={`ml-2 pl-2 border-l border-slate-200 dark:border-slate-600 text-[10px] uppercase font-bold tracking-wider ${badgeConfig.replace('ring-1 ring-inset', '').trim()}`}>
                                                {labelStr}
                                            </span>
                                        </span>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No skills mapped.</p>
                                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Configure skills in edit mode.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
