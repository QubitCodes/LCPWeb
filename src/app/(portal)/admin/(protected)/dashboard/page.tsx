'use client';

import { useEffect, useState } from 'react';
import { Briefcase, Users, CreditCard, Award } from 'lucide-react';
import { useHeader } from '@/components/HeaderContext';
import StatCard from './components/StatCard';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { setTitle, setActions } = useHeader();

    useEffect(() => {
        setTitle('Dashboard Overview');
        setActions(null);
    }, [setTitle, setActions]);

    useEffect(() => {
        const token = localStorage.getItem('token');
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

    return (
        <div className="space-y-6">

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
