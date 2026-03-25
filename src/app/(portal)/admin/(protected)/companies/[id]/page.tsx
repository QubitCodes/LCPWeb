'use client';

import { Building2, Mail, Phone, Globe, FileText, Calendar, Users, Briefcase, MapPin, Edit } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// Reusing Company interface
interface Company {
    id: string;
    name: string;
    company_id: string;
    status: string;
    logo?: string;
    created_at: string;
    industry?: { id: string; name: string };
    tax_id?: string;
    contact_email?: string;
    contact_phone?: string;
    website?: string;
    address?: string;
    users_count?: number;
}

export default function CompanyDetailsPage() {
    const params = useParams();
    const companyId = params.id as string;
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);

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
                console.error('Failed to fetch company:', error);
            } finally {
                setLoading(false);
            }
        };

        if (companyId) {
            fetchCompany();
        }
    }, [companyId]);

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center text-slate-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3">Loading company details...</span>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center">
                <Building2 className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Company Not Found</h3>
                <p className="text-slate-500 max-w-sm mt-1">The company you are looking for might have been deleted or doesn't exist.</p>
            </div>
        );
    }

    // Detail Item Component
    const DetailItem = ({ icon: Icon, label, value, href }: { icon: React.ElementType, label: string, value?: string, href?: string }) => (
        <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                {href && value ? (
                    <a href={href} className="text-base font-semibold text-slate-900 dark:text-white mt-0.5 block hover:text-blue-600 transition-colors truncate max-w-[200px] sm:max-w-xs">
                        {value}
                    </a>
                ) : (
                    <p className="text-base font-semibold text-slate-900 dark:text-white mt-0.5 break-all max-w-[200px] sm:max-w-xs">{value || '- -'}</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column: Visual Identity & Status */}
                <div className="md:w-1/3 flex flex-col items-center text-center space-y-6">
                    <div className="relative group">
                        <div className="w-40 h-40 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden">
                            {company.logo ? (
                                <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                            ) : (
                                <Building2 className="w-16 h-16 text-slate-400" />
                            )}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{company.name}</h2>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className="text-sm font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-1 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
                                ID: {company.company_id}
                            </span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${company.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 ring-1 ring-inset ring-green-600/20'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-inset ring-slate-600/20'
                                }`}>
                                {company.status}
                            </span>
                        </div>
                        <div className="mt-4 flex justify-center">
                            <Link
                                href={`/admin/companies/${company.id}/edit`}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm active:scale-95"
                            >
                                <Edit className="w-4 h-4" />
                                Edit Company
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Info Grid */}
                <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailItem
                        icon={Mail}
                        label="Primary Contact Email"
                        value={company.contact_email}
                        href={company.contact_email ? `mailto:${company.contact_email}` : undefined}
                    />
                    <DetailItem
                        icon={Phone}
                        label="Primary Phone Number"
                        value={company.contact_phone}
                        href={company.contact_phone ? `tel:${company.contact_phone}` : undefined}
                    />
                    <DetailItem
                        icon={Globe}
                        label="Company Website"
                        value={company.website}
                        href={company.website}
                    />
                    <DetailItem
                        icon={Briefcase}
                        label="Industry Sector"
                        value={company.industry?.name}
                    />
                    <DetailItem
                        icon={FileText}
                        label="Tax / Commercial Registration"
                        value={company.tax_id}
                    />
                    <DetailItem
                        icon={MapPin}
                        label="Headquarters Address"
                        value={company.address}
                    />
                    <DetailItem
                        icon={Users}
                        label="Total System Users"
                        value={String(company.users_count || 0)}
                    />
                    <DetailItem
                        icon={Calendar}
                        label="Platform Registration Date"
                        value={new Date(company.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    />
                </div>
            </div>
        </div>
    );
}
