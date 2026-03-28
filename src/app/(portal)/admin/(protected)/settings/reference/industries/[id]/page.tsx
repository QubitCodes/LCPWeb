'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useHeader } from '@/components/HeaderContext';
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Loader2, FileText, Settings2 } from 'lucide-react';
import { useAlert } from '@/components/ui/AlertDialog';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

export default function IndustryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const industryId = resolvedParams.id;
    const router = useRouter();
    const { setTitle, setActions } = useHeader();
    const { confirm, error } = useAlert();
    const toast = useToast();

    const [industryName, setIndustryName] = useState<string>('Loading...');
    const [activeTab, setActiveTab] = useState<'categories' | 'onboarding'>('categories');
    const [loading, setLoading] = useState(true);

    // ==========================================
    // DATA STATES
    // ==========================================
    const [categories, setCategories] = useState<any[]>([]);
    const [forms, setForms] = useState<any[]>([]);

    // ==========================================
    // INITIALIZATION
    // ==========================================
    useEffect(() => {
        setTitle('Loading Industry...');
        setActions(null);
    }, [setTitle, setActions]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // 1. Fetch Industry info
            const indRes = await fetch('/api/v1/reference/industries', { headers });
            const indJson = await indRes.json();
            if (indJson.status) {
                const found = indJson.data.find((i: any) => String(i.id) === String(industryId));
                if (found) {
                    setIndustryName(found.name);
                    setTitle(`Industry: ${found.name}`);
                } else {
                    setIndustryName('Unknown Industry');
                    setTitle('Industry Not Found');
                }
            }

            // 2. Fetch Categories for this industry
            const catRes = await fetch(`/api/v1/reference/categories?industry_id=${industryId}`, { headers });
            const catJson = await catRes.json();
            if (catJson.status) {
                setCategories(catJson.data);
            }

            // 3. Fetch Onboarding Forms for this industry
            const formRes = await fetch(`/api/v1/surveys?type=ONBOARDING&industry_id=${industryId}`, { headers });
            const formJson = await formRes.json();
            if (formJson.status) {
                setForms(formJson.data || []);
            }
        } catch (err) {
            console.error('Failed to load industry data:', err);
            error('Error', 'Failed to load industry details.');
        } finally {
            setLoading(false);
        }
    }, [industryId, setTitle, error]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ==========================================
    // CATEGORIES LOGIC
    // ==========================================
    const [catCreating, setCatCreating] = useState(false);
    const [catNewName, setCatNewName] = useState('');
    const [catEditId, setCatEditId] = useState<string | null>(null);
    const [catEditName, setCatEditName] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const handleCreateCategory = async () => {
        if (!catNewName.trim()) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/reference/categories`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: catNewName.trim(), industry_id: Number(industryId) })
            });
            const json = await res.json();
            if (json.status) {
                setCatNewName('');
                setCatCreating(false);
                fetchData();
                toast.success('Category created successfully.');
            } else {
                error('Create Failed', json.message || 'Could not create category.');
            }
        } finally { setActionLoading(false); }
    };

    const handleUpdateCategory = async (id: string) => {
        if (!catEditName.trim()) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/reference/categories?id=${id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: catEditName.trim(), industry_id: Number(industryId) })
            });
            const json = await res.json();
            if (json.status) {
                setCatEditId(null);
                setCatEditName('');
                fetchData();
                toast.success('Category updated successfully.');
            } else {
                error('Update Failed', json.message || 'Could not update category.');
            }
        } finally { setActionLoading(false); }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        const confirmed = await confirm('Delete Category', `Are you sure you want to delete "${name}"?`);
        if (!confirmed) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/reference/categories?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.status) {
                fetchData();
                toast.success(`"${name}" has been deleted.`);
            } else {
                error('Delete Failed', json.message || 'Could not delete category.');
            }
        } finally { setActionLoading(false); }
    };

    // ==========================================
    // ONBOARDING FORMS LOGIC
    // ==========================================
    const handleCreateForm = async () => {
        const confirmed = await confirm('Create Form', `Are you sure you want to initialize a new Onboarding Form for ${industryName}?`);
        if (!confirmed) return;
        
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/surveys`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${industryName} Onboarding`,
                    type: 'ONBOARDING',
                    industry_id: Number(industryId)
                })
            });
            const json = await res.json();
            if (json.status) {
                toast.success('Onboarding Form created! Redirecting to Survey Builder...');
                router.push(`/admin/surveys/${json.data.id}`);
            } else {
                error('Creation Failed', json.message || 'Could not create onboarding form.');
            }
        } finally { setActionLoading(false); }
    };

    const handleDeleteForm = async (id: string, name: string) => {
        const confirmed = await confirm('Delete Form', `Are you sure you want to permanently delete "${name}"?`, 'danger');
        if (!confirmed) return;
        
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/surveys/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.status) {
                fetchData();
                toast.success(`Form "${name}" deleted.`);
            } else {
                error('Delete Failed', json.message || 'Could not delete form.');
            }
        } finally { setActionLoading(false); }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Back */}
            <div>
                <Link href="/admin/settings/reference/industries" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Industries
                </Link>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{industryName}</h1>
                <p className="text-sm text-slate-500 mt-1 mb-6">Manage specific categories and tailored onboarding forms for this industry.</p>
            </div>

            {/* Tabs */}
            <div className="flex w-full mb-6 bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl">
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`flex-1 flex justify-center items-center py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'categories' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    <Settings2 className="w-4 h-4 mr-2" /> Categories ({categories.length})
                </button>
                <button
                    onClick={() => setActiveTab('onboarding')}
                    className={`flex-1 flex justify-center items-center py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'onboarding' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    <FileText className="w-4 h-4 mr-2" /> Onboarding Forms ({forms.length})
                </button>
            </div>

            {/* TAB CONTENT: CATEGORIES */}
            {activeTab === 'categories' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Industry Categories</h2>
                        <button
                            onClick={() => { setCatCreating(true); setCatNewName(''); }}
                            disabled={catCreating}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 outline-none hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                            <Plus className="w-3.5 h-3.5" /> Add Category
                        </button>
                    </div>

                    {catCreating && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-500/5 border-b border-slate-100 dark:border-slate-800">
                            <input
                                type="text"
                                value={catNewName}
                                onChange={(e) => setCatNewName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                                placeholder="Enter category name..."
                                autoFocus
                                className="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleCreateCategory}
                                disabled={actionLoading || !catNewName.trim()}
                                className="p-1.5 text-green-600 outline-none hover:bg-green-100 dark:hover:bg-green-500/20 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => { setCatCreating(false); setCatNewName(''); }}
                                className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {categories.length === 0 ? (
                        <div className="py-12 text-center text-sm text-slate-500 font-medium">No Categories found for this industry.</div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {categories.map((cat) => (
                                <li key={cat.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    {catEditId === cat.id ? (
                                        <div className="flex-1 flex items-center gap-3">
                                            <input
                                                type="text"
                                                value={catEditName}
                                                onChange={(e) => setCatEditName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory(cat.id)}
                                                autoFocus
                                                className="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={() => handleUpdateCategory(cat.id)}
                                                disabled={actionLoading || !catEditName.trim()}
                                                className="p-1.5 text-green-600 outline-none hover:bg-green-100 dark:hover:bg-green-500/20 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => { setCatEditId(null); setCatEditName(''); }}
                                                className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-sm font-medium text-slate-800 dark:text-white">{cat.name}</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => { setCatEditId(cat.id); setCatEditName(cat.name); }}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* TAB CONTENT: ONBOARDING FORMS */}
            {activeTab === 'onboarding' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Onboarding Forms</h2>
                            <p className="text-xs text-slate-500 mt-1">Design registration pathways mapped specifically to this industry.</p>
                        </div>
                        <button
                            onClick={handleCreateForm}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 outline-none hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                            <Plus className="w-3.5 h-3.5" /> Initialize New Form
                        </button>
                    </div>

                    {forms.length === 0 ? (
                        <div className="py-16 text-center">
                            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 font-medium">No Onboarding Forms created yet.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {forms.map((form) => (
                                <li key={form.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors gap-3">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{form.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${form.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                                {form.status}
                                            </span>
                                            <span className="text-xs text-slate-400">Created {new Date(form.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/admin/surveys/${form.id}`}
                                            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
                                        >
                                            Survey Builder
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteForm(form.id, form.name)}
                                            className="p-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors shadow-sm"
                                            title="Delete Form"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
