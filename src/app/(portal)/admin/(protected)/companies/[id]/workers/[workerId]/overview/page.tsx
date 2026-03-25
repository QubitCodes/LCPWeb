'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Mail,
    Phone,
    Building2,
    Calendar,
    Shield,
    Loader2,
    ArrowLeft,
    Edit,
    Trash2
} from 'lucide-react';
import EditUserDialog from '../../../../../users/components/EditUserDialog';

/**
 * Worker info shape.
 */
interface WorkerInfo {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    role: string;
    status: string;
    created_at: string;
    company?: {
        id: string;
        name: string;
    };
}

/**
 * Worker Overview tab — displays personal details and status.
 */
export default function WorkerOverviewPage() {
    const params = useParams();
    const router = useRouter();
    const workerId = params?.workerId as string;

    const [worker, setWorker] = useState<WorkerInfo | null>(null);
    const [loading, setLoading] = useState(true);

    /** Edit Dialog State */
    const [editUser, setEditUser] = useState<WorkerInfo | null>(null);

    /** User Context for Actions */
    const [userRole, setUserRole] = useState<string>('');
    const [enableDelete, setEnableDelete] = useState<boolean>(true);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserRole(user.role);
            } catch (e) { }
        }
        const edStr = localStorage.getItem('enableDelete');
        if (edStr !== null) {
            setEnableDelete(edStr !== 'false');
        }
    }, []);

    const fetchWorker = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/users/${workerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.status) {
                setWorker(json.data?.worker || json.data);
            }
        } catch (err) {
            console.error('Failed to fetch worker:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (workerId) fetchWorker();
    }, [workerId]);

    const handleDelete = async () => {
        if (!worker) return;
        if (!confirm(`Are you sure you want to delete ${worker.first_name} ${worker.last_name}?`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/users/${worker.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.status) {
                // Navigate back to workers tab after successful delete
                router.push(`/admin/companies/${params?.id}/people?tab=workers`);
            } else {
                alert(json.message || 'Failed to delete worker');
            }
        } catch (err) {
            console.error('Failed to delete worker:', err);
        }
    };

    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    const showDelete = isSuperAdmin && enableDelete;

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!worker) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
                <div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">Worker not found</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Could not load worker details.</p>
                </div>
                <button
                    onClick={() => router.push(`/admin/companies/${params?.id}/people?tab=workers`)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Workers List
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Banner/Header background */}
                <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-900 dark:to-blue-800"></div>

                <div className="px-3 pb-3 relative">
                    <div className="flex justify-between items-end">
                        {/* Avatar pushed up into the banner */}
                        <div className="flex items-end gap-5 -mt-10">
                            <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 p-1.5 shadow-sm">
                                <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                                    {worker.first_name[0]}{worker.last_name[0]}
                                </div>
                            </div>

                            <div className="pb-2">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {worker.first_name} {worker.last_name}
                                </h2>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${worker.status === 'ACTIVE'
                                        ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                                        : (worker.status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400')
                                        }`}>
                                        {worker.status === 'ACTIVE' ? 'Active' : (worker.status === 'PENDING' ? 'Pending' : 'Inactive')}
                                    </span>
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 capitalize">
                                        {worker.role.toLowerCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pb-2">
                            <button
                                onClick={() => setEditUser(worker)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                                Edit
                            </button>
                            {showDelete && (
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoCard icon={Mail} label="Email Address" value={worker.email} iconColor="text-blue-500" bgColor="bg-blue-50 dark:bg-blue-500/10" />
                <InfoCard icon={Phone} label="Phone Number" value={worker.phone_number || 'Not provided'} iconColor="text-green-500" bgColor="bg-green-50 dark:bg-green-500/10" />
                <InfoCard icon={Shield} label="System Role" value={worker.role.charAt(0) + worker.role.slice(1).toLowerCase()} iconColor="text-purple-500" bgColor="bg-purple-50 dark:bg-purple-500/10" />
                <InfoCard icon={Building2} label="Assigned Company" value={worker.company?.name || 'Not assigned'} iconColor="text-orange-500" bgColor="bg-orange-50 dark:bg-orange-500/10" />
                <InfoCard
                    icon={Calendar}
                    label="Joined"
                    value={new Date(worker.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    iconColor="text-slate-500"
                    bgColor="bg-slate-100 dark:bg-slate-800"
                />
            </div>

            {/* Edit User Dialog */}
            <EditUserDialog
                isOpen={!!editUser}
                onClose={() => setEditUser(null)}
                onSuccess={fetchWorker}
                user={editUser as any}
            />
        </div>
    );
}

/**
 * Reusable info card for profile details.
 */
function InfoCard({
    icon: Icon,
    label,
    value,
    iconColor,
    bgColor
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    iconColor: string;
    bgColor: string;
}) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex items-start gap-4 transition-shadow hover:shadow-md dark:hover:shadow-slate-900/50">
            <div className={`p-3 rounded-xl ${bgColor}`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 tracking-wide uppercase">{label}</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{value}</div>
            </div>
        </div>
    );
}
