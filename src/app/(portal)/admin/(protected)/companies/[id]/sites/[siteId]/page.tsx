'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useHeader } from '@/components/HeaderContext';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import {
	ArrowLeft,
	MapPin,
	ClipboardList,
	Play,
	Eye,
	Loader2,
	Building2,
	HardHat,
	Calendar,
	User,
	CheckCircle2,
	Clock,
	FileEdit,
} from 'lucide-react';

/** Site detail from API */
interface SiteDetail {
	id: string;
	name: string;
	address: string | null;
	project_stage: string | null;
	expected_duration_months: number | null;
	status: 'ACTIVE' | 'INACTIVE';
	company?: { id: string; name: string };
	contractor_rep?: { id: string; first_name: string; last_name: string } | null;
	site_supervisor?: { id: string; first_name: string; last_name: string } | null;
	survey_responses: SurveyResponseRow[];
	created_at: string;
}

/** Survey response row */
interface SurveyResponseRow {
	id: string;
	status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
	template?: { id: string; name: string; slug: string | null };
	respondent?: { id: string; first_name: string; last_name: string };
	completed_at: string | null;
	created_at: string;
}

/** System survey slug used to find the template */
const SYSTEM_SURVEY_SLUG = 'lcp-site-visit';

/** Status badge colours */
const RESPONSE_STATUS_STYLES: Record<string, string> = {
	DRAFT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
	IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
	COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
};

/** Status icons */
const RESPONSE_STATUS_ICONS: Record<string, typeof Clock> = {
	DRAFT: FileEdit,
	IN_PROGRESS: Clock,
	COMPLETED: CheckCircle2,
};

/** Project stage labels */
const STAGE_LABELS: Record<string, string> = {
	FOUNDATION: 'Foundation',
	STRUCTURE: 'Structure',
	MASONRY: 'Masonry',
	FINISHING: 'Finishing',
	MEP: 'MEP',
};

/**
 * Site Detail page — shows site info and all survey responses.
 * Accessible via /admin/companies/[id]/sites/[siteId]
 */
export default function SiteDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { setTitle, setActions } = useHeader();

	const companyId = params?.id as string;
	const siteId = params?.siteId as string;

	const [site, setSite] = useState<SiteDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [startingSurvey, setStartingSurvey] = useState(false);
	const [systemTemplateId, setSystemTemplateId] = useState<string | null>(null);

	/** Fetch helper with auth */
	const apiFetch = useCallback(async (url: string, opts: RequestInit = {}) => {
		const token = localStorage.getItem('token');
		const headers: any = { 'Authorization': `Bearer ${token}`, ...opts.headers };
		if (opts.body && typeof opts.body === 'string') {
			headers['Content-Type'] = 'application/json';
		}
		const res = await fetch(url, { ...opts, headers });
		return res.json();
	}, []);

	/** Fetch site detail */
	const fetchSite = useCallback(async () => {
		setLoading(true);
		try {
			const json = await apiFetch(`/api/v1/companies/${companyId}/sites/${siteId}`);
			if (json.status) {
				setSite(json.data);
			}
		} catch (err) {
			console.error('Failed to fetch site:', err);
		} finally {
			setLoading(false);
		}
	}, [companyId, siteId, apiFetch]);

	/** Fetch system survey template ID by slug */
	useEffect(() => {
		const fetchTemplate = async () => {
			try {
				const json = await apiFetch('/api/v1/surveys');
				if (json.status && json.data) {
					const systemTemplate = json.data.find((t: any) => t.slug === SYSTEM_SURVEY_SLUG);
					if (systemTemplate) {
						setSystemTemplateId(systemTemplate.id);
					}
				}
			} catch (err) {
				console.error('Failed to fetch templates:', err);
			}
		};
		fetchTemplate();
	}, [apiFetch]);

	useEffect(() => {
		if (companyId && siteId) fetchSite();
	}, [companyId, siteId, fetchSite]);

	/** Set header */
	useEffect(() => {
		setTitle(site ? `${site.name}` : 'Site Details');
		setActions(
			<button
				onClick={() => router.push(`/admin/companies/${companyId}/sites`)}
				className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
			>
				<ArrowLeft className="w-4 h-4" />
				Back to Sites
			</button>
		);
		return () => setActions(null);
	}, [setTitle, setActions, site, companyId, router]);

	/** Start a new survey for this site */
	const handleStartSurvey = async () => {
		if (!systemTemplateId) {
			alert('System survey template not found. Please seed the database first.');
			return;
		}

		setStartingSurvey(true);
		try {
			const json = await apiFetch('/api/v1/surveys/responses', {
				method: 'POST',
				body: JSON.stringify({
					template_id: systemTemplateId,
					company_id: companyId,
					site_id: siteId,
				}),
			});

			if (json.status && json.data?.responseId) {
				// Navigate to the survey fill page
				router.push(`/admin/surveys/fill/${json.data.responseId}`);
			} else {
				alert(json.message || 'Failed to start survey');
			}
		} catch (err) {
			console.error('Failed to start survey:', err);
			alert('Failed to start survey');
		} finally {
			setStartingSurvey(false);
		}
	};

	/** Survey responses table columns */
	const responseColumns = useMemo<ColumnDef<SurveyResponseRow>[]>(() => [
		{
			accessorKey: 'template',
			header: 'Survey',
			cell: ({ row }) => (
				<div className="flex items-center gap-3">
					<div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
						<ClipboardList className="w-4 h-4" />
					</div>
					<span className="font-medium text-slate-900 dark:text-white text-sm">
						{row.original.template?.name || 'Unknown'}
					</span>
				</div>
			),
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => {
				const StatusIcon = RESPONSE_STATUS_ICONS[row.original.status] || Clock;
				return (
					<span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${RESPONSE_STATUS_STYLES[row.original.status] || ''}`}>
						<StatusIcon className="w-3 h-3" />
						{row.original.status.replace('_', ' ')}
					</span>
				);
			},
		},
		{
			accessorKey: 'respondent',
			header: 'Respondent',
			cell: ({ row }) => {
				const r = row.original.respondent;
				if (!r) return <span className="text-slate-400">—</span>;
				return (
					<div className="flex items-center gap-2">
						<User className="w-3.5 h-3.5 text-slate-400" />
						<span className="text-sm text-slate-700 dark:text-slate-300">
							{r.first_name} {r.last_name}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: 'created_at',
			header: 'Started',
			cell: ({ row }) => (
				<span className="text-sm text-slate-500 dark:text-slate-400">
					{new Date(row.original.created_at).toLocaleDateString('en-US', {
						day: 'numeric',
						month: 'short',
						year: 'numeric',
					})}
				</span>
			),
		},
		{
			id: 'actions',
			cell: ({ row }) => (
				<button
					onClick={() => router.push(`/admin/surveys/fill/${row.original.id}`)}
					className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded transition-colors"
					title={row.original.status === 'COMPLETED' ? 'View Survey' : 'Continue Survey'}
				>
					<Eye className="w-4 h-4" />
				</button>
			),
		},
	], [router]);

	// Loading state
	if (loading) {
		return (
			<div className="flex items-center justify-center p-12">
				<Loader2 className="w-8 h-8 animate-spin text-blue-600" />
			</div>
		);
	}

	// Not found
	if (!site) {
		return (
			<div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
				<h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">Site not found</h3>
				<p className="text-sm text-slate-500 dark:text-slate-400">
					The site you&apos;re looking for doesn&apos;t exist or has been deleted.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* ── Site Info Card ── */}
			<div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
				{/* Gradient banner */}
				<div className="h-20 bg-gradient-to-r from-emerald-600 to-teal-600" />

				<div className="px-6 pb-6">
					{/* Icon + title */}
					<div className="flex items-end gap-4 -mt-6">
						<div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 border-4 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-lg">
							<MapPin className="w-7 h-7" />
						</div>
						<div className="pb-1 flex-1 min-w-0">
							<h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
								{site.name}
							</h2>
							{site.company && (
								<div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mt-0.5">
									<Building2 className="w-3.5 h-3.5" />
									{site.company.name}
								</div>
							)}
						</div>

						{/* Start Survey button */}
						<button
							onClick={handleStartSurvey}
							disabled={startingSurvey || !systemTemplateId}
							className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm flex-shrink-0"
						>
							{startingSurvey ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Play className="w-4 h-4" />
							)}
							{startingSurvey ? 'Starting...' : 'Start Survey'}
						</button>
					</div>

					{/* Info grid */}
					<div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
						{site.address && (
							<InfoItem icon={MapPin} label="Address" value={site.address} />
						)}
						{site.project_stage && (
							<InfoItem icon={HardHat} label="Stage" value={STAGE_LABELS[site.project_stage] || site.project_stage} />
						)}
						{site.expected_duration_months && (
							<InfoItem icon={Calendar} label="Duration" value={`${site.expected_duration_months} months`} />
						)}
						{site.contractor_rep && (
							<InfoItem icon={User} label="Contractor Rep" value={`${site.contractor_rep.first_name} ${site.contractor_rep.last_name}`} />
						)}
						{site.site_supervisor && (
							<InfoItem icon={User} label="Site Supervisor" value={`${site.site_supervisor.first_name} ${site.site_supervisor.last_name}`} />
						)}
					</div>
				</div>
			</div>

			{/* ── Survey Responses ── */}
			<div>
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
						<ClipboardList className="w-5 h-5 text-blue-600" />
						Survey Responses
						<span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-1">
							({site.survey_responses?.length || 0})
						</span>
					</h3>
				</div>

				{site.survey_responses?.length > 0 ? (
					<DataTable
						columns={responseColumns}
						data={site.survey_responses}
					/>
				) : (
					<div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
						<div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
							<ClipboardList className="w-6 h-6 text-slate-400" />
						</div>
						<h4 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
							No surveys yet
						</h4>
						<p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
							Start a survey to assess this site.
						</p>
						<button
							onClick={handleStartSurvey}
							disabled={startingSurvey || !systemTemplateId}
							className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
						>
							<Play className="w-4 h-4" />
							Start First Survey
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

/**
 * Compact info item for the site header card.
 */
function InfoItem({
	icon: Icon,
	label,
	value,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	value: string;
}) {
	return (
		<div className="flex items-start gap-2.5">
			<Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
			<div className="min-w-0">
				<span className="text-xs text-slate-500 dark:text-slate-400 block">{label}</span>
				<span className="text-sm font-medium text-slate-900 dark:text-white truncate block">{value}</span>
			</div>
		</div>
	);
}
