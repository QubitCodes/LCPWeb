'use client';

import { useEffect, useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useHeader } from '@/components/tailwind/HeaderContext';
import { DataTable } from '@/components/tailwind/ui/DataTable';
import { MoreHorizontal, Pencil, Trash2, Eye, Building2, Plus, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import BulkImportDialog from './components/BulkImportDialog';
import AddCompanyDialog from './components/AddCompanyDialog';
import ViewCompanyDialog from './components/ViewCompanyDialog';
import EditCompanyDialog from './components/EditCompanyDialog';

// Define the Company type based on actual API response
interface Company {
    id: string;
    name: string;
    company_id: string;
    status: string;
    logo?: string;
    created_at: string;
    industry?: { id: string; name: string };
    tax_id?: string;
    contact_email?: string;
    contact_phone?: string;
    website?: string;
    address?: string;
    users_count?: number;
}

export default function CompaniesPage() {
    const { setTitle, setActions } = useHeader();
    const [data, setData] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // View/Edit Dialog State
    const [viewCompany, setViewCompany] = useState<Company | null>(null);
    const [editCompany, setEditCompany] = useState<Company | null>(null);

    // Pagination state
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // Set Header Title & Actions
    useEffect(() => {
        setTitle('Companies');
        setActions(
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setIsImportOpen(true)}
                    className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <UploadCloud className="w-4 h-4" />
                    Bulk Import
                </button>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Company
                </button>
            </div>
        );
    }, [setTitle, setActions]);

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const page = pageIndex + 1; // API is likely 1-indexed
            const query = new URLSearchParams({
                page: page.toString(),
                limit: pageSize.toString(),
                ...(searchTerm && { search: searchTerm })
            });

            const res = await fetch(`/api/v1/companies?${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();

            if (json.status) {
                setData(json.data);
                // Assume API returns meta for pagination
                setTotalCount(json.misc?.total || 0);
            }
        } catch (error) {
            console.error('Failed to fetch companies:', error);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPageIndex(0); // Reset to first page on search
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, pageIndex, pageSize]);

    // Columns Definition
    const columns = useMemo<ColumnDef<Company>[]>(() => [
        {
            accessorKey: 'name',
            header: 'Company Name',
            cell: ({ row }) => {
                const company = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700">
                            {company.logo ? (
                                <img src={company.logo} alt="" className="h-full w-full rounded-full object-cover" />
                            ) : (
                                <Building2 className="h-5 w-5 text-slate-500" />
                            )}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white truncate">{company.name}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: 'company_id',
            header: 'Company ID',
            cell: ({ row }) => <span className="text-slate-600 dark:text-slate-400 font-mono text-xs">{row.getValue('company_id') || 'N/A'}</span>
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = (row.getValue('status') as string) || 'UNKNOWN';
                const isActive = status === 'ACTIVE';
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${isActive
                        ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-200 dark:border-green-500/20'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}>
                        {status}
                    </span>
                );
            }
        },
        {
            accessorKey: 'created_at',
            header: 'Registered On',
            cell: ({ row }) => {
                return new Date(row.getValue('created_at')).toLocaleDateString();
            }
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                return (
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => setViewCompany(row.original)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="View Details"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setEditCompany(row.original)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                            title="Edit Company"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                    </div>
                );
            }
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

            {/* Bulk Import Dialog */}
            <BulkImportDialog
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onSuccess={fetchData}
            />

            {/* Add Company Dialog */}
            <AddCompanyDialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={fetchData}
            />

            {/* View Company Dialog */}
            <ViewCompanyDialog
                isOpen={!!viewCompany}
                onClose={() => setViewCompany(null)}
                company={viewCompany}
            />

            {/* Edit Company Dialog */}
            <EditCompanyDialog
                isOpen={!!editCompany}
                onClose={() => setEditCompany(null)}
                onSuccess={fetchData}
                company={editCompany}
            />
        </>
    );
}
