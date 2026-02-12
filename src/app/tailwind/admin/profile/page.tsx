'use client';

import { useEffect, useState } from 'react';
import { useHeader } from '@/components/tailwind/HeaderContext';
import {
    Mail,
    Phone,
    Shield,
    Building2,
    Calendar,
    Upload,
    FileText,
    Loader2,
    User
} from 'lucide-react';

/**
 * User profile shape.
 */
interface UserProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    role: string;
    is_active: boolean;
    created_at: string;
    company?: {
        id: string;
        name: string;
    };
    documents?: {
        id: string;
        title: string;
        file_url: string;
        created_at: string;
    }[];
}

/**
 * Admin Profile page — shows current user info and document upload.
 */
export default function ProfilePage() {
    const { setTitle, setActions } = useHeader();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle('My Profile');
        setActions(null);
    }, [setTitle, setActions]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/v1/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.status) {
                    setProfile(json.data);
                }
            } catch (err) {
                console.error('Failed to fetch profile:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">Profile not found</h3>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Banner */}
                <div className="h-24 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600" />

                {/* Avatar + Info */}
                <div className="px-6 pb-6">
                    <div className="flex items-end gap-4 -mt-10">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-4 border-white dark:border-slate-900 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {profile.first_name[0]}{profile.last_name[0]}
                        </div>
                        <div className="pb-1">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {profile.first_name} {profile.last_name}
                            </h2>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profile.role === 'SUPER_ADMIN'
                                    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                    : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                                }`}>
                                {profile.role.replace(/_/g, ' ')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard icon={Mail} label="Email" value={profile.email} iconColor="text-blue-500" bgColor="bg-blue-50 dark:bg-blue-500/10" />
                <InfoCard icon={Phone} label="Phone" value={profile.phone_number || '—'} iconColor="text-green-500" bgColor="bg-green-50 dark:bg-green-500/10" />
                <InfoCard icon={Shield} label="Role" value={profile.role.replace(/_/g, ' ')} iconColor="text-purple-500" bgColor="bg-purple-50 dark:bg-purple-500/10" />
                <InfoCard icon={Building2} label="Company" value={profile.company?.name || '—'} iconColor="text-orange-500" bgColor="bg-orange-50 dark:bg-orange-500/10" />
                <InfoCard
                    icon={Calendar}
                    label="Member Since"
                    value={new Date(profile.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    iconColor="text-slate-500"
                    bgColor="bg-slate-100 dark:bg-slate-800"
                />
                <InfoCard
                    icon={User}
                    label="Status"
                    value={profile.is_active ? 'Active' : 'Inactive'}
                    iconColor={profile.is_active ? 'text-green-500' : 'text-red-500'}
                    bgColor={profile.is_active ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}
                />
            </div>

            {/* Documents Section */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        Documents
                    </h3>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        Upload
                    </button>
                </div>

                {profile.documents && profile.documents.length > 0 ? (
                    <div className="space-y-2">
                        {profile.documents.map((doc) => (
                            <a
                                key={doc.id}
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                            >
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 group-hover:text-blue-500 transition-colors">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-slate-900 dark:text-white block truncate">{doc.title}</span>
                                    <span className="text-xs text-slate-400">
                                        {new Date(doc.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">No documents uploaded yet.</p>
                )}
            </div>
        </div>
    );
}

/**
 * Reusable info card component.
 */
function InfoCard({
    icon: Icon,
    label,
    value,
    iconColor,
    bgColor
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    iconColor: string;
    bgColor: string;
}) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-start gap-3">
            <div className={`p-2 rounded-lg ${bgColor}`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
                <div className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{value}</div>
            </div>
        </div>
    );
}
