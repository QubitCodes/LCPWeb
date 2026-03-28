'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { BookOpen, Edit, Eye, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import CourseDialog from '../components/CourseDialog';

export default function JobCoursesTab() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const jobId = params.id as string;
    
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [strictMapping, setStrictMapping] = useState(true);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editCourse, setEditCourse] = useState<any | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [coursesRes, settingsRes] = await Promise.all([
                fetch('/api/v1/courses', { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' }),
                fetch('/api/v1/settings', { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' })
            ]);

            const coursesJson = await coursesRes.json();
            const settingsJson = await settingsRes.json();

            if (settingsJson.status) {
                if (settingsJson.data?.['course.strict_job_mapping'] !== undefined) {
                    const strictVal = settingsJson.data['course.strict_job_mapping'];
                    setStrictMapping(strictVal === true || strictVal === 'true');
                }
            }

            if (coursesJson.status && Array.isArray(coursesJson.data)) {
                const jobCourses = coursesJson.data.filter((c: any) => String(c.job_id) === String(jobId) || (c.job && String(c.job.id) === String(jobId)));
                setCourses(jobCourses);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Error', 'Failed to load courses.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (jobId) {
            fetchData();
        }
    }, [jobId]);

    const columns = useMemo<ColumnDef<any>[]>(() => [
        {
            accessorKey: 'title',
            header: 'Course Title',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="font-medium text-slate-900 dark:text-white block">{row.original.title}</span>
                        {row.original.description && <span className="text-xs text-slate-500 truncate max-w-[200px] block">{row.original.description}</span>}
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.original.is_active !== false 
                    ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' 
                    : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                    {row.original.is_active !== false ? 'Active' : 'Archived'}
                </span>
            )
        },
        {
            accessorFn: (row) => row.levels?.length || 0,
            id: 'levels',
            header: 'Configured Levels',
            cell: ({ row }) => <span className="text-slate-600 dark:text-slate-400">{row.original.levels?.length || 0} Levels</span>
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => router.push(`/admin/courses/${row.original.id}`)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors"
                        title="View Course Curriculum"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setEditCourse(row.original)}
                        className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded transition-colors"
                        title="Edit Course Details"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ], [router]);

    return (
        <div className="p-6 md:p-8">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Attached Courses</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage the certification programs built for this structural hierarchy.</p>
                </div>
                
                {(!strictMapping || courses.length === 0) && (
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Add Course
                    </button>
                )}
            </div>

            <DataTable
                columns={columns}
                data={courses}
                isLoading={loading}
            />

            <CourseDialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={fetchData}
                jobId={jobId}
            />

            <CourseDialog
                isOpen={!!editCourse}
                onClose={() => setEditCourse(null)}
                onSuccess={fetchData}
                jobId={jobId}
                course={editCourse}
            />
        </div>
    );
}
