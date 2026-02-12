'use client';

import { X, Briefcase, Layers, BookOpen, User } from 'lucide-react';

interface Job {
    id: string;
    name: string;
    category?: { name: string };
    course?: { id: string; title: string };
    skills?: any[];
    created_at: string;
}

interface ViewJobDialogProps {
    isOpen: boolean;
    onClose: () => void;
    job: Job | null;
}

export default function ViewJobDialog({ isOpen, onClose, job }: ViewJobDialogProps) {
    if (!isOpen || !job) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-blue-600" />
                            Job Details
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">View information for <span className="font-medium text-slate-900 dark:text-white">{job.name}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">

                    <div className="grid grid-cols-1 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <Layers className="w-3 h-3" /> Category
                            </div>
                            <div className="font-medium text-slate-900 dark:text-white">{job.category?.name || 'Uncategorized'}</div>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> Linked Course
                            </div>
                            {job.course ? (
                                <div className="font-medium text-blue-600 dark:text-blue-400">{job.course.title}</div>
                            ) : (
                                <div className="font-medium text-slate-500 dark:text-slate-400 italic">No course linked</div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Skills ({job.skills?.length || 0})</h4>
                        {/* Assuming skills is an array of objects or strings. Let's assume object {name: string} or similar based on legacy. 
                            Legacy: {job.skills?.length || 0}
                            I'll just list count for now unless I know the structure. 
                            Wait, legacy only displayed count. I'll stick to that or check data type later to expand.
                         */}
                        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm">
                            Skills data structure pending migration. Count: {job.skills?.length || 0}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg transition-colors border border-transparent"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
