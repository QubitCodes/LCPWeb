'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useHeader } from '@/components/HeaderContext';
import { DataTable } from '@/components/ui/DataTable';
import { History, Eye, Code } from 'lucide-react';

/**
 * AuditLog type based on the API response shape.
 */
interface AuditLog {
    id: string;
    user_id?: string;
    action: string;
    entity_type?: string;
    entity_id?: string;
    details?: any;
    ip_address?: string;
    created_at: string;
    actor?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        role: string;
    };
}

export default function AuditLogsPage() {
    const { setTitle, setActions } = useHeader();
    const [data, setData] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize] = useState(25);
    const [totalCount, setTotalCount] = useState(0);

    // Detail dialog
    const [viewLog, setViewLog] = useState<AuditLog | null>(null);

    // Set Header
    useEffect(() => {
        setTitle('Audit Logs');
        setActions(null);
    }, [setTitle, setActions]);

    /** Fetch audit logs from API */
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const page = pageIndex + 1;
            const query = new URLSearchParams({
                page: page.toString(),
                limit: pageSize.toString(),
                ...(searchTerm && { search: searchTerm })
            });

            const res = await fetch(`/api/v1/audit-logs?${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();

            if (json.status) {
                setData(json.data || []);
                setTotalCount(json.misc?.total || 0);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    }, [pageIndex, pageSize, searchTerm]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPageIndex(0);
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch on page change
    useEffect(() => {
        fetchData();
    }, [pageIndex]);

    /** Column definitions */
    const columns = useMemo<ColumnDef<AuditLog>[]>(() => [
        {
            accessorKey: 'created_at',
            header: 'Timestamp',
            cell: ({ row }) => {
                const d = new Date(row.original.created_at);
                return (
                    <div className="text-xs">
                        <span className="block font-medium text-slate-900 dark:text-white">{d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="block text-slate-500 dark:text-slate-400">{d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                );
            }
        },
        {
            id: 'actor_name',
            header: 'User',
            cell: ({ row }) => {
                const actor = row.original.actor;
                return actor ? (
                    <div>
                        <span className="font-medium text-slate-900 dark:text-white text-sm">
                            {actor.first_name} {actor.last_name}
                        </span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">{actor.email}</span>
                    </div>
                ) : <span className="text-slate-400">System</span>;
            }
        },
        {
            accessorKey: 'action',
            header: 'Action',
            cell: ({ row }) => {
                const raw = row.original.action;
                const label = raw.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase());
                return (
                    <div className="text-xs">
                        <span className="block font-medium text-slate-900 dark:text-white">{label}</span>
                        <span className="block text-slate-400 dark:text-slate-500 font-mono">{raw}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: 'entity_type',
            header: 'Entity',
            cell: ({ row }) => (
                <span className="text-sm text-slate-600 dark:text-slate-400">
                    {row.original.entity_type || '—'}
                </span>
            )
        },
        {
            accessorKey: 'entity_id',
            header: 'Entity ID',
            cell: ({ row }) => (
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {row.original.entity_id ? `${row.original.entity_id.slice(0, 8)}...` : '—'}
                </span>
            )
        },
        {
            accessorKey: 'ip_address',
            header: 'IP Address',
            cell: ({ row }) => (
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {row.original.ip_address || '—'}
                </span>
            )
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <button
                    onClick={() => setViewLog(row.original)}
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

            {/* View Audit Log Dialog */}
            {viewLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setViewLog(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <History className="w-5 h-5 text-blue-500" />
                            Audit Log Details
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Timestamp</span>
                                <span className="font-mono text-slate-900 dark:text-white">{new Date(viewLog.created_at).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">User</span>
                                <span className="text-slate-900 dark:text-white">{viewLog.actor ? `${viewLog.actor.first_name} ${viewLog.actor.last_name}` : 'System'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Action</span>
                                <span className="font-mono text-slate-900 dark:text-white">{viewLog.action}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Entity</span>
                                <span className="text-slate-900 dark:text-white">{viewLog.entity_type || '—'} / {viewLog.entity_id?.slice(0, 12) || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">IP</span>
                                <span className="font-mono text-slate-900 dark:text-white">{viewLog.ip_address || '—'}</span>
                            </div>

                            {/* Details Table — always shown */}
                            <DetailsTable details={viewLog.details} />
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setViewLog(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/**
 * Flatten a nested object into dot-notation key/value pairs.
 * e.g. { user: { name: 'John' } } → [['user.name', 'John']]
 */
function flattenObject(obj: Record<string, any>, prefix = ''): [string, string][] {
    const entries: [string, string][] = [];
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            entries.push(...flattenObject(value, fullKey));
        } else {
            entries.push([fullKey, value === null ? 'null' : String(value)]);
        }
    }
    return entries;
}

/**
 * DetailsTable — renders audit log details as a searchable key/value table.
 * Flattens nested objects into dot-notation keys for readability.
 */
function DetailsTable({ details }: { details?: any }) {
    const [filter, setFilter] = useState('');

    if (!details || typeof details !== 'object' || Object.keys(details).length === 0) {
        return (
            <div className="mt-4">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Code className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Details</span>
                </div>
                <p className="text-sm text-slate-400 dark:text-slate-500 italic">No details recorded for this action.</p>
            </div>
        );
    }

    const allRows = flattenObject(details);
    const lowerFilter = filter.toLowerCase();
    const filteredRows = lowerFilter
        ? allRows.filter(([k, v]) => k.toLowerCase().includes(lowerFilter) || v.toLowerCase().includes(lowerFilter))
        : allRows;

    return (
        <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-slate-500">
                    <Code className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Details</span>
                </div>
                <input
                    type="text"
                    placeholder="Filter…"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-2 py-1 text-xs w-36 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left px-3 py-2 text-slate-500 dark:text-slate-400 font-medium">Data</th>
                            <th className="text-left px-3 py-2 text-slate-500 dark:text-slate-400 font-medium">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.length > 0 ? filteredRows.map(([key, value]) => (
                            <tr key={key} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                                <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">{key}</td>
                                <td className="px-3 py-2 text-slate-900 dark:text-white break-all">{value}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={2} className="px-3 py-3 text-center text-slate-400 italic">No matching entries</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
