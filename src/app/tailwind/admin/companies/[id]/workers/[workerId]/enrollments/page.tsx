'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { GraduationCap, Loader2, BookOpen } from 'lucide-react';

/**
 * Enrollment record shape.
 */
interface Enrollment {
    id: string;
    course_title: string;
    level_title: string;
    status: string;
    items_completed: number;
    progress_records: {
        id: string;
        status: string;
        attempts_count: number;
        quiz_score: number | null;
    }[];
}

/**
 * Worker Enrollments tab — shows course enrollments and progress.
 */
export default function WorkerEnrollmentsPage() {
    const params = useParams();
    const workerId = params?.workerId as string;

    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEnrollments = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/v1/supervisor/workers/${workerId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.status && json.data?.enrollments) {
                    setEnrollments(json.data.enrollments);
                }
            } catch (err) {
                console.error('Failed to fetch enrollments:', err);
            } finally {
                setLoading(false);
            }
        };
        if (workerId) fetchEnrollments();
    }, [workerId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (enrollments.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">No enrollments</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This worker has no active enrollments.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {enrollments.map((enr) => (
                <div
                    key={enr.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{enr.course_title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{enr.level_title}</p>
                            </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${enr.status === 'COMPLETED'
                                ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                                : enr.status === 'IN_PROGRESS'
                                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                            {enr.status.replace(/_/g, ' ')}
                        </span>
                    </div>

                    {/* Modules completed */}
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        Modules completed: <span className="font-medium text-slate-900 dark:text-white">{enr.items_completed}</span>
                    </div>

                    {/* Progress Records */}
                    {enr.progress_records.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Content Progress</p>
                            <div className="space-y-1.5">
                                {enr.progress_records.map((rec) => (
                                    <div key={rec.id} className="flex items-center justify-between text-xs">
                                        <span className={`px-2 py-0.5 rounded ${rec.status === 'COMPLETED'
                                                ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}>
                                            {rec.status}
                                        </span>
                                        <span className="text-slate-400 dark:text-slate-500">
                                            Attempts: {rec.attempts_count} {rec.quiz_score !== null && `• Score: ${rec.quiz_score}%`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
