'use client';

import { useEffect, useState, useCallback } from 'react';
import { useHeader } from '@/components/HeaderContext';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardList, Brain, Loader2, AlertTriangle, Eye } from 'lucide-react';
import SurveyRenderer from '@/components/survey/SurveyRenderer';

/**
 * Survey Preview Page — shows the survey exactly as it would appear
 * when being filled out on-site, but with no save/submit actions.
 * Route: /admin/surveys/[id]/preview
 */
export default function SurveyPreviewPage() {
	const { setTitle, setActions } = useHeader();
	const router = useRouter();
	const params = useParams();
	const templateId = params.id as string;

	const [template, setTemplate] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	/** Fetch template with sections + questions + options */
	const fetchTemplate = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const token = localStorage.getItem('token');
			const res = await fetch(`/api/v1/surveys/${templateId}`, {
				headers: { 'Authorization': `Bearer ${token}` },
			});
			const json = await res.json();
			if (json.status && json.data) {
				setTemplate(json.data);
			} else {
				setError(json.message || 'Failed to load template');
			}
		} catch (err) {
			console.error('Fetch Error:', err);
			setError('Network error');
		} finally {
			setLoading(false);
		}
	}, [templateId]);

	useEffect(() => { fetchTemplate(); }, [fetchTemplate]);

	// Set header
	useEffect(() => {
		setTitle(template ? `Preview: ${template.name}` : 'Survey Preview');
		setActions(
			<button
				onClick={() => router.back()}
				className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
			>
				<ArrowLeft className="w-4 h-4" />
				Back to Builder
			</button>
		);
		return () => setActions(null);
	}, [setTitle, setActions, template, router]);

	// Loading
	if (loading) {
		return (
			<div className="flex items-center justify-center h-full min-h-[400px]">
				<Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
			</div>
		);
	}

	// Error
	if (error || !template) {
		return (
			<div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-500 dark:text-slate-400">
				<AlertTriangle className="w-12 h-12 mb-3 text-amber-500" />
				<p className="text-lg font-medium">{error || 'Template not found'}</p>
				<button
					onClick={() => router.back()}
					className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
				>
					Go Back
				</button>
			</div>
		);
	}

	const isQuiz = template.type === 'QUIZ';

	return (
		<div className="max-w-3xl mx-auto pb-12">
			{/* Preview banner */}
			<div className="mb-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
				<div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
					<Eye className="w-5 h-5 text-amber-600 dark:text-amber-400" />
				</div>
				<p className="text-sm font-medium text-amber-800 dark:text-amber-300">
					Preview Mode — This is how the survey will appear when being filled out. All inputs are interactive but nothing will be saved.
				</p>
			</div>

			{/* Template info header */}
			<div className="mb-6 flex items-center gap-3">
				<div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isQuiz
					? 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'
					: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
					}`}>
					{isQuiz ? <Brain className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
				</div>
				<div>
					<h2 className="text-lg font-semibold text-slate-900 dark:text-white">{template.name}</h2>
					{template.description && (
						<p className="text-sm text-slate-500 dark:text-slate-400">{template.description}</p>
					)}
					<div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
						<span>{template.sections?.length || 0} sections</span>
						<span>·</span>
						<span>
							{template.sections?.reduce((acc: number, s: any) => acc + (s.questions?.length || 0), 0) || 0} questions
						</span>
					</div>
				</div>
			</div>

			{/* Survey renderer in preview mode */}
			<SurveyRenderer
				responseId={`preview-${templateId}`}
				sections={template.sections || []}
				existingAnswers={[]}
				status="DRAFT"
				isQuiz={isQuiz}
				previewMode={true}
			/>
		</div>
	);
}
