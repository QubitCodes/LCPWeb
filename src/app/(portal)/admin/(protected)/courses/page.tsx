'use client';

import { useEffect, useState, useMemo } from 'react';
import { useHeader } from '@/components/HeaderContext';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import {
    MoreHorizontal,
    Plus,
    GraduationCap,
    Clock,
    CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Define Course type based on API response
interface Course {
    id: string;
    title: string;
    job?: { name: string };
    levels?: any[];
    is_active: boolean;
    created_at: string;
}

export default function CoursesPage() {
    const { setTitle, setActions } = useHeader();
    const router = useRouter();
    const [data, setData] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    // Set Header
    useEffect(() => {
        setTitle('Courses');
        // No explicit "Add Course" in legacy page header, but maybe needed?
        // Legacy page header just says "Courses".
        // But table has actions.
        // I'll add an "Add Course" button for consistency if it makes sense, 
        // or just leave it empty if legacy didn't have it (Legacy didn't seem to have a top-level add button in the screenshot/code view, 
        // wait, I checked code, step 1195: No Add button in header, only "Courses" title).
        // But commonly admins need to add courses. I'll stick to legacy for now (no button), 
        // OR add it if "Add Job" creates course?
        // Actually, let's look at `JobsPage`... "Manage Course" implies course is linked to Job.
        // I'll leave header clean for now to be "exact".
    }, [setTitle, setActions]);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/v1/courses');
                const json = await res.json();
                if (json.status) {
                    setData(json.data);
                }
            } catch (error) {
                console.error('Failed to fetch courses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Columns
    const columns = useMemo<ColumnDef<Course>[]>(() => [
        {
            accessorKey: 'title',
            header: 'Course Title',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400">
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white">{row.original.title}</span>
                </div>
            )
        },
        {
            accessorKey: 'job',
            header: 'Linked Job',
            cell: ({ row }) => <span className="text-slate-600 dark:text-slate-400">{row.original.job?.name || 'Unknown'}</span>
        },
        {
            accessorFn: (row) => row.levels?.length || 0,
            id: 'modules',
            header: 'Modules',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-mono">{row.original.levels?.length || 0}</span>
                    <span className="text-xs text-slate-500">Levels</span>
                </div>
            )
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.original.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                    {row.original.is_active ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => router.push(`/admin/courses/${row.original.id}`)}
                        className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded transition-colors"
                        title="Manage Content"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
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
        </div>
    );
}
