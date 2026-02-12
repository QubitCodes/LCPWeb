'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useHeader } from '@/components/HeaderContext';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import {
    ArrowLeft,
    Eye,
    UserCheck,
    Users,
    Mail,
    Phone,
    Loader2,
    X,
    Building2,
    Calendar,
    Shield,
    User
} from 'lucide-react';

/**
 * User type for the people list.
 */
interface Person {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    role: string;
    is_active: boolean;
    created_at: string;
}

/**
 * Company info fetched for the header.
 */
interface CompanyInfo {
    id: string;
    name: string;
}

/**
 * Company People page — shows Supervisors and Workers for a given company.
 * Accessible via /admin/companies/[id]/people?tab=supervisors|workers
 *
 * - Tab switches use router.replace so they don't clutter browser history.
 * - Workers get an Eye icon to navigate to the worker profile with tabs.
 * - Supervisors get an Eye icon that opens a lightweight inline detail dialog (no tabs needed).
 */
export default function CompanyPeoplePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { setTitle, setActions } = useHeader();

    const companyId = params?.id as string;
    const activeTab = searchParams?.get('tab') || 'supervisors';

    const [people, setPeople] = useState<Person[]>([]);
    const [company, setCompany] = useState<CompanyInfo | null>(null);
    const [loading, setLoading] = useState(true);

    /** Supervisor detail dialog state */
    const [viewSupervisor, setViewSupervisor] = useState<Person | null>(null);

    /** Fetch company info */
    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/v1/companies?search=${companyId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.status && json.data?.length > 0) {
                    setCompany(json.data[0]);
                }
            } catch (err) {
                console.error('Failed to fetch company:', err);
            }
        };
        if (companyId) fetchCompany();
    }, [companyId]);

    /** Fetch people by role */
    const fetchPeople = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const role = activeTab === 'supervisors' ? 'SUPERVISOR' : 'WORKER';
            const res = await fetch(`/api/v1/users?company_id=${companyId}&role=${role}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.status) {
                setPeople(json.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch people:', err);
        } finally {
            setLoading(false);
        }
    }, [companyId, activeTab]);

    useEffect(() => {
        if (companyId) fetchPeople();
    }, [companyId, activeTab, fetchPeople]);

    /** Set header */
    useEffect(() => {
        setTitle(company ? `${company.name} — People` : 'Company People');
        setActions(
            <button
                onClick={() => router.push('/admin/companies')}
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Companies
            </button>
        );
    }, [setTitle, setActions, company, router]);

    /** Column definitions */
    const columns = useMemo<ColumnDef<Person>[]>(() => [
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => (
                <div>
                    <span className="font-medium text-slate-900 dark:text-white text-sm">
                        {row.original.first_name} {row.original.last_name}
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {row.original.email}
                    </span>
                </div>
            )
        },
        {
            accessorKey: 'phone_number',
            header: 'Phone',
            cell: ({ row }) => (
                <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {row.original.phone_number || '—'}
                </span>
            )
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${row.original.is_active
                    ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                    }`}>
                    {row.original.is_active ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            accessorKey: 'created_at',
            header: 'Joined',
            cell: ({ row }) => {
                const d = new Date(row.original.created_at);
                return (
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                        {d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                );
            }
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <button
                    onClick={() => {
                        if (activeTab === 'workers') {
                            /** Navigate to worker profile with tabs */
                            router.push(`/admin/companies/${companyId}/workers/${row.original.id}`);
                        } else {
                            /** Open supervisor detail dialog */
                            setViewSupervisor(row.original);
                        }
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                    title="View Details"
                >
                    <Eye className="w-4 h-4" />
                </button>
            )
        }
    ], [companyId, router, activeTab]);

    return (
        <div className="space-y-6">
            {/* Tab Bar — uses router.replace so tabs don't pile up in browser history */}
            <div className="flex gap-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1 w-fit">
                <button
                    onClick={() => router.replace(`/admin/companies/${companyId}/people?tab=supervisors`)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'supervisors'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                >
                    <UserCheck className="w-4 h-4" />
                    Supervisors
                </button>
                <button
                    onClick={() => router.replace(`/admin/companies/${companyId}/people?tab=workers`)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'workers'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Workers
                </button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : people.length > 0 ? (
                <DataTable columns={columns} data={people} />
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        {activeTab === 'supervisors' ? <UserCheck className="w-6 h-6 text-slate-400" /> : <Users className="w-6 h-6 text-slate-400" />}
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                        No {activeTab === 'supervisors' ? 'supervisors' : 'workers'} found
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        This company doesn&apos;t have any {activeTab === 'supervisors' ? 'supervisors' : 'workers'} yet.
                    </p>
                </div>
            )}

            {/* Supervisor Detail Dialog */}
            {viewSupervisor && (
                <SupervisorDetailDialog
                    supervisor={viewSupervisor}
                    companyName={company?.name || ''}
                    onClose={() => setViewSupervisor(null)}
                />
            )}
        </div>
    );
}

/**
 * Lightweight supervisor detail dialog — no tabbed view needed since
 * supervisors don't have enrollments or certificates.
 */
function SupervisorDetailDialog({
    supervisor,
    companyName,
    onClose
}: {
    supervisor: Person;
    companyName: string;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Dialog */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                {/* Banner */}
                <div className="h-16 bg-gradient-to-r from-blue-600 to-indigo-600" />

                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Content */}
                <div className="px-6 pb-6">
                    {/* Avatar */}
                    <div className="flex items-end gap-3 -mt-6">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-4 border-white dark:border-slate-900 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                            {supervisor.first_name[0]}{supervisor.last_name[0]}
                        </div>
                        <div className="pb-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {supervisor.first_name} {supervisor.last_name}
                            </h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">
                                Supervisor
                            </span>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="mt-5 space-y-3">
                        <InfoRow icon={Mail} label="Email" value={supervisor.email} />
                        <InfoRow icon={Phone} label="Phone" value={supervisor.phone_number || '—'} />
                        <InfoRow icon={Building2} label="Company" value={companyName} />
                        <InfoRow
                            icon={Shield}
                            label="Status"
                            value={supervisor.is_active ? 'Active' : 'Inactive'}
                            valueColor={supervisor.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
                        />
                        <InfoRow
                            icon={Calendar}
                            label="Joined"
                            value={new Date(supervisor.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Info row for the supervisor detail dialog.
 */
function InfoRow({
    icon: Icon,
    label,
    value,
    valueColor = 'text-slate-900 dark:text-white'
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    valueColor?: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <Icon className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">{label}</span>
                <span className={`text-sm font-medium ${valueColor}`}>{value}</span>
            </div>
        </div>
    );
}
