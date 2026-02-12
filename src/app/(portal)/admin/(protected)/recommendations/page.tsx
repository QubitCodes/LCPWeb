'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useHeader } from '@/components/HeaderContext';
import { DataTable } from '@/components/ui/DataTable';
import { CheckCircle, XCircle, Eye, Award } from 'lucide-react';
import { useAlert } from '@/components/ui/AlertDialog';

/**
 * Recommendation type based on API response.
 */
interface Recommendation {
    id: string;
    worker_id: string;
    company_id: string;
    course_level_id: string;
    recommended_by_id: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    admin_comment?: string;
    approved_by_admin_id?: string;
    created_at: string;
    updated_at: string;
    worker?: { id: string; first_name: string; last_name: string; email: string };
    level?: { id: string; title: string; level_number: number; course?: { id: string; title: string } };
    recommender?: { id: string; first_name: string; last_name: string };
    company?: { id: string; name: string };
    admin?: { id: string; first_name: string; last_name: string };
}

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const;

export default function RecommendationsPage() {
    const { setTitle, setActions } = useHeader();
    const [data, setData] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { error: showError } = useAlert();

    // Pagination
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // Detail dialog
    const [viewRec, setViewRec] = useState<Recommendation | null>(null);

    // Admin action dialog
    const [actionRec, setActionRec] = useState<{ rec: Recommendation; action: 'APPROVED' | 'REJECTED' } | null>(null);
    const [adminComment, setAdminComment] = useState('');

    useEffect(() => {
        setTitle('Pending Approvals');
        setActions(null);
    }, [setTitle, setActions]);

    /** Fetch recommendations */
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

            const res = await fetch(`/api/v1/recommendations?${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();

            if (json.status) {
                setData(json.data || []);
                setTotalCount(json.misc?.total || 0);
            }
        } catch (error) {
            console.error('Failed to fetch recommendations:', error);
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

    /** Handle approve/reject */
    const handleStatusUpdate = async () => {
        if (!actionRec) return;
        setActionLoading(actionRec.rec.id);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/recommendations/${actionRec.rec.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: actionRec.action,
                    comment: adminComment
                })
            });
            const json = await res.json();
            if (json.status) {
                fetchData();
                setActionRec(null);
                setAdminComment('');
            } else {
                showError('Action Failed', json.message || 'Could not process this recommendation.');
            }
        } catch (error) {
            console.error('Status update failed:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const columns = useMemo<ColumnDef<Recommendation>[]>(() => [
        {
            id: 'worker',
            header: 'Worker',
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
            id: 'level',
            header: 'Level / Course',
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
                <span className="text-sm text-slate-600 dark:text-slate-400">{row.original.company?.name || '—'}</span>
            )
        },
        {
            id: 'recommender',
            header: 'Recommended By',
            cell: ({ row }) => {
                const r = row.original.recommender;
                return r ? (
                    <span className="text-sm text-slate-600 dark:text-slate-400">{r.first_name} {r.last_name}</span>
                ) : <span className="text-slate-400">—</span>;
            }
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                const colorMap: Record<string, string> = {
                    PENDING: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20',
                    APPROVED: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-200 dark:border-green-500/20',
                    REJECTED: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20'
                };
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorMap[status]}`}>
                        {status}
                    </span>
                );
            }
        },
        {
            accessorKey: 'created_at',
            header: 'Date',
            cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString()
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const rec = row.original;
                return (
                    <div className="flex items-center justify-end gap-1">
                        <button
                            onClick={() => setViewRec(rec)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="View Details"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        {rec.status === 'PENDING' && (
                            <>
                                <button
                                    onClick={() => { setActionRec({ rec, action: 'APPROVED' }); setAdminComment(''); }}
                                    className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
                                    title="Approve"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => { setActionRec({ rec, action: 'REJECTED' }); setAdminComment(''); }}
                                    className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Reject"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                );
            }
        }
    ], []);

    return (
        <>
            <div className="space-y-6">
                {/* Status Tabs */}
                <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === tab
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

            {/* View Recommendation Dialog */}
            {viewRec && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setViewRec(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-blue-500" />
                            Recommendation Details
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">Worker</span><span className="text-slate-900 dark:text-white">{viewRec.worker ? `${viewRec.worker.first_name} ${viewRec.worker.last_name}` : '—'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Course / Level</span><span className="text-slate-900 dark:text-white">{viewRec.level ? `${viewRec.level.course?.title || ''} — ${viewRec.level.title}` : '—'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Company</span><span className="text-slate-900 dark:text-white">{viewRec.company?.name || '—'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Recommended By</span><span className="text-slate-900 dark:text-white">{viewRec.recommender ? `${viewRec.recommender.first_name} ${viewRec.recommender.last_name}` : '—'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="text-slate-900 dark:text-white">{viewRec.status}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="text-slate-900 dark:text-white">{new Date(viewRec.created_at).toLocaleString()}</span></div>
                            <div className="mt-3">
                                <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Reason</span>
                                <p className="mt-1 text-slate-900 dark:text-white text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">{viewRec.reason}</p>
                            </div>
                            {viewRec.admin_comment && (
                                <div className="mt-3">
                                    <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Admin Comment</span>
                                    <p className="mt-1 text-slate-900 dark:text-white text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">{viewRec.admin_comment}</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setViewRec(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve/Reject Confirmation Dialog */}
            {actionRec && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setActionRec(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className={`text-lg font-semibold mb-2 flex items-center gap-2 ${actionRec.action === 'APPROVED' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {actionRec.action === 'APPROVED' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            {actionRec.action === 'APPROVED' ? 'Approve' : 'Reject'} Recommendation
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            {actionRec.action === 'APPROVED' ? 'Approve' : 'Reject'} the recommendation for <strong className="text-slate-900 dark:text-white">{actionRec.rec.worker?.first_name} {actionRec.rec.worker?.last_name}</strong>?
                        </p>
                        <textarea
                            value={adminComment}
                            onChange={(e) => setAdminComment(e.target.value)}
                            placeholder="Admin comment (optional)..."
                            className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={3}
                        />
                        <div className="mt-4 flex justify-end gap-3">
                            <button onClick={() => setActionRec(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                            <button
                                onClick={handleStatusUpdate}
                                disabled={actionLoading === actionRec.rec.id}
                                className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${actionRec.action === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                {actionLoading === actionRec.rec.id ? 'Processing...' : (actionRec.action === 'APPROVED' ? 'Approve' : 'Reject')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
