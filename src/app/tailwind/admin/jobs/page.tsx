'use client';

import { useEffect, useState, useMemo } from 'react';
import { useHeader } from '@/components/tailwind/HeaderContext';
import { DataTable } from '@/components/tailwind/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import {
    MoreHorizontal,
    Plus,
    Briefcase,
    BookOpen,
    Layers,
    Eye,
    Pencil
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import JobDialog from './components/JobDialog';
import ViewJobDialog from './components/ViewJobDialog';

// Define Job type based on API response
interface Job {
    id: string;
    name: string;
    category?: { id: string; name: string };
    course?: { id: string; title: string };
    skills?: any[];
    created_at: string;
}

export default function JobsPage() {
    const { setTitle, setActions } = useHeader();
    const router = useRouter();
    const [data, setData] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editJob, setEditJob] = useState<Job | null>(null);
    const [viewJob, setViewJob] = useState<Job | null>(null);

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v1/jobs');
            const json = await res.json();
            if (json.status) {
                setData(json.data);
            }
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    // Set Header
    useEffect(() => {
        setTitle('Jobs');
        setActions(
            <button
                onClick={() => setIsAddOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                title="Add New Job"
            >
                <Plus className="w-4 h-4" />
                Add Job
            </button>
        );
    }, [setTitle, setActions]);

    useEffect(() => {
        fetchData();
    }, []);

    // Columns
    const columns = useMemo<ColumnDef<Job>[]>(() => [
        {
            accessorKey: 'name',
            header: 'Job Title',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center flex-shrink-0 text-orange-600 dark:text-orange-400">
                        <Briefcase className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white">{row.original.name}</span>
                </div>
            )
        },
        {
            accessorKey: 'category',
            header: 'Category',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span>{row.original.category?.name || 'Uncategorized'}</span>
                </div>
            )
        },
        {
            id: 'course_status',
            header: 'Course Status',
            cell: ({ row }) => {
                const hasCourse = !!row.original.course;
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${hasCourse
                            ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                        }`}>
                        {hasCourse ? 'Active' : 'No Course'}
                    </span>
                );
            }
        },
        {
            accessorFn: (row) => row.skills?.length || 0,
            id: 'skills',
            header: 'Skills',
            cell: ({ row }) => <span className="font-mono text-slate-600 dark:text-slate-400">{row.original.skills?.length || 0}</span>
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => setViewJob(row.original)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setEditJob(row.original)}
                        className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded transition-colors"
                        title="Edit Job"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    {row.original.course && (
                        <button
                            onClick={() => router.push(`/tailwind/admin/courses/${row.original.course!.id}`)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded transition-colors"
                            title="Manage Course"
                        >
                            <BookOpen className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )
        }
    ], [router]);

    return (
        <div className="space-y-6">
            <DataTable
                columns={columns}
                data={data}
                isLoading={loading}
            />

            <JobDialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={fetchData}
            />

            <JobDialog
                isOpen={!!editJob}
                onClose={() => setEditJob(null)}
                onSuccess={fetchData}
                job={editJob}
            />

            <ViewJobDialog
                isOpen={!!viewJob}
                onClose={() => setViewJob(null)}
                job={viewJob}
            />
        </div>
    );
}
