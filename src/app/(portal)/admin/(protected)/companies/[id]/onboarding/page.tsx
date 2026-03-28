'use client';

import { FileText, Plus, Link as LinkIcon, Trash2, Pencil, Eye } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useAlert } from '@/components/ui/AlertDialog';
import { useToast } from '@/components/ui/Toast';

export default function CompanyOnboardingFormsPage() {
    const params = useParams();
    const companyId = params.id as string;
    const { confirm, error } = useAlert();
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [responses, setResponses] = useState<any[]>([]);
    const [availableForms, setAvailableForms] = useState<any[]>([]);
    const [isAssigning, setIsAssigning] = useState(false);
    const [selectedFormId, setSelectedFormId] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // 1. Fetch Company details briefly to get Industry ID
            const companyRes = await fetch(`/api/v1/companies/${companyId}`, { headers });
            const companyJson = await companyRes.json();
            const industryId = companyJson.data?.industry?.id;

            // 2. Fetch Assigned Responses
            const respRes = await fetch(`/api/v1/surveys/responses?company_id=${companyId}`, { headers });
            const respJson = await respRes.json();
            if (respJson.status) {
                const obResponses = respJson.data.filter((r: any) => r.template?.type === 'ONBOARDING');
                setResponses(obResponses);
            }

            // 3. Fetch Available Onboarding Forms
            const formsRes = await fetch(`/api/v1/surveys?type=ONBOARDING&status=ACTIVE`, { headers });
            const formsJson = await formsRes.json();
            if (formsJson.status) {
                const forms = formsJson.data.filter((f: any) => 
                    !f.industry_id || f.industry_id === industryId
                );
                setAvailableForms(forms);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        if (companyId) {
            fetchData();
        }
    }, [fetchData, companyId]);

    const handleDeleteAssignment = async (responseId: string) => {
        if (!await confirm('Delete Assignment', 'Are you sure you want to delete this onboarding assignment? This action cannot be undone.')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/surveys/responses/${responseId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.status) {
                toast.success('Assignment deleted');
                fetchData();
            } else {
                error('Deletion Failed', json.message);
            }
        } catch (err) {
            error('Error', 'Failed to delete assignment.');
        }
    };

    const handleAssignForm = async () => {
        if (!selectedFormId) return;
        setAssignLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/surveys/responses`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template_id: selectedFormId,
                    company_id: companyId,
                    is_assignment: true
                })
            });
            const json = await res.json();
            if (json.status) {
                toast.success('Onboarding form assigned successfully');
                setIsAssigning(false);
                setSelectedFormId('');
                fetchData();
            } else {
                error('Assignment Failed', json.message);
            }
        } catch (err) {
            error('Error', 'Failed to assign the form.');
        } finally {
            setAssignLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center text-slate-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3">Loading onboarding forms...</span>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assigned Onboarding Forms</h2>
                    <p className="text-sm text-slate-500 mt-1 pb-4">
                        Manage registration flows explicitly assigned to this company.
                    </p>
                </div>
                <button
                    onClick={() => setIsAssigning(true)}
                    disabled={isAssigning}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 outline-none hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Assign New Form
                </button>
            </div>

            {isAssigning && (
                <div className="flex flex-col sm:flex-row items-center gap-3 p-4 mb-6 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                    <select
                        value={selectedFormId}
                        onChange={(e) => setSelectedFormId(e.target.value)}
                        className="flex-1 w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select Onboarding Form...</option>
                        {availableForms.map((form) => (
                            <option key={form.id} value={form.id}>{form.name}</option>
                        ))}
                    </select>
                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <button
                            onClick={handleAssignForm}
                            disabled={assignLoading || !selectedFormId}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex-1 sm:flex-none disabled:opacity-50"
                        >
                            {assignLoading ? 'Assigning...' : 'Assign Form'}
                        </button>
                        <button
                            onClick={() => setIsAssigning(false)}
                            className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {responses.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-4 border border-slate-100 dark:border-slate-700">
                        <LinkIcon className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">No forms assigned</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm">Assign an onboarding form to this company so their supervisors can complete it from their dashboard.</p>
                </div>
            ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {responses.map((response) => (
                        <li key={response.id} className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl flex-shrink-0 ${
                                    response.status === 'COMPLETED' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                    response.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                    'bg-slate-100 text-slate-500 dark:bg-slate-900/50 dark:text-slate-400'
                                }`}>
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                                        {response.template?.name || 'Unknown Form'}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                                            response.status === 'COMPLETED' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400' :
                                            response.status === 'IN_PROGRESS' ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400' :
                                            'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                                        }`}>
                                            {response.status === 'DRAFT' ? 'ASSIGNED' : response.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            &bull; Assigned on {new Date(response.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-xs text-slate-500 line-clamp-2">
                                            {response.template?.description || 'Required onboarding information flow.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                    {(response.status === 'COMPLETED' || response.status === 'IN_PROGRESS') && (
                                        <button
                                            onClick={() => window.open(`/admin/companies/${companyId}/onboarding/${response.id}/view`, '_blank')}
                                            className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800/50 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 rounded-lg transition-colors border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800"
                                            title="View Submission"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    )}
                                    {response.status === 'DRAFT' && (
                                        <>
                                            <button
                                                onClick={() => window.open(`/admin/surveys/fill/${response.id}`, '_blank')}
                                                className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800/50 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 rounded-lg transition-colors border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800"
                                                title="Edit (Prefill) Assignment"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAssignment(response.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 dark:bg-slate-800/50 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg transition-colors border border-slate-100 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800"
                                                title="Delete Assignment"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
