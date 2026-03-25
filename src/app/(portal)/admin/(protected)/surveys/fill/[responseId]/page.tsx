'use client';

import { useEffect, useState, useCallback } from 'react';
import { useHeader } from '@/components/HeaderContext';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ClipboardList, Brain, Loader2, AlertTriangle } from 'lucide-react';
import SurveyRenderer from '@/components/survey/SurveyRenderer';
import SignoffPanel from '@/components/survey/SignoffPanel';

/** Shape returned by getResponseForFilling */
interface ResponseData {
	id: string;
	status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
	company_id: string;
	site_id: string | null;
	template: {
		id: string;
		name: string;
		type: 'SURVEY' | 'QUIZ';
		sections: any[];
	};
	answers: { question_id: string; answer_text: string | null; answer_json: any | null }[];
	signoffs: any[];
}

/**
 * Survey Fill Page — loads a response + template structure and renders the SurveyRenderer.
 * Route: /admin/surveys/fill/[responseId]
 */
export default function SurveyFillPage() {
	const { setTitle, setActions } = useHeader();
	const router = useRouter();
	const params = useParams();
	const searchParams = useSearchParams();
	const responseId = params.responseId as string;

	const [data, setData] = useState<ResponseData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	/** Fetch response with template structure */
	const fetchResponse = useCallback(async (showLoader = true) => {
		try {
			if (showLoader) setLoading(true);
			setError(null);
			const token = localStorage.getItem('token');
			const res = await fetch(`/api/v1/surveys/responses/${responseId}`, {
				headers: { 'Authorization': `Bearer ${token}` },
			});
			const json = await res.json();
			if (json.status && json.data) {
				setData(json.data);
			} else {
				setError(json.message || 'Failed to load survey');
			}
		} catch (err) {
			console.error('Fetch Error:', err);
			setError('Network error');
		} finally {
			if (showLoader) setLoading(false);
		}
	}, [responseId]);

	useEffect(() => { fetchResponse(true); }, [fetchResponse]);

	// Set header
	useEffect(() => {
		setTitle(data ? data.template.name : 'Fill Survey');
		setActions(
			<button
				onClick={() => router.back()}
				className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
			>
				<ArrowLeft className="w-4 h-4" />
				Back
			</button>
		);
		return () => setActions(null);
	}, [setTitle, setActions, data, router]);

	// Loading
	if (loading) {
		return (
			<div className="flex items-center justify-center h-full min-h-[400px]">
				<Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
			</div>
		);
	}

	// Error
	if (error || !data) {
		return (
			<div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-500 dark:text-slate-400">
				<AlertTriangle className="w-12 h-12 mb-3 text-amber-500" />
				<p className="text-lg font-medium">{error || 'Survey not found'}</p>
				<button
					onClick={() => router.back()}
					className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
				>
					Go Back
				</button>
			</div>
		);
	}

	const isQuiz = data.template.type === 'QUIZ';
	const isCompleted = data.status === 'COMPLETED';

	return (
		<div className="max-w-3xl mx-auto pb-12">
			{/* Template info header */}
			<div className="mb-6 flex items-center gap-3">
				<div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isQuiz
					? 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'
					: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
					}`}>
					{isQuiz ? <Brain className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
				</div>
				<div>
					<h2 className="text-lg font-semibold text-slate-900 dark:text-white">{data.template.name}</h2>
					<div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
						<span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${isCompleted
							? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
							: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
							}`}>
							{data.status.replace('_', ' ')}
						</span>
						<span>{data.template.sections?.length || 0} sections</span>
					</div>
				</div>
			</div>

			{/* Completed banner */}
			{isCompleted && (
				<div className="mb-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg p-4 flex items-center gap-3">
					<div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0">
						<svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<p className="text-sm font-medium text-green-800 dark:text-green-300">
						This survey has been completed and submitted. Answers are read-only.
					</p>
				</div>
			)}

			{/* Survey renderer */}
			<SurveyRenderer
				responseId={data.id}
				sections={data.template.sections || []}
				existingAnswers={data.answers || []}
				status={data.status}
				isQuiz={isQuiz}
				contextCompanyId={data.company_id}
				urlParams={searchParams}
				onSaved={() => fetchResponse(false)}
				onCompleted={() => {
					fetchResponse(true);
				}}
			/>

			{/* Sign-off panel — shown after survey is completed */}
			{isCompleted && (
				<div className="mt-8">
					<SignoffPanel
						responseId={data.id}
						existingSignoffs={data.signoffs || []}
						isCompleted={isCompleted}
						onSignoffAdded={fetchResponse}
					/>
				</div>
			)}
		</div>
	);
}
