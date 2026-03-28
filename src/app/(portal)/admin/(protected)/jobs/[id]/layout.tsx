'use client';

import { useHeader } from '@/components/HeaderContext';
import { Briefcase, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Job {
    id: string;
    name: string;
}

export default function JobLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { setTitle, setActions } = useHeader();
    const pathname = usePathname();
    const params = useParams();
    const jobId = params.id as string;
    const [job, setJob] = useState<Job | null>(null);

    const tabs = [
        { name: 'Details', href: `/admin/jobs/${jobId}`, icon: Briefcase },
        { name: 'Courses', href: `/admin/jobs/${jobId}/courses`, icon: BookOpen },
    ];

    useEffect(() => {
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
                console.error('Failed to fetch job header details:', error);
            }
        };

        if (jobId) {
            fetchJob();
        }
    }, [jobId]);

    useEffect(() => {
        setTitle(job ? `Job: ${job.name}` : 'Job Details');
        setActions(null); 
    }, [job, setTitle, setActions]);

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="border-b border-slate-200 dark:border-slate-800">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = pathname === tab.href;

                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={`
                                    group inline-flex items-center whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                                    ${isActive
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-300'
                                    }
                                `}
                            >
                                <Icon
                                    className={`
                                        -ml-0.5 mr-2 h-5 w-5
                                        ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 flex-shrink-0 dark:group-hover:text-slate-400'}
                                    `}
                                    aria-hidden="true"
                                />
                                {tab.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Content Area */}
            <div className="bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 rounded-xl overflow-hidden">
                {children}
            </div>
        </div>
    );
}
