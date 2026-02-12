'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, User, Code, LogOut } from 'lucide-react';

interface ProfileDropdownProps {
    /** The user's full name */
    userName: string;
    /** The user's role (e.g. 'SUPER_ADMIN', 'ADMIN') */
    role: string;
    /** Callback fired when the user clicks Logout */
    onLogout: () => void;
}

/**
 * ProfileDropdown - User profile section at the bottom of the sidebar.
 * Shows avatar, name, role, and a flyout menu with Profile, API Docs, and Logout.
 */
export default function ProfileDropdown({ userName, role, onLogout }: ProfileDropdownProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors group"
            >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all">
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{userName || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate capitalize">{role.replace('_', ' ').toLowerCase()}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/50 border border-slate-200 dark:border-slate-700 overflow-hidden transform origin-bottom transition-all animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-1">
                        <button
                            onClick={() => { setIsOpen(false); router.push('/admin/profile'); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                            <User className="w-4 h-4" />
                            My Profile
                        </button>

                        {role === 'SUPER_ADMIN' && (
                            <button
                                onClick={() => { setIsOpen(false); window.open('/api/docs', '_blank'); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                            >
                                <Code className="w-4 h-4" />
                                API Docs
                            </button>
                        )}

                        <div className="h-px bg-slate-200 dark:bg-slate-700 my-1 mx-2"></div>

                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
