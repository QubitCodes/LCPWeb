'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Building2, Globe, Phone, Mail, FileText, MapPin, ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Schema Validation (matches backend standards)
const companySchema = z.object({
    name: z.string().min(2, 'Company name is required'),
    industry_id: z.string().min(1, 'Industry is required'),
    tax_id: z.string().optional(),
    contact_email: z.string().email('Invalid email address').optional().or(z.literal('')),
    contact_phone: z.string().optional(),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
    address: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function EditCompanyPage() {
    const params = useParams();
    const router = useRouter();
    const companyId = params.id as string;
    
    const [industries, setIndustries] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [serverError, setServerError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<CompanyFormData>({
        resolver: zodResolver(companySchema),
    });

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // Fetch Industries
                const indRes = await fetch('/api/v1/industries');
                const indData = await indRes.json();
                if (indData.status) setIndustries(indData.data);

                // Fetch Company Details
                const compRes = await fetch(`/api/v1/companies/${companyId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const compData = await compRes.json();
                
                if (compData.status) {
                    const company = compData.data;
                    reset({
                        name: company.name || '',
                        industry_id: company.industry?.id || '',
                        tax_id: company.tax_id || '',
                        contact_email: company.contact_email || '',
                        contact_phone: company.contact_phone || '',
                        website: company.website || '',
                        address: company.address || '',
                    });
                } else {
                    setServerError(compData.message || 'Failed to load company details.');
                }
            } catch (error) {
                console.error('Failed to load edit dependencies:', error);
                setServerError('A network error occurred while loading data.');
            } finally {
                setLoading(false);
            }
        };

        if (companyId) fetchInitialData();
    }, [companyId, reset]);

    const onSubmit = async (data: CompanyFormData) => {
        setServerError('');
        setSuccessMessage('');

        // Prepare data. We use JSON assuming backend accepts it, otherwise use FormData.
        // The prompt says: "ALL state-changing requests must send application/json bodies"
        const payload = {
            ...data,
            // Only send fields that actually have values
            tax_id: data.tax_id || null,
            contact_email: data.contact_email || null,
            contact_phone: data.contact_phone || null,
            website: data.website || null,
            address: data.address || null,
        };

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/companies/${companyId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (result.status) {
                setSuccessMessage('Company details updated successfully!');
                // Wait briefly then redirect back to details
                setTimeout(() => {
                    router.push(`/admin/companies/${companyId}`);
                    router.refresh(); // Force page refresh to update Layout header
                }, 1500);
            } else {
                setServerError(result.message || 'Failed to update company');
            }
        } catch (error) {
            setServerError('An unexpected error occurred during update.');
        }
    };

    if (loading) {
        return (
            <div className="p-12 flex justify-center items-center text-slate-500">
                <Loader2 className="animate-spin w-8 h-8 text-blue-600 mr-3" />
                <span>Loading company details...</span>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Company</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update company master information and contact details.</p>
                </div>
                <Link
                    href={`/admin/companies/${companyId}`}
                    className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-lg bg-white dark:bg-slate-900"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Details
                </Link>
            </div>

            <div className="p-6">
                
                {serverError && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
                        <span className="font-semibold">Error:</span> {serverError}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-2">
                        <span className="font-semibold">Success:</span> {successMessage}
                        <Loader2 className="w-4 h-4 animate-spin ml-auto" />
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Basic Info Section */}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            Basic Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Name <span className="text-red-500">*</span></label>
                                <input
                                    {...register('name')}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                                    placeholder="e.g. Acme Corporation"
                                />
                                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Industry <span className="text-red-500">*</span></label>
                                <select
                                    {...register('industry_id')}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="">Select Industry</option>
                                    {industries.map(ind => (
                                        <option key={ind.id} value={ind.id}>{ind.name}</option>
                                    ))}
                                </select>
                                {errors.industry_id && <p className="mt-1 text-xs text-red-500">{errors.industry_id.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tax ID / TRN</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        {...register('tax_id')}
                                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                                        placeholder="Registration Number"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info Section */}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                            <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            Contact Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email <span className="text-xs text-slate-400 font-normal">(Optional)</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        {...register('contact_email')}
                                        type="email"
                                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                                        placeholder="contact@company.com"
                                    />
                                </div>
                                {errors.contact_email && <p className="mt-1 text-xs text-red-500">{errors.contact_email.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone <span className="text-xs text-slate-400 font-normal">(Optional)</span></label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        {...register('contact_phone')}
                                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                                        placeholder="+971 50 123 4567"
                                    />
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Website <span className="text-xs text-slate-400 font-normal">(Optional)</span></label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        {...register('website')}
                                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                                        placeholder="https://company.com"
                                    />
                                </div>
                                {errors.website && <p className="mt-1 text-xs text-red-500">{errors.website.message}</p>}
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address <span className="text-xs text-slate-400 font-normal">(Optional)</span></label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <textarea
                                        {...register('address')}
                                        rows={3}
                                        className="w-full py-2 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 resize-none"
                                        placeholder="Office address details..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting || !!successMessage}
                            className="px-6 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95 w-full md:w-auto"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Building2 className="w-5 h-5" />}
                            {isSubmitting ? 'Saving Changes...' : 'Save Company Details'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
