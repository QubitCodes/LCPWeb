'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useHeader } from '@/components/tailwind/HeaderContext';
import { DataTable } from '@/components/tailwind/ui/DataTable';
import { DollarSign, Eye, CheckCircle, XCircle, Download, AlertTriangle } from 'lucide-react';
import { useAlert } from '@/components/tailwind/ui/AlertDialog';

/**
 * Payment type based on the API response shape.
 */
interface Payment {
    id: string;
    order_id: string;
    provider: 'STRIPE' | 'MANUAL';
    provider_transaction_id?: string;
    amount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    proof_document_url?: string;
    created_at: string;
    order?: {
        id: string;
        total_amount: number;
        status: string;
        company?: { id: string; name: string };
        ordered_by?: { id: string; first_name: string; last_name: string; email: string };
    };
}

/** Status filter tabs */
const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const;

export default function PaymentsPage() {
    const { setTitle, setActions } = useHeader();
    const [data, setData] = useState<Payment[]>([]);
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
    const [viewPayment, setViewPayment] = useState<Payment | null>(null);

    // Confirmation dialog for reject
    const [rejectPayment, setRejectPayment] = useState<Payment | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    // Set Header
    useEffect(() => {
        setTitle('Payments & Invoices');
        setActions(
            <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Download className="w-4 h-4" />
                Export Report
            </button>
        );
    }, [setTitle, setActions]);

    /** Fetch payments from API */
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

            const res = await fetch(`/api/v1/payments?${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();

            if (json.status) {
                setData(json.data || []);
                setTotalCount(json.misc?.total || 0);
            }
        } catch (error) {
            console.error('Failed to fetch payments:', error);
        } finally {
            setLoading(false);
        }
    }, [pageIndex, pageSize, searchTerm, statusFilter]);

    // Debounce search & filters
    useEffect(() => {
        const timer = setTimeout(() => {
            setPageIndex(0);
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter]);

    // Fetch on page change
    useEffect(() => {
        fetchData();
    }, [pageIndex]);

    /**
     * Handle approve/reject action.
     */
    const handleAction = async (paymentId: string, action: 'approve' | 'reject', reason?: string) => {
        setActionLoading(paymentId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/payments/${paymentId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action, reason })
            });
            const json = await res.json();
            if (json.status) {
                fetchData(); // Refresh the list
                setRejectPayment(null);
                setRejectReason('');
            } else {
                showError('Action Failed', json.message || 'Could not process this payment.');
            }
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setActionLoading(null);
        }
    };

    /** Column definitions */
    const columns = useMemo<ColumnDef<Payment>[]>(() => [
        {
            accessorKey: 'id',
            header: 'Transaction ID',
            cell: ({ row }) => (
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {row.original.id.slice(0, 8)}...
                </span>
            )
        },
        {
            id: 'company',
            header: 'Company',
            cell: ({ row }) => (
                <span className="font-medium text-slate-900 dark:text-white">
                    {row.original.order?.company?.name || 'N/A'}
                </span>
            )
        },
        {
            id: 'ordered_by',
            header: 'Ordered By',
            cell: ({ row }) => {
                const user = row.original.order?.ordered_by;
                return user ? (
                    <span className="text-slate-600 dark:text-slate-400 text-sm">
                        {user.first_name} {user.last_name}
                    </span>
                ) : <span className="text-slate-400">—</span>;
            }
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => (
                <span className="font-semibold text-slate-900 dark:text-white">
                    ${Number(row.original.amount).toFixed(2)}
                </span>
            )
        },
        {
            accessorKey: 'provider',
            header: 'Method',
            cell: ({ row }) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.original.provider === 'STRIPE'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                    }`}>
                    {row.original.provider}
                </span>
            )
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorMap[status] || ''}`}>
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
                const payment = row.original;
                const isLoading = actionLoading === payment.id;
                return (
                    <div className="flex items-center justify-end gap-1">
                        <button
                            onClick={() => setViewPayment(payment)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="View Details"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        {payment.status === 'PENDING' && (
                            <>
                                <button
                                    onClick={() => handleAction(payment.id, 'approve')}
                                    disabled={isLoading}
                                    className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50"
                                    title="Approve Payment"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setRejectPayment(payment)}
                                    disabled={isLoading}
                                    className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                    title="Reject Payment"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                );
            }
        }
    ], [actionLoading]);

    return (
        <>
            <div className="space-y-6">
                {/* Status Filter Tabs */}
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

            {/* View Payment Dialog */}
            {viewPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setViewPayment(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-blue-500" />
                            Payment Details
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">ID</span><span className="font-mono text-slate-900 dark:text-white">{viewPayment.id.slice(0, 12)}...</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-semibold text-slate-900 dark:text-white">${Number(viewPayment.amount).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Provider</span><span className="text-slate-900 dark:text-white">{viewPayment.provider}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="text-slate-900 dark:text-white">{viewPayment.status}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Company</span><span className="text-slate-900 dark:text-white">{viewPayment.order?.company?.name || 'N/A'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Ordered By</span><span className="text-slate-900 dark:text-white">{viewPayment.order?.ordered_by ? `${viewPayment.order.ordered_by.first_name} ${viewPayment.order.ordered_by.last_name}` : 'N/A'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="text-slate-900 dark:text-white">{new Date(viewPayment.created_at).toLocaleString()}</span></div>
                            {viewPayment.provider_transaction_id && (
                                <div className="flex justify-between"><span className="text-slate-500">Txn ID</span><span className="font-mono text-slate-900 dark:text-white">{viewPayment.provider_transaction_id}</span></div>
                            )}
                            {viewPayment.proof_document_url && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Proof</span>
                                    <a href={viewPayment.proof_document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Document</a>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setViewPayment(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Confirmation Dialog */}
            {rejectPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setRejectPayment(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Reject Payment
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Are you sure you want to reject this payment of <strong className="text-slate-900 dark:text-white">${Number(rejectPayment.amount).toFixed(2)}</strong>?
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection (optional)..."
                            className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            rows={3}
                        />
                        <div className="mt-4 flex justify-end gap-3">
                            <button onClick={() => { setRejectPayment(null); setRejectReason(''); }} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAction(rejectPayment.id, 'reject', rejectReason)}
                                disabled={actionLoading === rejectPayment.id}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {actionLoading === rejectPayment.id ? 'Rejecting...' : 'Reject Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
