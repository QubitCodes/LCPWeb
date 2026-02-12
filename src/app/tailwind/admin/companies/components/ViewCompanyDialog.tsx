'use client';

import { X, Building2, Globe, Phone, Mail, FileText, MapPin, Calendar, Users, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Company {
    id: string;
    name: string;
    industry?: { name: string };
    tax_id?: string;
    contact_email?: string;
    contact_phone?: string;
    website?: string;
    address?: string;
    created_at: string;
}

interface ViewCompanyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    company: Company | null;
}

export default function ViewCompanyDialog({ isOpen, onClose, company }: ViewCompanyDialogProps) {
    const router = useRouter();
    if (!isOpen || !company) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            Company Details
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">View information for <span className="font-medium text-slate-900 dark:text-white">{company.name}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Overview</h4>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Industry</div>
                            <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                <BriefcaseIcon className="w-4 h-4 text-slate-400" />
                                {company.industry?.name || 'N/A'}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Tax ID / TRN</div>
                            <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400" />
                                {company.tax_id || 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-200 dark:bg-slate-800"></div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Contact Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Email Address</div>
                                    <div className="font-medium text-slate-900 dark:text-white mt-0.5">{company.contact_email || 'N/A'}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 p-2 bg-green-50 dark:bg-green-500/10 rounded-lg text-green-600 dark:text-green-400">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Phone Number</div>
                                    <div className="font-medium text-slate-900 dark:text-white mt-0.5">{company.contact_phone || 'N/A'}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400">
                                    <Globe className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Website</div>
                                    {company.website ? (
                                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 dark:text-blue-400 hover:underline mt-0.5 block truncate max-w-[200px]">
                                            {company.website}
                                        </a>
                                    ) : (
                                        <div className="font-medium text-slate-900 dark:text-white mt-0.5">N/A</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 p-2 bg-orange-50 dark:bg-orange-500/10 rounded-lg text-orange-600 dark:text-orange-400">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Registered On</div>
                                    <div className="font-medium text-slate-900 dark:text-white mt-0.5">{new Date(company.created_at).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 flex items-start gap-3">
                                <div className="mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Address</div>
                                    <div className="font-medium text-slate-900 dark:text-white mt-0.5 whitespace-pre-wrap">{company.address || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { onClose(); router.push(`/tailwind/admin/companies/${company.id}/people?tab=supervisors`); }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                            <UserCheck className="w-4 h-4" />
                            View Supervisors
                        </button>
                        <button
                            onClick={() => { onClose(); router.push(`/tailwind/admin/companies/${company.id}/people?tab=workers`); }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                        >
                            <Users className="w-4 h-4" />
                            View Workers
                        </button>
                    </div>
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

function BriefcaseIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    );
}
