'use client';

import { Smartphone, Download, Loader2 } from 'lucide-react';
import { useHeader } from '@/components/HeaderContext';
import { useEffect, useState } from 'react';

export default function WorkerDashboard() {
    const { setTitle, setActions } = useHeader();
    const [links, setLinks] = useState({ android_app_url: '', ios_app_url: '', enable_android: false, enable_ios: false });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle('Overview');
        setActions(null);

        fetch('/api/v1/settings/public')
            .then(res => res.json())
            .then(json => {
                if (json.status && json.data) {
                    setLinks(json.data);
                }
            })
            .catch(err => console.error('Failed to load mobile links:', err))
            .finally(() => setLoading(false));
    }, [setTitle, setActions]);

    if (loading) {
        return <div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6">
                <Smartphone className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Available on Mobile
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg mb-8">
                Your dashboard is exclusively available on the LCP mobile application. Please download our app to manage your tasks, log entries, and monitor certifications.
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
    );
}
