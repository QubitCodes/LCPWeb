'use client';

import { useHeader } from '@/components/HeaderContext';
import { Building2, Users, MapPin, HardHat } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// Define expected interface
interface Company {
    id: string;
    name: string;
    company_id: string;
    status: string;
}

export default function CompanyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { setTitle, setActions } = useHeader();
    const pathname = usePathname();
    const params = useParams();
    const companyId = params.id as string;
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);

    const tabs = [
        { name: 'Details', href: `/admin/companies/${companyId}`, icon: Building2 },
        { name: 'People', href: `/admin/companies/${companyId}/people`, icon: Users },
        { name: 'Sites / Projects', href: `/admin/companies/${companyId}/sites`, icon: MapPin },
        { name: 'Enrolled Workers', href: `/admin/companies/${companyId}/workers`, icon: HardHat },
    ];

    // Fetch minimal company info for the header
    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/v1/companies/${companyId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.status) {
                    setCompany(json.data);
                }
            } catch (error) {
                console.error('Failed to fetch company header details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (companyId) {
            fetchCompany();
        }
    }, [companyId]);

    // Update Header Context
    useEffect(() => {
        setTitle(company ? `Company: ${company.name}` : 'Company Details');
        setActions(null); // Clear global actions or add company-specific actions here
    }, [company, setTitle, setActions]);

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="border-b border-slate-200 dark:border-slate-800">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = pathname === tab.href;

                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={`
                                    group inline-flex items-center whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                                    ${isActive
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-300'
                                    }
                                `}
                            >
                                <Icon
                                    className={`
                                        -ml-0.5 mr-2 h-5 w-5
                                        ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 flex-shrink-0 dark:group-hover:text-slate-400'}
                                    `}
                                    aria-hidden="true"
                                />
                                {tab.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Content Area */}
            <div className="bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 rounded-xl overflow-hidden">
                {children}
            </div>
        </div>
    );
}
