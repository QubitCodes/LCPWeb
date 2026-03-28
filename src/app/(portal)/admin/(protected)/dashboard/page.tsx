'use client';

import { useEffect, useState } from 'react';
import { Briefcase, Users, CreditCard, Award } from 'lucide-react';
import { useHeader } from '@/components/HeaderContext';
import StatCard from './components/StatCard';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const { setTitle, setActions } = useHeader();

    useEffect(() => {
        setTitle('Dashboard Overview');
        setActions(null);
    }, [setTitle, setActions]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        }

        fetch('/api/v1/stats', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                if (data.status) setStats(data.data);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const isCompanyAdmin = user?.role === 'ADMIN_SUPERVISOR';
    const isApprovalPending = isCompanyAdmin && user?.company?.approval_status !== 'APPROVED';
    const isOnboardingIncomplete = isCompanyAdmin && user?.company?.is_onboarding_completed === false;

    return (
        <div className="space-y-6">
            {/* Alerts */}
            {isApprovalPending && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <span className="text-yellow-600 font-bold">⚠️</span>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-800 font-medium">
                                Your company registration is currently pending admin approval. Some features may be restricted.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            {isOnboardingIncomplete && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <span className="text-red-500 font-bold">⚠️</span>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-800 font-medium">
                                Your platform onboarding is incomplete. Please complete the full onboarding form to activate all features.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="min-w-0">
                    <StatCard
                        title="Total Companies"
                        value={stats?.companies || 0}
                        icon={Briefcase}
                        color="bg-blue-600"
                        trend="up"
                    />
                </div>
                <div className="min-w-0">
                    <StatCard
                        title="Total Workers"
                        value={stats?.workers || 0}
                        icon={Users}
                        color="bg-indigo-600"
                        trend="up"
                    />
                </div>
                <div className="min-w-0">
                    <StatCard
                        title="Active Enrollments"
                        value={stats?.activeEnrollments || 0}
                        icon={CreditCard}
                        color="bg-purple-600"
                    />
                </div>
                <div className="min-w-0">
                    <StatCard
                        title="Pending Reviews"
                        value={stats?.pendingRecs || 0}
                        icon={Award}
                        color="bg-orange-500"
                        trend="down"
                    />
                </div>
            </div>

            {/* Placeholder for potential Charts/Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 min-h-[300px] flex items-center justify-center">
                    <p className="text-slate-400 italic">Activity Chart Placeholder</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 min-h-[300px] flex items-center justify-center">
                    <p className="text-slate-400 italic">Recent Registrations Placeholder</p>
                </div>
            </div>
        </div>
    );
}
