'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useHeader } from '@/components/tailwind/HeaderContext';
import { DataTable } from '@/components/tailwind/ui/DataTable';
import { Eye, GraduationCap, Calendar } from 'lucide-react';

/**
 * Enrollment type based on the API response shape.
 */
interface Enrollment {
    id: string;
    worker_id: string;
    course_level_id: string;
    start_date: string;
    deadline_date: string;
    status: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
    completion_date?: string;
    created_at: string;
    worker?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        company?: { id: string; name: string };
    };
    level?: {
        id: string;
        title: string;
        level_number: number;
        course?: { id: string; title: string };
    };
}

const STATUS_TABS = ['ALL', 'ACTIVE', 'COMPLETED', 'FAILED', 'EXPIRED'] as const;

export default function EnrollmentsPage() {
    const { setTitle, setActions } = useHeader();
    const [data, setData] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Pagination
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // Detail dialog
    const [viewEnrollment, setViewEnrollment] = useState<Enrollment | null>(null);

    useEffect(() => {
        setTitle('Student Enrollments');
        setActions(null);
    }, [setTitle, setActions]);

    /** Fetch enrollments from API */
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const page = pageIndex + 1;
            const query = new URLSearchParams({
                page: page.toString(),
                limit: pageSize.toString(),
                ...(searchTerm && { search: searchTerm }),
                ...(statusFilter !== 'ALL' && { status: statusFilter })
            });

            const res = await fetch(`/api/v1/enrollments?${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();

            if (json.status) {
                setData(json.data || []);
                setTotalCount(json.misc?.total || 0);
            }
        } catch (error) {
            console.error('Failed to fetch enrollments:', error);
        } finally {
            setLoading(false);
        }
    }, [pageIndex, pageSize, searchTerm, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPageIndex(0);
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter]);

    useEffect(() => {
        fetchData();
    }, [pageIndex]);

    /** Calculate progress based on dates */
    const calcProgress = (enrollment: Enrollment): number => {
        if (enrollment.status === 'COMPLETED') return 100;
        if (enrollment.status === 'FAILED' || enrollment.status === 'EXPIRED') return 0;
        const start = new Date(enrollment.start_date).getTime();
        const deadline = new Date(enrollment.deadline_date).getTime();
        const now = Date.now();
        if (now >= deadline) return 100;
        if (now <= start) return 0;
        return Math.round(((now - start) / (deadline - start)) * 100);
    };

    const columns = useMemo<ColumnDef<Enrollment>[]>(() => [
        {
            id: 'worker',
            header: 'Student',
            cell: ({ row }) => {
                const w = row.original.worker;
                return w ? (
                    <div>
                        <span className="font-medium text-slate-900 dark:text-white text-sm">{w.first_name} {w.last_name}</span>
                        <span className="block text-xs text-slate-500">{w.email}</span>
                    </div>
                ) : <span className="text-slate-400">—</span>;
            }
        },
        {
            id: 'course_level',
            header: 'Course / Level',
            cell: ({ row }) => {
                const l = row.original.level;
                return l ? (
                    <div>
                        <span className="font-medium text-slate-900 dark:text-white text-sm">{l.title}</span>
                        {l.course && <span className="block text-xs text-slate-500">{l.course.title}</span>}
                    </div>
                ) : <span className="text-slate-400">—</span>;
            }
        },
        {
            id: 'company',
            header: 'Company',
            cell: ({ row }) => (
                <span className="text-sm text-slate-600 dark:text-slate-400">
                    {row.original.worker?.company?.name || '—'}
                </span>
            )
        },
        {
            id: 'progress',
            header: 'Progress',
            cell: ({ row }) => {
                const progress = calcProgress(row.original);
                return (
                    <div className="w-full max-w-[120px]">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600 dark:text-slate-400">{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${progress === 100
                                        ? 'bg-green-500'
                                        : progress > 50
                                            ? 'bg-blue-600'
                                            : 'bg-amber-500'
                                    }`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                const colorMap: Record<string, string> = {
                    ACTIVE: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
                    COMPLETED: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-200 dark:border-green-500/20',
                    FAILED: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20',
                    EXPIRED: 'bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20'
                };
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorMap[status] || ''}`}>
                        {status}
                    </span>
                );
            }
        },
        {
            accessorKey: 'start_date',
            header: 'Start Date',
            cell: ({ row }) => new Date(row.original.start_date).toLocaleDateString()
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <button
                    onClick={() => setViewEnrollment(row.original)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="View Details"
                >
                    <Eye className="w-4 h-4" />
                </button>
            )
        }
    ], []);

    return (
        <>
            <div className="space-y-6">
                {/* Status Tabs */}
                <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-3 overflow-x-auto">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === tab
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                <DataTable
                    columns={columns}
                    data={data}
                    isLoading={loading}
                    searchable={true}
                    onSearch={setSearchTerm}
                    pagination={{
                        pageIndex,
                        pageSize,
                        totalCount,
                        pageCount: Math.ceil(totalCount / pageSize),
                        onPageChange: setPageIndex
                    }}
                />
            </div>

            {/* View Enrollment Dialog */}
            {viewEnrollment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setViewEnrollment(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-blue-500" />
                            Enrollment Details
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">Student</span><span className="text-slate-900 dark:text-white">{viewEnrollment.worker ? `${viewEnrollment.worker.first_name} ${viewEnrollment.worker.last_name}` : '—'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="text-slate-900 dark:text-white">{viewEnrollment.worker?.email || '—'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Company</span><span className="text-slate-900 dark:text-white">{viewEnrollment.worker?.company?.name || '—'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Course</span><span className="text-slate-900 dark:text-white">{viewEnrollment.level?.course?.title || '—'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Level</span><span className="text-slate-900 dark:text-white">{viewEnrollment.level?.title || '—'} (Level {viewEnrollment.level?.level_number || '—'})</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="text-slate-900 dark:text-white">{viewEnrollment.status}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Start Date</span><span className="text-slate-900 dark:text-white">{new Date(viewEnrollment.start_date).toLocaleDateString()}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Deadline</span><span className="text-slate-900 dark:text-white">{new Date(viewEnrollment.deadline_date).toLocaleDateString()}</span></div>
                            {viewEnrollment.completion_date && (
                                <div className="flex justify-between"><span className="text-slate-500">Completed</span><span className="text-slate-900 dark:text-white">{new Date(viewEnrollment.completion_date).toLocaleDateString()}</span></div>
                            )}
                            <div className="mt-3">
                                <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Progress</span>
                                <div className="mt-2 h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${viewEnrollment.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-600'}`}
                                        style={{ width: `${calcProgress(viewEnrollment)}%` }}
                                    />
                                </div>
                                <span className="text-xs text-slate-500 mt-1 block">{calcProgress(viewEnrollment)}% complete</span>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setViewEnrollment(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
