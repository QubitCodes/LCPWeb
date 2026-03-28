'use client';

import { Smartphone, Download, Loader2, AlertTriangle } from 'lucide-react';
import { useHeader } from '@/components/HeaderContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SupervisorDashboard() {
    const { setTitle, setActions } = useHeader();
    const [links, setLinks] = useState({ android_app_url: '', ios_app_url: '', enable_android: false, enable_ios: false });
    const [companyDetails, setCompanyDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle('Overview');
        setActions(null);

        const fetchData = async () => {
            try {
                // 1. Fetch public settings
                const settingsRes = await fetch('/api/v1/settings/public');
                const settingsJson = await settingsRes.json();
                if (settingsJson.status && settingsJson.data) {
                    setLinks(settingsJson.data);
                }

                // 2. Fetch User & Company info
                const userStr = localStorage.getItem('user');
                const token = localStorage.getItem('token');

                if (userStr && token) {
                    const user = JSON.parse(userStr);
                    const compId = user?.company?.id || user?.company_id;

                    if (compId) {
                        const compRes = await fetch(`/api/v1/companies/${compId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const compJson = await compRes.json();
                        if (compJson.status) {
                            setCompanyDetails(compJson.data);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [setTitle, setActions]);

    if (loading) {
        return <div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    // Determine warnings
    const NeedsOnboarding = companyDetails && companyDetails.details && companyDetails.details.onboarding_step !== null;
    const IsPendingApproval = companyDetails && companyDetails.approval_status !== 'APPROVED';

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Warnings Area */}
                {(NeedsOnboarding || IsPendingApproval) && (
                    <div className="flex flex-col gap-4 mb-8">
                        {IsPendingApproval && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
                                <div className="flex items-start">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Account Pending Verification</h3>
                                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">Your organization profile is currently under review by our administrators. Some features may be restricted until approval is granted.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {NeedsOnboarding && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg shadow-sm">
                                <div className="flex items-start">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Incomplete Onboarding</h3>
                                        <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                                            You have pending required onboarding tasks or forms to complete.
                                            <Link href="/admin/supervisor/onboarding" className="ml-2 font-medium underline underline-offset-2 hover:text-yellow-900 dark:hover:text-yellow-200">
                                                Review Requirements &rarr;
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="min-h-[50vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center shadow-sm">
                    <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6">
                        <Smartphone className="w-12 h-12" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                        Available on Mobile
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg mb-8">
                        Your dashboard is exclusively available on the LCP mobile application. Please download our app to manage your team, tasks, and recommendations.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                        {links.enable_ios && (
                            <a href={links.ios_app_url || '#'} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 px-6 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-medium transition-transform hover:scale-105 shadow-lg min-w-[180px]">
                                <Download className="w-6 h-6" />
                                <div className="text-left">
                                    <div className="text-[10px] leading-tight opacity-80 uppercase tracking-wide">Download on the</div>
                                    <div className="text-sm leading-tight font-semibold">App Store</div>
                                </div>
                            </a>
                        )}
                        {links.enable_android && (
                            <a href={links.android_app_url || '#'} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 px-6 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-medium transition-transform hover:scale-105 shadow-lg min-w-[180px]">
                                <Download className="w-6 h-6" />
                                <div className="text-left">
                                    <div className="text-[10px] leading-tight opacity-80 uppercase tracking-wide">Get it on</div>
                                    <div className="text-sm leading-tight font-semibold">Google Play</div>
                                </div>
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
