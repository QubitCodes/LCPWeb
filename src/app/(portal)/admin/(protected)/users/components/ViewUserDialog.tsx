'use client';

import { X, User, Mail, Briefcase, Shield, Clock, Calendar } from 'lucide-react';

interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    company?: { name: string };
    created_at: string;
    updated_at?: string;
}

interface ViewUserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

export default function ViewUserDialog({ isOpen, onClose, user }: ViewUserDialogProps) {
    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            User Details
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">View information for <span className="font-medium text-slate-900 dark:text-white">{user.first_name} {user.last_name}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">

                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-bold">
                            {user.first_name[0]}{user.last_name[0]}
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white">{user.first_name} {user.last_name}</h4>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                <Mail className="w-3.5 h-3.5" />
                                {user.email}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <Shield className="w-3 h-3" /> Role
                            </div>
                            <div className="font-medium text-slate-900 dark:text-white">{user.role}</div>
                        </div>

                        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <Briefcase className="w-3 h-3" /> Company
                            </div>
                            <div className="font-medium text-slate-900 dark:text-white">{user.company?.name || 'N/A'}</div>
                        </div>

                        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Joined
                            </div>
                            <div className="font-medium text-slate-900 dark:text-white">{new Date(user.created_at).toLocaleDateString()}</div>
                        </div>

                        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Last Active
                            </div>
                            <div className="font-medium text-slate-900 dark:text-white">
                                {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
                            </div>
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
