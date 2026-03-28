'use client';

import { FileText, Play, CheckCircle, Clock } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

export default function SupervisorOnboardingPage() {
    const [user, setUser] = useState<any>(null);
    const [responses, setResponses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        } else {
            setLoading(false);
        }
    }, []);

    const fetchForms = useCallback(async () => {
        const compId = user?.company?.id || user?.company_id;
        if (!compId) {
            setLoading(false);
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/surveys/responses?company_id=${compId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.status) {
                // Filter specifically for ONBOARDING surveys
                const obForms = json.data.filter((r: any) => r.template?.type === 'ONBOARDING');
                setResponses(obForms);
            }
        } catch (error) {
            console.error('Failed to fetch onboarding forms:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchForms();
        }
    }, [user, fetchForms]);

    if (!user || loading) {
        return (
            <div className="p-8 flex justify-center items-center text-slate-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3">Loading onboarding requirements...</span>
            </div>
        );
    }

    const compId = user?.company?.id || user?.company_id;
    if (!compId) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center">
                <FileText className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Organization Not Linked</h3>
                <p className="text-slate-500 max-w-sm mt-1">Your account is not linked to a registered company. Please contact an administrator.</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Company Onboarding</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Complete the following required forms and questionnaires assigned to your organization.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {responses.map((response) => (
                    <div key={response.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow">
                        <div className="p-5 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2.5 rounded-lg ${
                                    response.status === 'COMPLETED' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                    response.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>
                                    {response.status === 'COMPLETED' ? <CheckCircle className="w-6 h-6" /> :
                                     response.status === 'IN_PROGRESS' ? <Clock className="w-6 h-6" /> :
                                     <FileText className="w-6 h-6" />}
                                </div>
                                <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full ${
                                    response.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' :
                                    response.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400' :
                                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                    {response.status === 'DRAFT' ? 'NOT STARTED' : response.status.replace('_', ' ')}
                                </span>
                            </div>
                            
                            <h3 className="font-semibold text-lg text-slate-900 dark:text-white line-clamp-2">
                                {response.template?.name || 'Assigned Form'}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                                {response.template?.description || 'Please complete this onboarding form for your organization.'}
                            </p>
                        </div>
                        
                        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            {response.status === 'COMPLETED' ? (
                                <Link
                                    href={`/admin/surveys/fill/${response.id}`}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <FileText className="w-4 h-4" /> View Submission
                                </Link>
                            ) : (
                                <Link
                                    href={`/admin/surveys/fill/${response.id}`}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                                >
                                    <Play className="w-4 h-4" /> {response.status === 'IN_PROGRESS' ? 'Continue Form' : 'Start Form'}
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {!loading && responses.length === 0 && (
                <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                    <CheckCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">All Caught Up!</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                        There are no pending onboarding forms assigned to your company at this time.
                    </p>
                </div>
            )}
        </div>
    );
}
