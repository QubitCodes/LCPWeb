'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useHeader } from '@/components/HeaderContext';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import {
	ArrowLeft,
	MapPin,
	Plus,
	Eye,
	Trash2,
	Loader2,
	X,
	Building2,
	ClipboardList,
	HardHat,
} from 'lucide-react';

/** Site shape from API */
interface SiteRow {
	id: string;
	name: string;
	address: string | null;
	project_stage: string | null;
	expected_duration_months: number | null;
	status: 'ACTIVE' | 'INACTIVE';
	survey_response_count: number;
	contractor_rep?: { id: string; first_name: string; last_name: string } | null;
	site_supervisor?: { id: string; first_name: string; last_name: string } | null;
	created_at: string;
}

/** Company info for the header */
interface CompanyInfo {
	id: string;
	name: string;
}

/** Project stage labels */
const STAGE_LABELS: Record<string, string> = {
	FOUNDATION: 'Foundation',
	STRUCTURE: 'Structure',
	MASONRY: 'Masonry',
	FINISHING: 'Finishing',
	MEP: 'MEP',
};

/** Stage badge colours */
const STAGE_STYLES: Record<string, string> = {
	FOUNDATION: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
	STRUCTURE: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
	MASONRY: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
	FINISHING: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
	MEP: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
};

/**
 * Company Sites page — lists all sites for a company.
 * Accessible via /admin/companies/[id]/sites
 */
export default function CompanySitesPage() {
	const params = useParams();
	const router = useRouter();
	const { setTitle, setActions } = useHeader();

	const companyId = params?.id as string;

	const [sites, setSites] = useState<SiteRow[]>([]);
	const [company, setCompany] = useState<CompanyInfo | null>(null);
	const [loading, setLoading] = useState(true);

	// Add Site modal state
	const [showAddModal, setShowAddModal] = useState(false);
	const [newSiteName, setNewSiteName] = useState('');
	const [newSiteAddress, setNewSiteAddress] = useState('');
	const [creating, setCreating] = useState(false);

	/** Fetch company info */
	useEffect(() => {
		const fetchCompany = async () => {
			try {
				const token = localStorage.getItem('token');
				const res = await fetch(`/api/v1/companies?search=${companyId}`, {
					headers: { 'Authorization': `Bearer ${token}` },
				});
				const json = await res.json();
				if (json.status && json.data?.length > 0) {
					setCompany(json.data[0]);
				}
			} catch (err) {
				console.error('Failed to fetch company:', err);
			}
		};
		if (companyId) fetchCompany();
	}, [companyId]);

	/** Fetch sites */
	const fetchSites = useCallback(async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem('token');
			const res = await fetch(`/api/v1/companies/${companyId}/sites`, {
				headers: { 'Authorization': `Bearer ${token}` },
			});
			const json = await res.json();
			if (json.status) {
				setSites(json.data || []);
			}
		} catch (err) {
			console.error('Failed to fetch sites:', err);
		} finally {
			setLoading(false);
		}
	}, [companyId]);

	useEffect(() => {
		if (companyId) fetchSites();
	}, [companyId, fetchSites]);

	/** Set header */
	useEffect(() => {
		setTitle(company ? `${company.name} — Sites` : 'Company Sites');
		setActions(
			<div className="flex items-center gap-3">
				<button
					onClick={() => router.push('/admin/companies')}
					className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
				>
					<ArrowLeft className="w-4 h-4" />
					Back
				</button>
				<button
					onClick={() => setShowAddModal(true)}
					className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
				>
					<Plus className="w-4 h-4" />
					Add Site
				</button>
			</div>
		);
		return () => setActions(null);
	}, [setTitle, setActions, company, router]);

	/** Create a new site */
	const handleCreate = async () => {
		if (!newSiteName.trim()) return;
		setCreating(true);
		try {
			const token = localStorage.getItem('token');
			const res = await fetch(`/api/v1/companies/${companyId}/sites`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
				body: JSON.stringify({
					name: newSiteName.trim(),
					address: newSiteAddress.trim() || undefined,
				}),
			});
			const json = await res.json();
			if (json.status) {
				setShowAddModal(false);
				setNewSiteName('');
				setNewSiteAddress('');
				fetchSites();
			}
		} catch (err) {
			console.error('Failed to create site:', err);
		} finally {
			setCreating(false);
		}
	};

	/** Delete a site */
	const handleDelete = async (siteId: string, siteName: string) => {
		if (!confirm(`Are you sure you want to delete "${siteName}"?`)) return;
		try {
			const token = localStorage.getItem('token');
			await fetch(`/api/v1/companies/${companyId}/sites/${siteId}`, {
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${token}` },
			});
			fetchSites();
		} catch (err) {
			console.error('Failed to delete site:', err);
		}
	};

	/** Table columns */
	const columns = useMemo<ColumnDef<SiteRow>[]>(() => [
		{
			accessorKey: 'name',
			header: 'Site Name',
			cell: ({ row }) => (
				<div className="flex items-center gap-3">
					<div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
						<MapPin className="w-5 h-5" />
					</div>
					<div className="min-w-0">
						<button
							onClick={() => router.push(`/admin/companies/${companyId}/sites/${row.original.id}`)}
							className="font-medium text-slate-900 dark:text-white block truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
						>
							{row.original.name}
						</button>
						{row.original.address && (
							<span className="text-xs text-slate-500 dark:text-slate-400 block truncate max-w-xs">
								{row.original.address}
							</span>
						)}
					</div>
				</div>
			),
		},
		{
			accessorKey: 'project_stage',
			header: 'Stage',
			cell: ({ row }) => {
				const stage = row.original.project_stage;
				if (!stage) return <span className="text-slate-400">—</span>;
				return (
					<span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_STYLES[stage] || ''}`}>
						<HardHat className="w-3 h-3" />
						{STAGE_LABELS[stage] || stage}
					</span>
				);
			},
		},
		{
			accessorKey: 'survey_response_count',
			header: 'Surveys',
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<ClipboardList className="w-4 h-4 text-slate-400" />
					<span className="font-mono text-slate-900 dark:text-white">{row.original.survey_response_count}</span>
				</div>
			),
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => (
				<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.original.status === 'ACTIVE'
						? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
						: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
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
						onClick={() => router.push(`/admin/companies/${companyId}/sites/${row.original.id}`)}
						className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded transition-colors"
						title="View Site"
					>
						<Eye className="w-4 h-4" />
					</button>
					<button
						onClick={() => handleDelete(row.original.id, row.original.name)}
						className="p-1.5 text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100"
						title="Delete Site"
					>
						<Trash2 className="w-4 h-4" />
					</button>
				</div>
			),
		},
	], [companyId, router]);

	return (
		<div className="space-y-6">
			{/* Navigation tabs — link to People and Sites */}
			<div className="flex gap-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1 w-fit">
				<button
					onClick={() => router.push(`/admin/companies/${companyId}/people`)}
					className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
				>
					<Building2 className="w-4 h-4" />
					People
				</button>
				<button
					className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-emerald-600 text-white shadow-sm"
				>
					<MapPin className="w-4 h-4" />
					Sites
				</button>
			</div>

			{/* Table */}
			{loading ? (
				<div className="flex items-center justify-center p-12">
					<Loader2 className="w-8 h-8 animate-spin text-blue-600" />
				</div>
			) : sites.length > 0 ? (
				<DataTable columns={columns} data={sites} />
			) : (
				<div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
					<div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
						<MapPin className="w-6 h-6 text-slate-400" />
					</div>
					<h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
						No sites found
					</h3>
					<p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
						This company doesn&apos;t have any sites yet.
					</p>
					<button
						onClick={() => setShowAddModal(true)}
						className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
					>
						<Plus className="w-4 h-4" />
						Add First Site
					</button>
				</div>
			)}

			{/* ── Add Site Modal ── */}
			{showAddModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
					<div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 mx-4">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-lg font-semibold text-slate-900 dark:text-white">
								Add New Site
							</h2>
							<button
								onClick={() => setShowAddModal(false)}
								className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Site Name */}
						<label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
							Site Name *
						</label>
						<input
							type="text"
							value={newSiteName}
							onChange={(e) => setNewSiteName(e.target.value)}
							placeholder="e.g. Downtown Tower Project"
							className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
							autoFocus
						/>

						{/* Address */}
						<label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
							Address
						</label>
						<textarea
							value={newSiteAddress}
							onChange={(e) => setNewSiteAddress(e.target.value)}
							placeholder="Optional site address..."
							rows={2}
							className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
						/>

						{/* Actions */}
						<div className="flex justify-end gap-3">
							<button
								onClick={() => setShowAddModal(false)}
								className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleCreate}
								disabled={creating || !newSiteName.trim()}
								className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
							>
								{creating ? 'Creating...' : 'Create Site'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
