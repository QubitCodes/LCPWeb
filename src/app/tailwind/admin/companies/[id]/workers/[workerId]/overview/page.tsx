'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
    Mail,
    Phone,
    Building2,
    Calendar,
    Shield,
    Loader2
} from 'lucide-react';

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
    is_active: boolean;
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
    const workerId = params?.workerId as string;

    const [worker, setWorker] = useState<WorkerInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWorker = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/v1/supervisor/workers/${workerId}`, {
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
        if (workerId) fetchWorker();
    }, [workerId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!worker) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">Worker not found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Could not load worker details.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-start gap-5">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                        {worker.first_name[0]}{worker.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            {worker.first_name} {worker.last_name}
                        </h2>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mt-2 ${worker.is_active
                                ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                                : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                            }`}>
                            {worker.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard icon={Mail} label="Email" value={worker.email} iconColor="text-blue-500" bgColor="bg-blue-50 dark:bg-blue-500/10" />
                <InfoCard icon={Phone} label="Phone" value={worker.phone_number || '—'} iconColor="text-green-500" bgColor="bg-green-50 dark:bg-green-500/10" />
                <InfoCard icon={Shield} label="Role" value={worker.role} iconColor="text-purple-500" bgColor="bg-purple-50 dark:bg-purple-500/10" />
                <InfoCard icon={Building2} label="Company" value={worker.company?.name || '—'} iconColor="text-orange-500" bgColor="bg-orange-50 dark:bg-orange-500/10" />
                <InfoCard
                    icon={Calendar}
                    label="Joined"
                    value={new Date(worker.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    iconColor="text-slate-500"
                    bgColor="bg-slate-100 dark:bg-slate-800"
                />
            </div>
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
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-start gap-3">
            <div className={`p-2 rounded-lg ${bgColor}`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
                <div className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{value}</div>
            </div>
        </div>
    );
}
