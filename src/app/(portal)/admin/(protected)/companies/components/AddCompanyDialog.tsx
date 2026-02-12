'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, Building2, Globe, Phone, Mail, FileText, MapPin } from 'lucide-react';

// Schema Validation
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

interface AddCompanyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddCompanyDialog({ isOpen, onClose, onSuccess }: AddCompanyDialogProps) {
    const [industries, setIndustries] = useState<{ id: string; name: string }[]>([]);
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<CompanyFormData>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            name: '',
            industry_id: '',
            tax_id: '',
            contact_email: '',
            contact_phone: '',
            website: '',
            address: ''
        }
    });

    // Fetch Industries on mount/open
    useEffect(() => {
        if (isOpen) {
            fetch('/api/v1/industries')
                .then(res => res.json())
                .then(data => {
                    if (data.status) setIndustries(data.data);
                })
                .catch(err => console.error('Failed to fetch industries', err));
        }
    }, [isOpen]);

    // Handle Close & Reset
    const handleClose = () => {
        reset();
        setServerError('');
        onClose();
    };

    const onSubmit = async (data: CompanyFormData) => {
        setServerError('');

        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value) formData.append(key, value);
        });

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/companies', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            const result = await res.json();

            if (result.status) {
                reset();
                onSuccess();
                onClose();
            } else {
                setServerError(result.message || 'Failed to create company');
            }
        } catch (error) {
            setServerError('An unexpected error occurred');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Company</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Register a new client company on the platform</p>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">

                    {serverError && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
                            <span className="font-semibold">Error:</span> {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        {/* Basic Info Section */}
                        <div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                Basic Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

                        <div className="h-px bg-slate-200 dark:bg-slate-800"></div>

                        {/* Contact Info Section */}
                        <div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                Contact Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3 sticky bottom-0">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg transition-colors border border-transparent"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isSubmitting ? 'Creating...' : 'Create Company'}
                    </button>
                </div>
            </div>
        </div>
    );
}
