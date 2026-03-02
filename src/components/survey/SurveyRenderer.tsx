'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
	ChevronDown,
	ChevronRight,
	CheckCircle,
	Circle,
	AlertCircle,
	Save,
	Send,
	Loader2,
	Upload,
	X,
} from 'lucide-react';
import SearchableSelect from '@/components/ui/SearchableSelect';

// ─── Types ───────────────────────────────────────────────────

interface QuestionOptionT {
	id: string;
	text: string;
	value: string;
	is_correct: boolean;
	sequence_order: number;
}

interface QuestionT {
	id: string;
	text: string;
	type: string;
	is_required: boolean;
	sequence_order: number;
	points: number;
	config: any;
	options: QuestionOptionT[];
}

interface SectionT {
	id: string;
	name: string;
	description: string | null;
	sequence_order: number;
	is_wizard_step: boolean;
	questions: QuestionT[];
}

interface AnswerT {
	question_id: string;
	answer_text: string | null;
	answer_json: any | null;
}

interface SurveyRendererProps {
	/** UUID of the survey response being filled */
	responseId: string;
	/** Sections with questions and options (from template) */
	sections: SectionT[];
	/** Existing answers (from response) */
	existingAnswers: AnswerT[];
	/** Survey status */
	status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
	/** Whether this is a quiz (shows points) */
	isQuiz?: boolean;
	/** Preview mode: interactive form but no save/submit actions */
	previewMode?: boolean;
	/** Callback after successful save */
	onSaved?: () => void;
	/** Callback after successful completion */
	onCompleted?: () => void;
}

// ─── Local storage key prefix for offline drafts ─────────────

const LS_PREFIX = 'survey_draft_';

// ─── Auto-save debounce interval (ms) ────────────────────────

const AUTO_SAVE_DELAY = 3000;

// ─── Component ───────────────────────────────────────────────

/**
 * SurveyRenderer — Dynamic accordion-based survey filling component.
 * Supports all 9 question types, auto-save, localStorage fallback,
 * and completion validation.
 */
export default function SurveyRenderer({
	responseId,
	sections,
	existingAnswers,
	status,
	isQuiz = false,
	previewMode = false,
	onSaved,
	onCompleted,
}: SurveyRendererProps) {
	// Answer state: Map<question_id, { answer_text, answer_json }>
	const [answers, setAnswers] = useState<Map<string, { answer_text: string | null; answer_json: any | null }>>(new Map());

	// Track which answers have been modified since last save
	const [dirtyQuestionIds, setDirtyQuestionIds] = useState<Set<string>>(new Set());

	// UI state
	const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
	const [saving, setSaving] = useState(false);
	const [completing, setCompleting] = useState(false);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const [errors, setErrors] = useState<string[]>([]);

	const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
	const isCompleted = status === 'COMPLETED';

	// ── Initialize answers from existing data or localStorage ──

	useEffect(() => {
		const ansMap = new Map<string, { answer_text: string | null; answer_json: any | null }>();

		// Load server answers first
		existingAnswers.forEach((a) => {
			ansMap.set(a.question_id, {
				answer_text: a.answer_text,
				answer_json: a.answer_json,
			});
		});

		// Overlay with any localStorage drafts
		try {
			const draft = localStorage.getItem(`${LS_PREFIX}${responseId}`);
			if (draft) {
				const parsed = JSON.parse(draft);
				Object.entries(parsed).forEach(([qId, val]: [string, any]) => {
					ansMap.set(qId, val);
				});
			}
		} catch { }


		// Auto-fill default_today DATE fields if not already answered
		const todayStr = new Date().toISOString().slice(0, 10);
		sections.forEach(sec => {
			sec.questions.forEach(q => {
				if (q.type === 'DATE' && q.config?.default_today && !ansMap.has(q.id)) {
					ansMap.set(q.id, { answer_text: todayStr, answer_json: null });
				}
			});
		});
		setAnswers(ansMap);

		// Expand all sections by default
		setExpandedSections(new Set(sections.map(s => s.id)));
	}, [existingAnswers, responseId, sections, previewMode]);

	// ── Save to localStorage on every change ──

	useEffect(() => {
		if (isCompleted || previewMode) return;
		try {
			const draft: Record<string, any> = {};
			answers.forEach((val, key) => { draft[key] = val; });
			localStorage.setItem(`${LS_PREFIX}${responseId}`, JSON.stringify(draft));
		} catch { }
	}, [answers, responseId, isCompleted, previewMode]);

	// ── Auto-save debounce ──

	useEffect(() => {
		if (isCompleted || previewMode || dirtyQuestionIds.size === 0) return;

		if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
		autoSaveTimer.current = setTimeout(() => {
			saveAnswers();
		}, AUTO_SAVE_DELAY);

		return () => {
			if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
		};
	}, [dirtyQuestionIds, isCompleted]);

	// ── Update an answer ──

	const setAnswer = useCallback((questionId: string, answerText: string | null, answerJson: any | null = null) => {
		if (isCompleted) return;
		setAnswers(prev => {
			const next = new Map(prev);
			next.set(questionId, { answer_text: answerText, answer_json: answerJson });
			return next;
		});
		setDirtyQuestionIds(prev => {
			const next = new Set(prev);
			next.add(questionId);
			return next;
		});
	}, [isCompleted]);

	// ── Save answers to API ──

	const saveAnswers = useCallback(async () => {
		if (dirtyQuestionIds.size === 0 || isCompleted) return;
		setSaving(true);
		setErrors([]);

		try {
			const token = localStorage.getItem('token');
			const dirtyAnswers = Array.from(dirtyQuestionIds).map(qId => ({
				question_id: qId,
				...answers.get(qId),
			}));

			const res = await fetch(`/api/v1/surveys/responses/${responseId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
				body: JSON.stringify({ answers: dirtyAnswers }),
			});

			const json = await res.json();
			if (json.status) {
				setDirtyQuestionIds(new Set());
				setLastSaved(new Date());
				// Clear localStorage draft on successful server save
				localStorage.removeItem(`${LS_PREFIX}${responseId}`);
				onSaved?.();
			} else {
				setErrors([json.message || 'Failed to save']);
			}
		} catch (error) {
			console.error('Save Error:', error);
			setErrors(['Network error — answers saved locally']);
		} finally {
			setSaving(false);
		}
	}, [answers, dirtyQuestionIds, responseId, isCompleted, onSaved]);

	// ── Complete survey ──

	const handleComplete = async () => {
		// First save any pending changes
		if (dirtyQuestionIds.size > 0) {
			await saveAnswers();
		}

		setCompleting(true);
		setErrors([]);

		try {
			const token = localStorage.getItem('token');
			const res = await fetch(`/api/v1/surveys/responses/${responseId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
				body: JSON.stringify({}),
			});

			const json = await res.json();
			if (json.status) {
				localStorage.removeItem(`${LS_PREFIX}${responseId}`);
				onCompleted?.();
			} else {
				// Show unanswered required questions
				const unansweredList = json.data?.unanswered?.map((q: any) => q.text) || [];
				setErrors([
					json.message || 'Completion failed',
					...unansweredList.map((t: string) => `• ${t}`),
				]);
			}
		} catch (error) {
			console.error('Complete Error:', error);
			setErrors(['Network error — could not submit']);
		} finally {
			setCompleting(false);
		}
	};

	// ── Section toggle ──

	const toggleSection = (id: string) => {
		setExpandedSections(prev => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	// ── Count answered questions per section ──

	const sectionProgress = (section: SectionT) => {
		const total = section.questions.length;
		const answered = section.questions.filter(q => {
			const a = answers.get(q.id);
			return a && (a.answer_text || a.answer_json);
		}).length;
		return { total, answered };
	};

	// ─── Render ──────────────────────────────────────────────

	return (
		<div className="space-y-4">
			{/* Save status bar (hidden in preview) */}
			{!previewMode && (
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
						{saving && <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>}
						{!saving && lastSaved && (
							<><CheckCircle className="w-4 h-4 text-green-500" /> Saved {lastSaved.toLocaleTimeString()}</>
						)}
						{!saving && dirtyQuestionIds.size > 0 && (
							<span className="text-amber-500">{dirtyQuestionIds.size} unsaved change(s)</span>
						)}
					</div>

					{!isCompleted && (
						<div className="flex gap-2">
							<button
								onClick={saveAnswers}
								disabled={saving || dirtyQuestionIds.size === 0}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
							>
								<Save className="w-3.5 h-3.5" />
								Save Draft
							</button>
							<button
								onClick={handleComplete}
								disabled={completing}
								className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors"
							>
								{completing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
								Submit
							</button>
						</div>
					)}
				</div>
			)}

			{/* Errors */}
			{errors.length > 0 && (
				<div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-3">
					{errors.map((e, i) => (
						<p key={i} className="text-sm text-red-700 dark:text-red-400">{e}</p>
					))}
				</div>
			)}

			{/* Sections */}
			{sections.map((section) => {
				const isExpanded = expandedSections.has(section.id);
				const { total, answered } = sectionProgress(section);
				const allDone = answered === total && total > 0;

				return (
					<div key={section.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
						{/* Section header */}
						<button
							type="button"
							onClick={() => toggleSection(section.id)}
							className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
						>
							{allDone
								? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
								: answered > 0
									? <Circle className="w-5 h-5 text-blue-400 flex-shrink-0" />
									: <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
							}
							<div className="flex-1 min-w-0">
								<span className="font-medium text-slate-900 dark:text-white">{section.name}</span>
								{section.description && (
									<span className="text-sm text-slate-500 dark:text-slate-400 block">{section.description}</span>
								)}
							</div>
							<span className="text-xs text-slate-400 font-mono mr-2">{answered}/{total}</span>
							{isExpanded
								? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
								: <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
							}
						</button>

						{/* Questions */}
						{isExpanded && (
							<div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
								{(() => {
									/** Group consecutive questions by config.group */
									const grouped: Array<{ groupName: string | null; questions: Array<{ q: typeof section.questions[0]; idx: number }> }> = [];
									let currentGroup: string | null = null;
									section.questions.forEach((q, qIdx) => {
										const grp = q.config?.group || null;
										if (grp !== currentGroup || grp === null) {
											grouped.push({ groupName: grp, questions: [] });
											currentGroup = grp;
										}
										grouped[grouped.length - 1].questions.push({ q, idx: qIdx });
									});
									return grouped.map((g, gIdx) => {
										const questionElements = g.questions.map(({ q, idx }) => (
											<QuestionRenderer
												key={q.id}
												question={q}
												index={idx + 1}
												answer={answers.get(q.id) || null}
												onAnswer={(text, json) => setAnswer(q.id, text, json)}
												disabled={isCompleted}
												isQuiz={isQuiz}
											/>
										));
										if (g.groupName) {
											return (
												<div key={`grp-${gIdx}`} className="border-t border-slate-100 dark:border-slate-800">
													<div className="px-5 py-2.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700/50">
														<h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{g.groupName}</h4>
													</div>
													<div className="divide-y divide-slate-100 dark:divide-slate-800">
														{questionElements}
													</div>
												</div>
											);
										}
										return <>{questionElements}</>;
									});
								})()}
								{section.questions.length === 0 && (
									<div className="px-5 py-8 text-center text-sm text-slate-400">No questions in this section</div>
								)}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}


// ─── Data Select Input (for DATA_SELECT questions) ───────────

interface DataSelectInputProps {
	question: QuestionT;
	value: string;
	onChange: (val: string) => void;
	disabled: boolean;
}

/**
 * DataSelectInput — Renders a SearchableSelect that fetches options
 * from the /api/v1/entities endpoint based on question config.
 * Handles prefill_mode and scope_filter.
 */
function DataSelectInput({ question, value, onChange, disabled }: DataSelectInputProps) {
	const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
	const [loading, setLoading] = useState(false);
	const cfg = question.config || {};
	const entityType = cfg.entity_type;
	const prefillMode = cfg.prefill_mode;
	const isReadOnly = prefillMode === 'READONLY';

	useEffect(() => {
		if (!entityType) return;
		const fetchEntities = async () => {
			setLoading(true);
			try {
				const params = new URLSearchParams({ type: entityType });
				// scope_filter could pass company_id / site_id from URL or context
				// These would be provided via query params on the survey fill page
				if (cfg.scope_filter) {
					const urlParams = new URLSearchParams(window.location.search);
					const companyId = urlParams.get('company_id');
					const siteId = urlParams.get('site_id');
					if (companyId) params.set('company_id', companyId);
					if (siteId) params.set('site_id', siteId);
				}
				const res = await fetch(`/api/v1/entities?${params.toString()}`);
				const json = await res.json();
				if (json.status && json.data) {
					setOptions(json.data.map((d: any) => ({ value: d.id, label: d.label })));
				}
			} catch (err) {
				console.error('[DataSelectInput] Fetch error:', err);
			} finally {
				setLoading(false);
			}
		};
		fetchEntities();
	}, [entityType, cfg.scope_filter]);

	if (!entityType) {
		return <span className="text-xs text-slate-400 italic">No entity type configured</span>;
	}

	if (loading) {
		return (
			<div className="flex items-center gap-2 text-sm text-slate-400">
				<Loader2 className="w-4 h-4 animate-spin" />
				Loading {entityType.toLowerCase()}s...
			</div>
		);
	}

	return (
		<div className="w-full max-w-md">
			<SearchableSelect
				value={value}
				onChange={(val) => onChange(val)}
				options={options}
				placeholder={`Select ${entityType.toLowerCase()}...`}
				disabled={disabled || isReadOnly}
			/>
			{isReadOnly && value && (
				<span className="text-[10px] text-amber-500 mt-1 block">🔒 Read-only (pre-filled)</span>
			)}
			{prefillMode === 'EDITABLE' && value && (
				<span className="text-[10px] text-blue-400 mt-1 block">✏️ Pre-filled — you may change this</span>
			)}
		</div>
	);
}

// ─── Question Renderer ───────────────────────────────────────

interface QuestionRendererProps {
	question: QuestionT;
	index: number;
	answer: { answer_text: string | null; answer_json: any | null } | null;
	onAnswer: (text: string | null, json?: any | null) => void;
	disabled: boolean;
	isQuiz: boolean;
}

function QuestionRenderer({ question, index, answer, onAnswer, disabled, isQuiz }: QuestionRendererProps) {
	const ansText = answer?.answer_text || '';
	const ansJson = answer?.answer_json;
	const isAnswered = Boolean(ansText || ansJson);

	return (
		<div className="px-5 py-4">
			{/* Question text */}
			<div className="flex items-start gap-2 mb-3">
				<span className="text-xs font-mono text-slate-400 mt-0.5 w-6 text-right flex-shrink-0">{index}.</span>
				<div className="flex-1">
					<p className="text-sm font-medium text-slate-800 dark:text-slate-200">
						{question.text}
						{question.is_required && <span className="text-red-500 ml-0.5">*</span>}
					</p>
					{isQuiz && question.points > 0 && (
						<span className="text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 px-1.5 py-0.5 rounded mt-1 inline-block">
							{question.points} points
						</span>
					)}
				</div>
				{isAnswered && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />}
			</div>

			{/* Input renderer by type */}
			<div className="ml-8">
				{question.type === 'TEXT' && (
					<textarea
						value={ansText}
						onChange={(e) => onAnswer(e.target.value)}
						disabled={disabled}
						rows={2}
						placeholder="Enter your answer..."
						className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
					/>
				)}

				{(question.type === 'NUMBER' || question.type === 'DECIMAL') && (
					<input
						type="number"
						step={question.type === 'DECIMAL' ? '0.01' : '1'}
						value={ansText}
						onChange={(e) => onAnswer(e.target.value)}
						disabled={disabled}
						placeholder={question.type === 'DECIMAL' ? '0.00' : '0'}
						className="w-full max-w-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
					/>
				)}

				{question.type === 'DATE' && (
					<input
						type="date"
						value={ansText}
						onChange={(e) => onAnswer(e.target.value)}
						disabled={disabled}
						className="w-full max-w-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
					/>
				)}

				{question.type === 'YES_NO' && (
					<div className="flex gap-3">
						{(question.options?.length > 0 ? question.options : [{ text: 'Yes', value: 'YES' }, { text: 'No', value: 'NO' }]).map((opt) => (
							<button
								key={opt.value}
								type="button"
								onClick={() => !disabled && onAnswer(opt.value)}
								disabled={disabled}
								className={`px-5 py-2 rounded-lg text-sm font-medium border transition-all ${ansText === opt.value
									? opt.value === 'YES' || opt.text === 'Yes'
										? 'bg-green-50 border-green-400 text-green-700 dark:bg-green-500/10 dark:border-green-600 dark:text-green-400'
										: 'bg-red-50 border-red-400 text-red-700 dark:bg-red-500/10 dark:border-red-600 dark:text-red-400'
									: 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
									} disabled:opacity-60 disabled:cursor-not-allowed`}
							>
								{opt.text}
							</button>
						))}
					</div>
				)}

				{question.type === 'SELECT' && (
					<SearchableSelect
						value={ansText}
						onChange={(val) => onAnswer(val)}
						disabled={disabled}
						placeholder="Select an option..."
						options={question.options.map((opt) => ({ value: opt.value, label: opt.text }))}
						className="max-w-md"
					/>
				)}

				{question.type === 'MULTI_SELECT' && (
					<div className="space-y-2">
						{question.options.map((opt) => {
							const selectedValues: string[] = ansJson || [];
							const isChecked = selectedValues.includes(opt.value);

							return (
								<label key={opt.id} className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={isChecked}
										onChange={() => {
											if (disabled) return;
											const next = isChecked
												? selectedValues.filter(v => v !== opt.value)
												: [...selectedValues, opt.value];
											onAnswer(null, next);
										}}
										disabled={disabled}
										className="rounded border-slate-300 dark:border-slate-600 disabled:opacity-60"
									/>
									<span className="text-sm text-slate-700 dark:text-slate-300">{opt.text}</span>
								</label>
							);
						})}
					</div>
				)}

				{question.type === 'FILE_UPLOAD' && (() => {
					const config = question.config || {};
					const fields: { label: string; types: string[] }[] = config.fields || [];
					const maxFiles: number | null = config.max_files ?? null;
					const uploads: Record<string, string> = ansJson || {};

					if (fields.length > 0) {
						return (
							<div className="space-y-3">
								{maxFiles && (
									<p className="text-[10px] text-slate-400 uppercase tracking-wider">Max {maxFiles} file(s)</p>
								)}
								{fields.map((field, fIdx) => {
									const fieldKey = `field_${fIdx}`;
									const uploaded = uploads[fieldKey];
									const acceptTypes = field.types?.length > 0 ? field.types.join(', ') : 'any';
									return (
										<div key={fIdx} className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4">
											<div className="flex items-center justify-between mb-2">
												<label className="text-sm font-medium text-slate-700 dark:text-slate-300">
													{field.label || `File ${fIdx + 1}`}
													{(field as any).is_required && <span className="text-red-500 ml-0.5">*</span>}
												</label>
												<span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
													{acceptTypes}
												</span>
											</div>
											{uploaded ? (
												<div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
													<CheckCircle className="w-4 h-4 text-green-500" />
													<span className="truncate">{uploaded}</span>
													{!disabled && (
														<button
															onClick={() => {
																const next = { ...uploads };
																delete next[fieldKey];
																onAnswer(null, Object.keys(next).length > 0 ? next : null);
															}}
															className="text-red-400 hover:text-red-500 ml-auto flex-shrink-0"
														>
															<X className="w-4 h-4" />
														</button>
													)}
												</div>
											) : (
												<div className="text-center text-slate-400 py-2">
													<Upload className="w-6 h-6 mx-auto mb-1" />
													<p className="text-xs">Click or drag to upload</p>
												</div>
											)}
										</div>
									);
								})}
							</div>
						);
					}

					return (
						<div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
							{maxFiles && (
								<p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Max {maxFiles} file(s)</p>
							)}
							{ansText ? (
								<div className="flex items-center justify-center gap-2 text-sm text-slate-700 dark:text-slate-300">
									<CheckCircle className="w-4 h-4 text-green-500" />
									<span>File uploaded: {ansText}</span>
									{!disabled && (
										<button onClick={() => onAnswer(null)} className="text-red-400 hover:text-red-500">
											<X className="w-4 h-4" />
										</button>
									)}
								</div>
							) : (
								<div className="text-slate-400">
									<Upload className="w-8 h-8 mx-auto mb-2" />
									<p className="text-sm">Click or drag to upload</p>
								</div>
							)}
						</div>
					);
				})()}

				{question.type === 'USER_SELECT' && (
					<input
						type="text"
						value={ansText}
						onChange={(e) => onAnswer(e.target.value)}
						disabled={disabled}
						placeholder="Enter user ID or search..."
						className="w-full max-w-md px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
					/>
				)}

				{question.type === 'DATA_SELECT' && (
					<DataSelectInput
						question={question}
						value={ansText}
						onChange={(val) => onAnswer(val)}
						disabled={disabled}
					/>
				)}
			</div>
		</div>
	);
}
