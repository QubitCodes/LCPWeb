'use client';

import { useEffect, useState, useMemo } from 'react';
import { useHeader } from '@/components/HeaderContext';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import {
	ClipboardList,
	Plus,
	ExternalLink,
	Trash2,
	Eye,
	FileText,
	Brain,
	Loader2,
	Shield
} from 'lucide-react';
import { useRouter } from 'next/navigation';

/** Survey template shape from API */
interface SurveyTemplateRow {
	id: string;
	name: string;
	slug: string | null;
	description: string | null;
	type: 'SURVEY' | 'QUIZ';
	status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
	is_system: boolean;
	sections?: { id: string }[];
	created_at: string;
}

/**
 * Admin Survey Templates list page.
 * Lists all survey/quiz templates with status, type, and section counts.
 */
export default function SurveysPage() {
	const { setTitle, setActions } = useHeader();
	const router = useRouter();
	const [data, setData] = useState<SurveyTemplateRow[]>([]);
	const [loading, setLoading] = useState(true);

	// Set page header with "New Template" action button
	useEffect(() => {
		setTitle('Survey Templates');
		setActions(
			<button
				onClick={() => setShowCreateModal(true)}
				className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
			>
				<Plus className="w-4 h-4" />
				New Template
			</button>
		);

		return () => setActions(null);
	}, [setTitle, setActions]);

	const [showCreateModal, setShowCreateModal] = useState(false);
	const [createName, setCreateName] = useState('');
	const [createDescription, setCreateDescription] = useState('');
	const [creating, setCreating] = useState(false);

	/** Fetch all templates */
	const fetchTemplates = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem('token');
			const res = await fetch('/api/v1/surveys', {
				headers: { 'Authorization': `Bearer ${token}` }
			});
			const json = await res.json();
			if (json.status) setData(json.data || []);
		} catch (error) {
			console.error('Failed to fetch surveys:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { fetchTemplates(); }, []);

	/** Create a new template */
	const handleCreate = async () => {
		if (!createName.trim()) return;
		setCreating(true);
		try {
			const token = localStorage.getItem('token');
			const res = await fetch('/api/v1/surveys', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
				body: JSON.stringify({
					name: createName.trim(),
					type: 'SURVEY',
					description: createDescription.trim() || null,
				}),
			});
			const json = await res.json();
			if (json.status && json.data?.id) {
				// Navigate to the builder
				router.push(`/admin/surveys/${json.data.id}`);
			}
		} catch (error) {
			console.error('Failed to create template:', error);
		} finally {
			setCreating(false);
		}
	};

	/** Delete a template (soft delete via API) */
	const handleDelete = async (id: string, name: string) => {
		if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
		try {
			const token = localStorage.getItem('token');
			const res = await fetch(`/api/v1/surveys/${id}`, {
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${token}` },
			});
			const json = await res.json();
			if (json.status) {
				fetchTemplates();
			}
		} catch (error) {
			console.error('Failed to delete template:', error);
		}
	};

	/** Status badge colors */
	const statusStyles: Record<string, string> = {
		ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
		INACTIVE: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
		DRAFT: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
	};

	/** Table columns */
	const columns = useMemo<ColumnDef<SurveyTemplateRow>[]>(() => [
		{
			accessorKey: 'name',
			header: 'Template Name',
			cell: ({ row }) => (
				<div className="flex items-center gap-3">
					<div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${row.original.type === 'QUIZ'
						? 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'
						: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
						}`}>
						{row.original.type === 'QUIZ'
							? <Brain className="w-5 h-5" />
							: <ClipboardList className="w-5 h-5" />
						}
					</div>
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<button
								onClick={() => router.push(`/admin/surveys/${row.original.id}`)}
								className="font-medium text-slate-900 dark:text-white block truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
							>
								{row.original.name}
							</button>
							{row.original.is_system && (
								<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 flex-shrink-0">
									<Shield className="w-3 h-3" />
									System
								</span>
							)}
						</div>
						{row.original.description && (
							<span className="text-xs text-slate-500 dark:text-slate-400 block truncate max-w-xs">
								{row.original.description}
							</span>
						)}
					</div>
				</div>
			),
		},
		{
			accessorKey: 'type',
			header: 'Type',
			cell: ({ row }) => (
				<span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${row.original.type === 'QUIZ'
					? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'
					: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
					}`}>
					{row.original.type === 'QUIZ' ? <Brain className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
					{row.original.type}
				</span>
			),
		},
		{
			accessorFn: (row) => row.sections?.length || 0,
			id: 'sections',
			header: 'Sections',
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<span className="font-mono text-slate-900 dark:text-white">{row.original.sections?.length || 0}</span>
					<span className="text-xs text-slate-500">sections</span>
				</div>
			),
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => (
				<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[row.original.status] || statusStyles.DRAFT
					}`}>
					{row.original.status}
				</span>
			),
		},
		{
			id: 'actions',
			cell: ({ row }) => (
				<div className="flex justify-end gap-1">
					<button
						onClick={() => router.push(`/admin/surveys/${row.original.id}`)}
						className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded transition-colors"
						title="Open Builder"
					>
						<ExternalLink className="w-4 h-4" />
					</button>
					<button
						onClick={() => window.open(`/admin/surveys/${row.original.id}/preview`, '_blank')}
						className="p-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded transition-colors"
						title="Preview Survey"
					>
						<Eye className="w-4 h-4" />
					</button>
					{!row.original.is_system && (
						<button
							onClick={() => handleDelete(row.original.id, row.original.name)}
							className="p-1.5 text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100"
							title="Delete Template"
						>
							<Trash2 className="w-4 h-4" />
						</button>
					)}
				</div>
			),
		},
	], [router]);

	return (
		<div className="space-y-6">
			<DataTable
				columns={columns}
				data={data}
				isLoading={loading}
			/>

			{/* ── Create Template Modal ── */}
			{showCreateModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
					<div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 mx-4">
						<h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
							Create New Template
						</h2>

						{/* Name */}
						<label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
							Template Name *
						</label>
						<input
							type="text"
							value={createName}
							onChange={(e) => setCreateName(e.target.value)}
							placeholder="e.g. LCP Site Validation Checklist"
							className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
						/>

						{/* Description */}
						<label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
							Description
						</label>
						<textarea
							value={createDescription}
							onChange={(e) => setCreateDescription(e.target.value)}
							placeholder="Optional description..."
							rows={2}
							className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
						/>

						{/* Actions */}
						<div className="flex justify-end gap-3">
							<button
								onClick={() => setShowCreateModal(false)}
								className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleCreate}
								disabled={creating || !createName.trim()}
								className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
							>
								{creating ? 'Creating...' : 'Create & Edit'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
