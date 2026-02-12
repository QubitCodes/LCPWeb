'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Award, Loader2, Eye, Printer } from 'lucide-react';

/**
 * Certificate record shape.
 */
interface Certificate {
    id: string;
    certificate_code: string;
    issue_date: string;
    level?: {
        title: string;
        course?: {
            title: string;
        };
    };
}

/**
 * Worker Certificates tab — shows earned certificates with View/Print actions.
 */
export default function WorkerCertificatesPage() {
    const params = useParams();
    const workerId = params?.workerId as string;

    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCertificates = async () => {
            try {
                const token = localStorage.getItem('token');
                /** Fetch certificates for this specific worker */
                const res = await fetch(`/api/v1/worker/certificates?worker_id=${workerId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.status) {
                    setCertificates(json.data || []);
                }
            } catch (err) {
                console.error('Failed to fetch certificates:', err);
            } finally {
                setLoading(false);
            }
        };
        if (workerId) fetchCertificates();
    }, [workerId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (certificates.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Award className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">No certificates</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This worker hasn&apos;t earned any certificates yet.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert) => (
                <div
                    key={cert.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col"
                >
                    {/* Certificate Header */}
                    <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                            <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {cert.level?.course?.title || 'Certificate'}
                            </h3>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                {cert.level?.title || '—'}
                            </p>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4 flex-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400">Issue Date</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                                {new Date(cert.issue_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400">Code</span>
                            <span className="font-mono text-slate-900 dark:text-white">{cert.certificate_code}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={() => window.open(`/admin/certificates/${cert.id}`, '_blank')}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            View
                        </button>
                        <button
                            onClick={() => window.open(`/admin/certificates/${cert.id}?print=true`, '_blank')}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            Print
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
