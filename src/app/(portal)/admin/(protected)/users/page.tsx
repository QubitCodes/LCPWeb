'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useHeader } from '@/components/HeaderContext';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import {
    MoreHorizontal,
    Plus,
    User as UserIcon,
    Briefcase,
    ArrowRightLeft,
    Eye,
    Pencil
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AddUserDialog from './components/AddUserDialog';
import TransferUserDialog from './components/TransferUserDialog';
import ViewUserDialog from './components/ViewUserDialog';
import EditUserDialog from './components/EditUserDialog';

// Define User type based on API response
interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    company?: { id: string; name: string };
    created_at: string;
}

export default function UsersPage() {
    const { setTitle, setActions } = useHeader();
    const router = useRouter();
    const [data, setData] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog States
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);

    // Selected User for Actions
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [viewUser, setViewUser] = useState<User | null>(null);
    const [editUser, setEditUser] = useState<User | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/v1/users');
            const json = await res.json();
            if (json.status) {
                setData(json.data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Set Header
    useEffect(() => {
        setTitle('Admins');
        setActions(
            <button
                onClick={() => setIsAddUserOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                title="Add New Admin"
            >
                <Plus className="w-4 h-4" />
                Add Admin
            </button>
        );
    }, [setTitle, setActions]);

    // Fetch Data
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTransfer = useCallback((user: User) => {
        setSelectedUser(user);
        setIsTransferOpen(true);
    }, []);

    // Columns
    const columns = useMemo<ColumnDef<User>[]>(() => [
        {
            accessorFn: (row) => `${row.first_name} ${row.last_name}`,
            id: 'name',
            header: 'Name',
            cell: ({ row }) => {
                const name = `${row.original.first_name} ${row.original.last_name}`;
                return (
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-500">
                            <UserIcon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-slate-900 dark:text-white">{name}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: 'email',
            header: 'Email',
            cell: ({ row }) => <span className="text-slate-600 dark:text-slate-400">{row.original.email}</span>
        },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ row }) => {
                const role = row.original.role;
                let colorClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';

                if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
                    colorClass = 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400';
                } else if (role === 'SUPERVISOR') {
                    colorClass = 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
                } else if (role === 'WORKER') {
                    colorClass = 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
                }

                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                        {role}
                    </span>
                );
            }
        },
        {
            accessorKey: 'company',
            header: 'Company',
            cell: ({ row }) => {
                const companyName = row.original.company?.name;
                return (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        {companyName ? (
                            <>
                                <Briefcase className="w-4 h-4 text-slate-400" />
                                <span>{companyName}</span>
                            </>
                        ) : (
                            <span className="text-slate-400 italic">-</span>
                        )}
                    </div>
                );
            }
        },
        {
            accessorKey: 'created_at',
            header: 'Joined',
            cell: ({ row }) => {
                return new Date(row.original.created_at).toLocaleDateString();
            }
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const canTransfer = ['WORKER', 'SUPERVISOR'].includes(row.original.role);

                return (
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setViewUser(row.original)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors"
                            title="View Details"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setEditUser(row.original)}
                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded transition-colors"
                            title="Edit User"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        {canTransfer && (
                            <button
                                onClick={() => handleTransfer(row.original)}
                                className="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded transition-colors"
                                title="Transfer Company"
                            >
                                <ArrowRightLeft className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                );
            }
        }
    ], [handleTransfer]);

    return (
        <div className="space-y-6">
            <DataTable
                columns={columns}
                data={data}
                isLoading={loading}
            />

            <AddUserDialog
                isOpen={isAddUserOpen}
                onClose={() => setIsAddUserOpen(false)}
                onSuccess={fetchData}
            />

            <TransferUserDialog
                isOpen={isTransferOpen}
                onClose={() => setIsTransferOpen(false)}
                onSuccess={fetchData}
                user={selectedUser}
            />

            <ViewUserDialog
                isOpen={!!viewUser}
                onClose={() => setViewUser(null)}
                user={viewUser}
            />

            <EditUserDialog
                isOpen={!!editUser}
                onClose={() => setEditUser(null)}
                onSuccess={fetchData}
                user={editUser}
            />
        </div>
    );
}
