'use client';

import { useEffect, useState, useCallback, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react';
import { useHeader } from '@/components/HeaderContext';
import { useRouter, useParams } from 'next/navigation';
import {
	ChevronDown,
	ChevronRight,
	Plus,
	Pencil,
	Trash2,
	LayoutList,
	Save,
	ArrowLeft,
	ClipboardList,
	Brain,
	AlertTriangle,
	Check,
	X,
	Type,
	Hash,
	ToggleLeft,
	List,
	Calendar,
	Upload,
	Users,
	Eye,
	Database
} from 'lucide-react';
import SearchableSelect from '@/components/ui/SearchableSelect';

// ─── Types ───────────────────────────────────────────────────

/** Question type labels and icons */
const QUESTION_TYPES = [
	{ value: 'TEXT', label: 'Text', icon: Type },
	{ value: 'NUMBER', label: 'Number', icon: Hash },
	{ value: 'DECIMAL', label: 'Decimal', icon: Hash },
	{ value: 'YES_NO', label: 'Yes / No', icon: ToggleLeft },
	{ value: 'SELECT', label: 'Dropdown', icon: List },
	{ value: 'MULTI_SELECT', label: 'Multi Select', icon: List },
	{ value: 'DATE', label: 'Date', icon: Calendar },
	{ value: 'FILE_UPLOAD', label: 'File Upload', icon: Upload },
	{ value: 'USER_SELECT', label: 'User Select', icon: Users },
	{ value: 'DATA_SELECT', label: 'Data Select', icon: Database },
] as const;

/** USER_SELECT: which roles can be selected */
const USER_SELECT_ROLES = [
	{ key: 'admins', label: 'Admins' },
	{ key: 'supervisors', label: 'Company Supervisors' },
	{ key: 'workers', label: 'Company Workers' },
] as const;

/** DATA_SELECT: available entity types */
const DATA_SELECT_ENTITIES = [
	{ key: 'COMPANY', label: 'Company' },
	{ key: 'SITE', label: 'Site' },
	{ key: 'COURSE', label: 'Course' },
	{ key: 'JOB', label: 'Job' },
	{ key: 'USER', label: 'User' },
] as const;

/** DATA_SELECT: prefill mode options */
const DATA_SELECT_PREFILL_MODES = [
	{ key: '', label: 'No Prefill' },
	{ key: 'EDITABLE', label: 'Editable' },
	{ key: 'READONLY', label: 'Read-only' },
] as const;

/** FILE_UPLOAD: allowed file type categories */
const FILE_UPLOAD_TYPES = [
	{ key: 'pdf', label: 'PDF' },
	{ key: 'image', label: 'Image' },
	{ key: 'video', label: 'Video' },
	{ key: 'document', label: 'Document' },
	// { key: 'spreadsheet', label: 'Spreadsheet' },
	{ key: 'any', label: 'Any File' },
] as const;

interface QuestionOption {
	id?: string;
	text: string;
	value: string;
	is_correct: boolean;
	sequence_order: number;
}

interface Question {
	id: string;
	text: string;
	type: string;
	is_required: boolean;
	sequence_order: number;
	points: number;
	config: any;
	options: QuestionOption[];
}

interface Section {
	id: string;
	name: string;
	description: string | null;
	sequence_order: number;
	is_wizard_step: boolean;
	questions: Question[];
}

interface Template {
	id: string;
	name: string;
	description: string | null;
	type: 'SURVEY' | 'QUIZ';
	status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
	industry_id: string | null;
	sections: Section[];
}

// ─── Helpers ─────────────────────────────────────────────────

/** Fetch helper with auth */
async function apiFetch(url: string, opts: RequestInit = {}) {
	const token = localStorage.getItem('token');
	const headers: any = { 'Authorization': `Bearer ${token}`, ...opts.headers };
	if (opts.body && typeof opts.body === 'string') {
		headers['Content-Type'] = 'application/json';
	}
	const res = await fetch(url, { ...opts, headers });
	return res.json();
}

/** Slugify a section name for URL hash */
function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

// ─── Page Component ──────────────────────────────────────────

export default function SurveyBuilderPage() {
	const { setTitle, setActions } = useHeader();
	const router = useRouter();
	const params = useParams();
	const templateId = params.id as string;

	const [template, setTemplate] = useState<Template | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	// Expanded sections state
	const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

	// Editing states
	const [editingTemplateMeta, setEditingTemplateMeta] = useState(false);
	const [editingMode, setEditingMode] = useState(false);
	const [editName, setEditName] = useState('');
	const [editDesc, setEditDesc] = useState('');
	const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE' | 'DRAFT'>('DRAFT');

	// Per-section edit mode: tracks which sections are being edited
	const [editingSections, setEditingSections] = useState<Set<string>>(new Set());
	// Edited section names: sectionId -> new name
	const [editedSectionNames, setEditedSectionNames] = useState<Record<string, string>>({});
	// Edited question fields: questionId -> edited fields
	const [editedQuestions, setEditedQuestions] = useState<Record<string, Partial<Question>>>({});

	// New section form
	const [addingSectionIdx, setAddingSectionIdx] = useState<number | null>(null);
	const [newSectionName, setNewSectionName] = useState('');
	const [newSectionWizard, setNewSectionWizard] = useState(false);

	// New question form
	const [addingQuestionSection, setAddingQuestionSection] = useState<string | null>(null);
	const [newQText, setNewQText] = useState('');
	const [newQType, setNewQType] = useState('TEXT');
	const [newQRequired, setNewQRequired] = useState(false);
	const [newQPoints, setNewQPoints] = useState(0);
	const [newQOptions, setNewQOptions] = useState<{ text: string; value: string; is_correct: boolean }[]>([]);
	const [newQConfig, setNewQConfig] = useState<Record<string, any>>({});

	// ─── Data fetching ───────────────────────────────────────

	const fetchTemplate = useCallback(async () => {
		try {
			setLoading(true);
			const json = await apiFetch(`/api/v1/surveys/${templateId}`);
			if (json.status && json.data) {
				setTemplate(json.data);
				// Expand sections based on URL hash
				const sections: Section[] = json.data.sections || [];
				const hash = window.location.hash.replace('#', '');
				if (hash === 'all') {
					setExpandedSections(new Set(sections.map(s => s.id)));
				} else if (hash) {
					const matched = sections.find(s => slugify(s.name) === hash);
					setExpandedSections(matched ? new Set([matched.id]) : new Set());
				} else {
					setExpandedSections(new Set());
				}
			}
		} catch (error) {
			console.error('Failed to fetch template:', error);
		} finally {
			setLoading(false);
		}
	}, [templateId]);

	useEffect(() => { fetchTemplate(); }, [fetchTemplate]);

	// Listen for hash changes (browser back/forward)
	useEffect(() => {
		const handleHashChange = () => {
			if (!template) return;
			const hash = window.location.hash.replace('#', '');
			const sections = template.sections || [];
			if (hash === 'all') {
				setExpandedSections(new Set(sections.map(s => s.id)));
			} else if (hash) {
				const matched = sections.find(s => slugify(s.name) === hash);
				setExpandedSections(matched ? new Set([matched.id]) : new Set());
			} else {
				setExpandedSections(new Set());
			}
		};
		window.addEventListener('hashchange', handleHashChange);
		return () => window.removeEventListener('hashchange', handleHashChange);
	}, [template]);

	// Set header
	useEffect(() => {
		setTitle(template ? `Edit: ${template.name}` : 'Survey Builder');
		setActions(
			<button
				onClick={() => router.push('/admin/surveys')}
				className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
			>
				<ArrowLeft className="w-4 h-4" />
				Back to List
			</button>
		);
		return () => setActions(null);
	}, [setTitle, setActions, template, router]);

	// ─── Template metadata edit ──────────────────────────────

	const startEditMeta = () => {
		if (!template) return;
		setEditName(template.name);
		setEditDesc(template.description || '');
		setEditStatus(template.status);
		setEditingTemplateMeta(true);
	};

	const saveTemplateMeta = async () => {
		if (!editName.trim()) return;
		setSaving(true);
		try {
			await apiFetch(`/api/v1/surveys/${templateId}`, {
				method: 'PATCH',
				body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null, status: editStatus }),
			});
			await fetchTemplate();
			setEditingTemplateMeta(false);
		} finally {
			setSaving(false);
		}
	};

	// ─── Sections ────────────────────────────────────────────

	const toggleSection = (id: string) => {
		setExpandedSections(prev => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			// Defer URL hash update to avoid setState-during-render warning
			const sections = template?.sections || [];
			const nextSize = next.size;
			const nextArr = Array.from(next);
			queueMicrotask(() => {
				if (nextSize === 0) {
					history.replaceState(null, '', window.location.pathname + window.location.search);
				} else if (nextSize === sections.length) {
					history.replaceState(null, '', '#all');
				} else if (nextSize === 1) {
					const openId = nextArr[0];
					const sec = sections.find(s => s.id === openId);
					if (sec) history.replaceState(null, '', `#${slugify(sec.name)}`);
				} else {
					const sec = sections.find(s => s.id === id);
					if (sec && nextArr.includes(id)) history.replaceState(null, '', `#${slugify(sec.name)}`);
				}
			});
			return next;
		});
	};

	const addSection = async () => {
		if (!newSectionName.trim()) return;
		setSaving(true);
		try {
			await apiFetch(`/api/v1/surveys/${templateId}/sections`, {
				method: 'POST',
				body: JSON.stringify({
					name: newSectionName.trim(),
					is_wizard_step: newSectionWizard,
				}),
			});
			setNewSectionName('');
			setNewSectionWizard(false);
			setAddingSectionIdx(null);
			await fetchTemplate();
		} finally {
			setSaving(false);
		}
	};

	const deleteSection = async (sectionId: string) => {
		if (!confirm('Delete this section and all its questions?')) return;
		// Optimistic: remove from local state immediately
		setTemplate(prev => {
			if (!prev) return prev;
			return { ...prev, sections: prev.sections.filter(s => s.id !== sectionId) };
		});
		try {
			await apiFetch(`/api/v1/surveys/sections/${sectionId}`, { method: 'DELETE' });
		} catch {
			await fetchTemplate(); // rollback on error
		}
	};

	// ─── Questions ───────────────────────────────────────────

	const needsOptions = (type: string) => ['SELECT', 'MULTI_SELECT', 'YES_NO'].includes(type);

	const addQuestion = async (sectionId: string) => {
		if (!newQText.trim()) return;
		setSaving(true);
		try {
			const payload: any = {
				text: newQText.trim(),
				type: newQType,
				is_required: newQRequired,
				points: newQPoints,
			};
			if (needsOptions(newQType) && newQOptions.length > 0) {
				payload.options = newQOptions;
			}
			if ((newQType === 'USER_SELECT' || newQType === 'FILE_UPLOAD') && Object.keys(newQConfig).length > 0) {
				payload.config = newQConfig;
			}
			await apiFetch(`/api/v1/surveys/sections/${sectionId}`, {
				method: 'POST',
				body: JSON.stringify(payload),
			});
			resetQuestionForm();
			await fetchTemplate();
		} finally {
			setSaving(false);
		}
	};

	/** Delete a question (optimistic local update) */
	const deleteQuestion = async (questionId: string) => {
		if (!confirm('Delete this question?')) return;
		// Optimistic: remove from local state immediately
		setTemplate(prev => {
			if (!prev) return prev;
			return {
				...prev,
				sections: prev.sections.map(s => ({
					...s,
					questions: s.questions.filter(q => q.id !== questionId)
				}))
			};
		});
		try {
			await apiFetch(`/api/v1/surveys/questions/${questionId}`, { method: 'DELETE' });
		} catch {
			await fetchTemplate(); // rollback on error
		}
	};

	// ─── Section-level edit ──────────────────────────────────

	/** Enter edit mode for a section (populate local edit state) */
	const startEditSection = (section: Section) => {
		setEditingSections(prev => new Set(prev).add(section.id));
		setEditedSectionNames(prev => ({ ...prev, [section.id]: section.name }));
		// Expand only this section, collapse others
		setExpandedSections(new Set([section.id]));
		history.replaceState(null, '', `#${slugify(section.name)}`);
		// Populate all question edits for this section
		const qEdits: Record<string, Partial<Question>> = {};
		section.questions?.forEach(q => {
			qEdits[q.id] = {
				text: q.text,
				type: q.type,
				is_required: q.is_required,
				points: q.points,
				options: q.options ? q.options.map(o => ({ ...o })) : [],
				config: q.config ? { ...q.config } : {},
			};
		});
		setEditedQuestions(prev => ({ ...prev, ...qEdits }));
	};

	/** Cancel section edit */
	const cancelEditSection = (sectionId: string, section: Section) => {
		setEditingSections(prev => { const n = new Set(prev); n.delete(sectionId); return n; });
		setEditedSectionNames(prev => { const n = { ...prev }; delete n[sectionId]; return n; });
		// Remove question edits for this section
		setEditedQuestions(prev => {
			const n = { ...prev };
			section.questions?.forEach(q => delete n[q.id]);
			return n;
		});
	};

	/** Save all edits for a section (title + questions) without full refresh */
	const saveEditSection = async (sectionId: string, section: Section) => {
		setSaving(true);
		try {
			const promises: Promise<any>[] = [];

			// Save section name if changed
			const newName = editedSectionNames[sectionId];
			if (newName && newName !== section.name) {
				promises.push(apiFetch(`/api/v1/surveys/sections/${sectionId}`, {
					method: 'PATCH',
					body: JSON.stringify({ name: newName.trim() }),
				}));
			}

			// Save all question edits in parallel
			section.questions?.forEach(q => {
				const edits = editedQuestions[q.id];
				if (edits) {
					// Build payload with only changed fields
					const payload: any = {};
					if (edits.text !== q.text) payload.text = edits.text;
					if (edits.type !== q.type) payload.type = edits.type;
					if (edits.is_required !== q.is_required) payload.is_required = edits.is_required;
					if (edits.points !== q.points) payload.points = edits.points;
					// Always send options if this type needs them
					if (edits.options !== undefined) {
						const optionsStr = JSON.stringify(edits.options?.map(o => ({ text: o.text, value: o.value, is_correct: o.is_correct })) || []);
						const origStr = JSON.stringify(q.options?.map(o => ({ text: o.text, value: o.value, is_correct: o.is_correct })) || []);
						if (optionsStr !== origStr) payload.options = edits.options;
					}
					// Always send config if it exists
					if (edits.config !== undefined && JSON.stringify(edits.config) !== JSON.stringify(q.config || {})) {
						payload.config = edits.config;
					}
					if (Object.keys(payload).length > 0) {
						promises.push(apiFetch(`/api/v1/surveys/questions/${q.id}`, {
							method: 'PATCH',
							body: JSON.stringify(payload),
						}));
					}
				}
			});

			await Promise.all(promises);

			// Optimistic local state update
			setTemplate(prev => {
				if (!prev) return prev;
				return {
					...prev,
					sections: prev.sections.map(s => {
						if (s.id !== sectionId) return s;
						return {
							...s,
							name: newName?.trim() || s.name,
							questions: s.questions.map(q => {
								const edits = editedQuestions[q.id];
								if (!edits) return q;
								return { ...q, ...edits } as Question;
							})
						};
					})
				};
			});

			// Clear edit state for this section
			cancelEditSection(sectionId, section);
		} finally {
			setSaving(false);
		}
	};

	/** Update an edited question field */
	const updateEditedQuestion = (qId: string, field: string, value: any) => {
		setEditedQuestions(prev => ({ ...prev, [qId]: { ...prev[qId], [field]: value } }));
	};

	const resetQuestionForm = () => {
		setAddingQuestionSection(null);
		setNewQText('');
		setNewQType('TEXT');
		setNewQRequired(false);
		setNewQPoints(0);
		setNewQOptions([]);
		setNewQConfig({});
	};

	const addOptionRow = () => {
		setNewQOptions(prev => [...prev, { text: '', value: '', is_correct: false }]);
	};

	const updateOption = (idx: number, field: string, val: any) => {
		setNewQOptions(prev => prev.map((o, i) => i === idx ? { ...o, [field]: val, value: field === 'text' ? val : o.value || val } : o));
	};

	const removeOption = (idx: number) => {
		setNewQOptions(prev => prev.filter((_, i) => i !== idx));
	};

	// ─── Loading / Error ─────────────────────────────────────

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full min-h-[400px]">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
			</div>
		);
	}

	if (!template) {
		return (
			<div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-500 dark:text-slate-400">
				<AlertTriangle className="w-12 h-12 mb-3" />
				<p>Template not found</p>
			</div>
		);
	}

	const isQuiz = template.type === 'QUIZ';

	// ─── Render ──────────────────────────────────────────────


	/**
	 * Groups consecutive questions by config.group for card-like
	 * sub-sections in the builder question list.
	 */
	const renderGroupedQuestions = (sectionData: any) => {
		const groups: Array<{ groupName: string | null; items: Array<{ q: any; qIdx: number }> }> = [];
		let currentGroupName: string | null = null;
		sectionData.questions.forEach((q: any, qIdx: number) => {
			const grp = q.config?.group || null;
			if (grp !== currentGroupName || grp === null) {
				groups.push({ groupName: grp, items: [] });
				currentGroupName = grp;
			}
			groups[groups.length - 1].items.push({ q, qIdx });
		});
		return groups;
	};

	return (
		<div className="space-y-6 max-w-4xl mx-auto pb-12">

			{/* ── Template Header Card ── */}
			<div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
				{editingTemplateMeta ? (
					<div className="space-y-4">
						<input
							type="text"
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
							className="w-full px-3 py-2 text-lg font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
							placeholder="Template name"
						/>
						<textarea
							value={editDesc}
							onChange={(e) => setEditDesc(e.target.value)}
							className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
							placeholder="Description (optional)"
							rows={2}
						/>
						<div className="flex items-center gap-4">
							<select
								value={editStatus}
								onChange={(e) => setEditStatus(e.target.value as any)}
								className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
							>
								<option value="DRAFT">Draft</option>
								<option value="ACTIVE">Active</option>
								<option value="INACTIVE">Inactive</option>
							</select>
							<div className="flex gap-2 ml-auto">
								<button onClick={() => setEditingTemplateMeta(false)} className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white">
									<X className="w-4 h-4" />
								</button>
								<button onClick={saveTemplateMeta} disabled={saving} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg">
									<Save className="w-3.5 h-3.5" />
									Save
								</button>
							</div>
						</div>
					</div>
				) : (
					<div className="flex items-start justify-between">
						<div className="flex items-start gap-4">
							<div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isQuiz
								? 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'
								: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
								}`}>
								{isQuiz ? <Brain className="w-6 h-6" /> : <ClipboardList className="w-6 h-6" />}
							</div>
							<div>
								<h2
									className={`text-xl font-semibold text-slate-900 dark:text-white ${editingMode ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors' : ''}`}
									onClick={() => editingMode && startEditMeta()}
								>
									{template.name}
								</h2>
								{template.description && (
									<p
										className={`text-sm text-slate-500 dark:text-slate-400 mt-0.5 ${editingMode ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors' : ''}`}
										onClick={() => editingMode && startEditMeta()}
									>{template.description}</p>
								)}
								<div className="flex items-center gap-3 mt-2">
									<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${template.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
										: template.status === 'DRAFT' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
											: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
										}`}>
										{template.status}
									</span>
									<span className="text-xs text-slate-500 dark:text-slate-400">
										{template.sections?.length || 0} sections · {
											template.sections?.reduce((a, s) => a + (s.questions?.length || 0), 0) || 0
										} questions
									</span>
								</div>
							</div>
						</div>
						<div className="flex items-center gap-2">
							{template.status !== 'ACTIVE' && (
								<button
									onClick={async () => {
										if (!confirm('Are you sure you want to publish this form? It will become available for assignment.')) return;
										setSaving(true);
										try {
											await apiFetch(`/api/v1/surveys/${templateId}`, {
												method: 'PATCH',
												body: JSON.stringify({ status: 'ACTIVE' }),
											});
											await fetchTemplate();
										} finally {
											setSaving(false);
										}
									}}
									disabled={saving}
									className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm border border-green-700"
									title="Publish Form"
								>
									<Check className="w-4 h-4" /> Publish
								</button>
							)}
							<button
								onClick={() => {
									const next = !editingMode;
									setEditingMode(next);
									if (next) {
										startEditMeta();
									} else {
										setEditingTemplateMeta(false);
										// Also cancel any section edits
										setEditingSections(new Set());
										setEditedSectionNames({});
										setEditedQuestions({});
									}
								}}
								className={`p-2 rounded-lg transition-colors ${editingMode
									? 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-500/10'
									: 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
									}`}
								title={editingMode ? 'Exit edit mode' : 'Enter edit mode'}
							>
								<Pencil className="w-4 h-4" />
							</button>
							<button
								onClick={() => window.open(`/admin/surveys/${templateId}/preview`, '_blank')}
								className="p-2 rounded-lg transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
								title="Preview survey"
							>
								<Eye className="w-4 h-4" />
							</button>
						</div>
					</div>
				)}
			</div>

			{/* ── Sections List ── */}
			<div className="space-y-3">
				{template.sections?.map((section, sIdx) => {
					const isExpanded = expandedSections.has(section.id);
					const isSectionEditing = editingSections.has(section.id);
					return (
						<div key={section.id} id={slugify(section.name)} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">

							{/* Section header */}
							<div
								className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
								onClick={() => toggleSection(section.id)}
							>
								<LayoutList className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
								{isExpanded
									? <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
									: <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
								}
								<div className="flex-1 min-w-0">
									{isSectionEditing ? (
										<input
											type="text"
											value={editedSectionNames[section.id] || ''}
											onChange={(e) => setEditedSectionNames(prev => ({ ...prev, [section.id]: e.target.value }))}
											onClick={(e) => e.stopPropagation()}
											className="w-full px-2 py-1 rounded border border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
										/>
									) : (
										<>
											<span className="font-medium text-slate-900 dark:text-white">{section.name}</span>
											<span className="ml-2 text-xs text-slate-400">
												({section.questions?.length || 0} question{(section.questions?.length || 0) !== 1 ? 's' : ''})
											</span>
										</>
									)}
									{section.is_wizard_step && (
										<span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded">
											WIZARD STEP
										</span>
									)}
								</div>
								{editingMode && !isSectionEditing && (
									<button
										onClick={(e) => { e.stopPropagation(); startEditSection(section); }}
										disabled={editingSections.size > 0}
										className={`p-1.5 rounded transition-colors ${editingSections.size > 0
											? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
											: 'text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
											}`}
										title={editingSections.size > 0 ? 'Save or cancel current edit first' : 'Edit section'}
									>
										<Pencil className="w-4 h-4" />
									</button>
								)}
								{isSectionEditing && (
									<div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
										<button
											onClick={() => cancelEditSection(section.id, section)}
											className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-white rounded"
										>
											Cancel
										</button>
										<button
											onClick={() => saveEditSection(section.id, section)}
											disabled={saving}
											className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded"
										>
											<Save className="w-3 h-3" />
											Save All
										</button>
									</div>
								)}
								{editingMode && (
									<button
										onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
										className="p-1.5 text-red-400 hover:text-red-600 dark:text-red-400/60 dark:hover:text-red-400 rounded transition-colors"
										title="Delete section"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								)}
							</div>

							{/* Questions list (collapsible) */}
							{isExpanded && (
								<div className="border-t border-slate-100 dark:border-slate-800">
									{section.questions?.length > 0 ? (
										<div>
											{renderGroupedQuestions(section).map((g, gIdx) => (
												<div key={`grp-${gIdx}`} className={g.groupName ? "mt-3 mx-4 mb-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 overflow-hidden" : ""}>
													{g.groupName && (
														<div className="px-4 py-2.5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700/60 dark:to-slate-800/40 border-b border-slate-200 dark:border-slate-700">
															<h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">{g.groupName}</h4>
														</div>
													)}
													<div className="divide-y divide-slate-100 dark:divide-slate-800">
														{g.items.map(({ q, qIdx }) => {
															const QIcon = QUESTION_TYPES.find(t => t.value === q.type)?.icon || Type;
															const qEdits = editedQuestions[q.id];
															return (
																<div key={q.id} className="flex items-start gap-3 px-5 py-3 group">
																	<span className="text-xs font-mono text-slate-400 mt-1 w-6 text-right flex-shrink-0">
																		{qIdx + 1}.
																	</span>
																	<QIcon className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
																	<div className="flex-1 min-w-0">
																		{isSectionEditing && qEdits ? (
																			<div className="space-y-2">
																				<input
																					type="text"
																					value={qEdits.text || ''}
																					onChange={(e) => updateEditedQuestion(q.id, 'text', e.target.value)}
																					className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
																				/>
																				<div className="flex items-center gap-3 flex-wrap">
																					<SearchableSelect
																						value={qEdits.type || q.type}
																						onChange={(val) => updateEditedQuestion(q.id, 'type', val)}
																						options={QUESTION_TYPES.map(t => ({ value: t.value, label: t.label, icon: t.icon }))}
																						size="sm"
																						className="w-40"
																					/>
																					<label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
																						<input
																							type="checkbox"
																							checked={qEdits.is_required ?? q.is_required}
																							onChange={(e) => updateEditedQuestion(q.id, 'is_required', e.target.checked)}
																							className="rounded border-slate-300 dark:border-slate-600"
																						/>
																						Required
																					</label>
																				</div>
																				{/* Editable options for dropdown/multiselect types */}
																				{needsOptions(qEdits.type || q.type) && (qEdits.type || q.type) !== 'USER_SELECT' && (
																					<div className="space-y-1.5 pt-1">
																						<span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Options</span>
																						{(qEdits.options || []).map((opt, oIdx) => (
																							<div key={oIdx} className="flex items-center gap-2">
																								<input
																									type="text"
																									value={opt.text}
																									onChange={(e) => {
																										const newOpts = [...(qEdits.options || [])];
																										newOpts[oIdx] = { ...newOpts[oIdx], text: e.target.value, value: e.target.value };
																										updateEditedQuestion(q.id, 'options', newOpts);
																									}}
																									className="flex-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
																									placeholder={`Option ${oIdx + 1}`}
																								/>
																								{isQuiz && (
																									<label className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 cursor-pointer whitespace-nowrap">
																										<input
																											type="checkbox"
																											checked={opt.is_correct}
																											onChange={(e) => {
																												const newOpts = [...(qEdits.options || [])];
																												newOpts[oIdx] = { ...newOpts[oIdx], is_correct: e.target.checked };
																												updateEditedQuestion(q.id, 'options', newOpts);
																											}}
																											className="rounded border-slate-300 dark:border-slate-600 w-3 h-3"
																										/>
																										Correct
																									</label>
																								)}
																								<button
																									onClick={() => {
																										const newOpts = (qEdits.options || []).filter((_, i) => i !== oIdx);
																										updateEditedQuestion(q.id, 'options', newOpts);
																									}}
																									className="p-0.5 text-red-400 hover:text-red-600 transition-colors"
																									title="Remove option"
																								>
																									<X className="w-3.5 h-3.5" />
																								</button>
																							</div>
																						))}
																						<button
																							onClick={() => {
																								const newOpts = [...(qEdits.options || []), { text: '', value: '', is_correct: false, sequence_order: (qEdits.options || []).length }];
																								updateEditedQuestion(q.id, 'options', newOpts);
																							}}
																							className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
																						>
																							+ Add option
																						</button>
																					</div>
																				)}
																				{/* USER_SELECT: role checkboxes */}
																				{(qEdits.type || q.type) === 'USER_SELECT' && (
																					<div className="space-y-1.5 pt-1">
																						<span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Include Users</span>
																						<div className="flex flex-wrap gap-3">
																							{USER_SELECT_ROLES.map(role => (
																								<label key={role.key} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
																									<input
																										type="checkbox"
																										checked={(qEdits.config as any)?.roles?.[role.key] ?? false}
																										onChange={(e) => {
																											const prevConfig = (qEdits.config || {}) as any;
																											const prevRoles = prevConfig.roles || {};
																											updateEditedQuestion(q.id, 'config', {
																												...prevConfig,
																												roles: { ...prevRoles, [role.key]: e.target.checked },
																											});
																										}}
																										className="rounded border-slate-300 dark:border-slate-600"
																									/>
																									{role.label}
																								</label>
																							))}
																						</div>
																					</div>
																				)}
																				{/* FILE_UPLOAD: max files + field definitions */}
																				{(qEdits.type || q.type) === 'FILE_UPLOAD' && (
																					<div className="space-y-2 pt-1">
																						<div className="flex items-center gap-3">
																							<label className="text-[10px] uppercase tracking-wider text-slate-400 font-medium whitespace-nowrap">Max Files</label>
																							<input
																								type="number"
																								min={1}
																								value={(qEdits.config as any)?.max_files ?? ''}
																								onChange={(e) => {
																									const prevConfig = (qEdits.config || {}) as any;
																									const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
																									updateEditedQuestion(q.id, 'config', { ...prevConfig, max_files: val });
																								}}
																								placeholder="∞"
																								className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs text-center"
																							/>
																							<span className="text-[10px] text-slate-400">(blank = unlimited)</span>
																							<label className="text-[10px] uppercase tracking-wider text-slate-400 font-medium whitespace-nowrap ml-2">Required</label>
																							<input
																								type="number"
																								min={0}
																								value={(() => {
																									const cfg = (qEdits.config || {}) as any;
																									const maxAllowed = cfg.max_files ? cfg.max_files - (cfg.fields || []).length : null;
																									const v = cfg.required_count ?? '';
																									if (maxAllowed !== null && v !== '' && v > maxAllowed) return maxAllowed > 0 ? maxAllowed : 0;
																									return v;
																								})()}
																								onChange={(e) => {
																									const prevConfig = (qEdits.config || {}) as any;
																									const maxAllowed = prevConfig.max_files ? prevConfig.max_files - (prevConfig.fields || []).length : null;
																									let val = e.target.value === '' ? null : parseInt(e.target.value, 10);
																									if (val !== null && maxAllowed !== null && val > maxAllowed) val = maxAllowed > 0 ? maxAllowed : 0;
																									updateEditedQuestion(q.id, 'config', { ...prevConfig, required_count: val });
																								}}
																								disabled={(() => {
																									const cfg = (qEdits.config || {}) as any;
																									if (!cfg.max_files) return false;
																									return cfg.max_files - (cfg.fields || []).length <= 0;
																								})()}
																								placeholder="0"
																								className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs text-center disabled:opacity-50 disabled:cursor-not-allowed"
																							/>
																							<span className="text-[10px] text-slate-400">(for non-labelled)</span>
																						</div>
																						<span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Upload Fields</span>
																						{((qEdits.config as any)?.fields || []).map((field: any, fIdx: number) => (
																							<><div key={fIdx} className="flex items-start gap-2 pl-2">
																								<span className="text-[10px] text-slate-400 mt-2 w-4 text-right flex-shrink-0">{fIdx + 1}.</span>
																								<div className="flex-1 space-y-1">
																									<input
																										type="text"
																										value={field.label || ''}
																										onChange={(e) => {
																											const prevConfig = (qEdits.config || {}) as any;
																											const fields = [...(prevConfig.fields || [])];
																											fields[fIdx] = { ...fields[fIdx], label: e.target.value };
																											updateEditedQuestion(q.id, 'config', { ...prevConfig, fields });
																										}}
																										placeholder="Field label (e.g. Site Photo)"
																										className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs" />
																									<label className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 cursor-pointer">
																										<input
																											type="checkbox"
																											checked={field.is_required ?? false}
																											onChange={(e) => {
																												const prevConfig = (qEdits.config || {}) as any;
																												const fields = [...(prevConfig.fields || [])];
																												fields[fIdx] = { ...fields[fIdx], is_required: e.target.checked };
																												updateEditedQuestion(q.id, 'config', { ...prevConfig, fields });
																											}}
																											className="rounded border-slate-300 dark:border-slate-600 w-3 h-3" />
																										Required
																									</label>
																									<div className="flex flex-wrap gap-1.5">
																										{FILE_UPLOAD_TYPES.map(ft => {
																											const isActive = (field.types || []).includes(ft.key);
																											return (
																												<button
																													key={ft.key}
																													type="button"
																													onClick={() => {
																														const prevConfig = (qEdits.config || {}) as any;
																														const fields = [...(prevConfig.fields || [])];
																														const curTypes: string[] = fields[fIdx].types || [];
																														fields[fIdx] = {
																															...fields[fIdx],
																															types: isActive ? curTypes.filter(t => t !== ft.key) : [...curTypes, ft.key],
																														};
																														updateEditedQuestion(q.id, 'config', { ...prevConfig, fields });
																													}}
																													className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${isActive
																														? 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
																														: 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:border-slate-300'}`}
																												>
																													{ft.label}
																												</button>
																											);
																										})}
																									</div>
																								</div>
																								));
																							</div><button
																								onClick={() => {
																									const prevConfig = (qEdits.config || {}) as any;
																									const fields = (prevConfig.fields || []).filter((_: any, i: number) => i !== fIdx);
																									updateEditedQuestion(q.id, 'config', { ...prevConfig, fields });
																								}}
																								className="p-0.5 text-red-400 hover:text-red-600 transition-colors mt-1.5"
																								title="Remove field"
																							>
																									<X className="w-3.5 h-3.5" />
																								</button></>
																						))}
																						<button
																							onClick={() => {
																								const prevConfig = (qEdits.config || {}) as any;
																								const fields = [...(prevConfig.fields || []), { label: '', types: [], is_required: false }];
																								const maxFiles = prevConfig.max_files;
																								if (maxFiles && fields.length > maxFiles) return;
																								updateEditedQuestion(q.id, 'config', { ...prevConfig, fields });
																							}}
																							disabled={(() => {
																								const c = (qEdits.config || {}) as any;
																								return c.max_files && (c.fields || []).length >= c.max_files;
																							})()}
																							className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
																						>
																							+ Add upload field
																						</button>
																					</div>
																				)}
																				{/* DATA_SELECT: entity type, prefill mode, scope filter */}
																				{(qEdits.type || q.type) === 'DATA_SELECT' && (
																					<div className="space-y-2 pt-1">
																						<div className="flex items-center gap-3 flex-wrap">
																							<label className="text-[10px] uppercase tracking-wider text-slate-400 font-medium whitespace-nowrap">Entity</label>
																							<select
																								value={(qEdits.config as any)?.entity_type || ''}
																								onChange={(e) => {
																									const prevConfig = (qEdits.config || {}) as any;
																									updateEditedQuestion(q.id, 'config', { ...prevConfig, entity_type: e.target.value || null });
																								}}
																								className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
																							>
																								<option value="">Select entity...</option>
																								{DATA_SELECT_ENTITIES.map(e => (
																									<option key={e.key} value={e.key}>{e.label}</option>
																								))}
																							</select>
																							<label className="text-[10px] uppercase tracking-wider text-slate-400 font-medium whitespace-nowrap">Prefill</label>
																							<select
																								value={(qEdits.config as any)?.prefill_mode || ''}
																								onChange={(e) => {
																									const prevConfig = (qEdits.config || {}) as any;
																									updateEditedQuestion(q.id, 'config', { ...prevConfig, prefill_mode: e.target.value || null });
																								}}
																								className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
																							>
																								{DATA_SELECT_PREFILL_MODES.map(m => (
																									<option key={m.key} value={m.key}>{m.label}</option>
																								))}
																							</select>
																						</div>
																						<label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
																							<input
																								type="checkbox"
																								checked={(qEdits.config as any)?.scope_filter ?? false}
																								onChange={(e) => {
																									const prevConfig = (qEdits.config || {}) as any;
																									updateEditedQuestion(q.id, 'config', { ...prevConfig, scope_filter: e.target.checked });
																								}}
																								className="rounded border-slate-300 dark:border-slate-600"
																							/>
																							Scope filter (restrict by company/site context)
																						</label>
																					</div>
																				)}
																			</div>
																		) : (
																			<>
																				<p className="text-sm text-slate-900 dark:text-white">
																					{q.text}
																					{q.is_required && <span className="text-red-500 ml-0.5">*</span>}
																				</p>
																				<div className="flex items-center gap-2 mt-1">
																					<span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{q.type.replace('_', ' ')}</span>
																					{isQuiz && q.points > 0 && (
																						<span className="text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 px-1.5 py-0.5 rounded">
																							{q.points} pts
																						</span>
																					)}
																					{q.options?.length > 0 && (
																						<span className="text-[10px] text-slate-400">
																							{q.options.length} option{q.options.length !== 1 ? 's' : ''}
																						</span>
																					)}
																				</div>
																				{/* Show options inline */}
																				{q.options?.length > 0 && (
																					<div className="flex flex-wrap gap-1.5 mt-1.5">
																						{q.options.map((opt: { is_correct: any; text: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }, oIdx: Key | null | undefined) => (
																							<span key={oIdx} className={`text-xs px-2 py-0.5 rounded-full border ${opt.is_correct
																								? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-500/10 dark:text-green-400'
																								: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
																								}`}>
																								{opt.text}
																								{opt.is_correct && <Check className="w-3 h-3 inline ml-0.5" />}
																							</span>
																						))}
																					</div>
																				)}
																				{/* Show USER_SELECT roles in read-only view */}
																				{q.type === 'USER_SELECT' && q.config?.roles && (
																					<div className="flex flex-wrap gap-1.5 mt-1.5">
																						{USER_SELECT_ROLES.filter(r => q.config.roles[r.key]).map(r => (
																							<span key={r.key} className="text-xs px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
																								{r.label}
																							</span>
																						))}
																					</div>
																				)}
																				{/* Show FILE_UPLOAD config in read-only view */}
																				{q.type === 'FILE_UPLOAD' && q.config && (
																					<div className="mt-1.5 space-y-1">
																						{q.config.max_files && (
																							<span className="text-[10px] text-slate-400">Max: {q.config.max_files} file(s)</span>
																						)}
																						{q.config.required_count != null && (
																							<span className="text-[10px] text-slate-400">Required: {q.config.required_count}</span>
																						)}
																						{q.config.fields?.length > 0 && (
																							<div className="flex flex-wrap gap-1.5">
																								{q.config.fields.map((f: any, i: number) => (
																									<span key={i} className="text-xs px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
																										{f.label || `Field ${i + 1}`}
																										{f.is_required && <span className="text-red-500 ml-0.5">*</span>}
																										{f.types?.length > 0 && (
																											<span className="text-[9px] ml-1 opacity-70">({f.types.join(', ')})</span>
																										)}
																									</span>
																								))}
																							</div>
																						)}
																					</div>
																				)}
																				{/* Show DATA_SELECT config in read-only view */}
																				{q.type === 'DATA_SELECT' && q.config && (
																					<div className="flex flex-wrap gap-1.5 mt-1.5">
																						{q.config.entity_type && (
																							<span className="text-xs px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
																								{q.config.entity_type}
																							</span>
																						)}
																						{q.config.prefill_mode && (
																							<span className="text-xs px-2 py-0.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
																								Prefill: {q.config.prefill_mode}
																							</span>
																						)}
																						{q.config.scope_filter && (
																							<span className="text-xs px-2 py-0.5 rounded-full border border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
																								Scoped
																							</span>
																						)}
																					</div>
																				)}
																			</>
																		)}
																	</div>
																	{
																		isSectionEditing && (
																			<button
																				onClick={() => deleteQuestion(q.id)}
																				className="p-1 text-red-400 hover:text-red-600 dark:text-red-400/60 dark:hover:text-red-500 transition-all rounded mt-1"
																				title="Delete question"
																			>
																				<Trash2 className="w-3.5 h-3.5" />
																			</button>
																		)
																	}
																</div>
															);
														})}
													</div>
												</div>
											))}
										</div>
									) : (
										<div className="px-5 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
											No questions yet
										</div>
									)}

									{/* Add question form — only visible in edit mode */}
									{editingMode && addingQuestionSection === section.id ? (
										<div className="border-t border-slate-100 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/30 space-y-3">
											<textarea
												value={newQText}
												onChange={(e) => setNewQText(e.target.value)}
												placeholder="Question text..."
												rows={2}
												className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 text-sm"
												autoFocus
											/>
											<div className="flex items-center gap-3 flex-wrap">
												<SearchableSelect
													value={newQType}
													onChange={(val) => {
														setNewQType(val);
														// Reset options if switching away from option types
														if (!needsOptions(val)) setNewQOptions([]);
														// Auto-add Yes/No options
														if (val === 'YES_NO') {
															setNewQOptions([
																{ text: 'Yes', value: 'YES', is_correct: false },
																{ text: 'No', value: 'NO', is_correct: false },
															]);
														}
													}}
													options={QUESTION_TYPES.map(t => ({ value: t.value, label: t.label, icon: t.icon }))}
													className="w-48"
												/>
												<label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
													<input type="checkbox" checked={newQRequired} onChange={(e) => setNewQRequired(e.target.checked)} className="rounded border-slate-300 dark:border-slate-600" />
													Required
												</label>
												{isQuiz && (
													<div className="flex items-center gap-1.5">
														<label className="text-sm text-slate-600 dark:text-slate-400">Points:</label>
														<input
															type="number"
															min={0}
															value={newQPoints}
															onChange={(e) => setNewQPoints(parseInt(e.target.value, 10) || 0)}
															className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
														/>
													</div>
												)}
											</div>

											{/* Options editor (for SELECT / MULTI_SELECT / YES_NO) */}
											{needsOptions(newQType) && (
												<div className="space-y-2 pl-2">
													<label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Options</label>
													{newQOptions.map((opt, oIdx) => (
														<div key={oIdx} className="flex items-center gap-2">
															<input
																type="text"
																value={opt.text}
																onChange={(e) => updateOption(oIdx, 'text', e.target.value)}
																placeholder={`Option ${oIdx + 1}`}
																className="flex-1 px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
															/>
															{isQuiz && (
																<label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer whitespace-nowrap">
																	<input
																		type="checkbox"
																		checked={opt.is_correct}
																		onChange={(e) => updateOption(oIdx, 'is_correct', e.target.checked)}
																		className="rounded border-slate-300 dark:border-slate-600"
																	/>
																	Correct
																</label>
															)}
															<button onClick={() => removeOption(oIdx)} className="p-1 text-slate-400 hover:text-red-500">
																<X className="w-3.5 h-3.5" />
															</button>
														</div>
													))}
													<button
														onClick={addOptionRow}
														className="text-xs text-blue-600 hover:text-blue-700 font-medium"
													>
														+ Add option
													</button>
												</div>
											)}

											{/* USER_SELECT: role checkboxes for new question */}
											{newQType === 'USER_SELECT' && (
												<div className="space-y-2 pl-2">
													<label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Include Users</label>
													<div className="flex flex-wrap gap-3">
														{USER_SELECT_ROLES.map(role => (
															<label key={role.key} className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
																<input
																	type="checkbox"
																	checked={newQConfig.roles?.[role.key] ?? false}
																	onChange={(e) => {
																		setNewQConfig(prev => ({
																			...prev,
																			roles: { ...(prev.roles || {}), [role.key]: e.target.checked },
																		}));
																	}}
																	className="rounded border-slate-300 dark:border-slate-600"
																/>
																{role.label}
															</label>
														))}
													</div>
												</div>
											)}

											{/* FILE_UPLOAD: max files + field definitions for new question */}
											{newQType === 'FILE_UPLOAD' && (
												<div className="space-y-2 pl-2">
													<div className="flex items-center gap-3">
														<label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Max Files</label>
														<input
															type="number"
															min={1}
															value={newQConfig.max_files ?? ''}
															onChange={(e) => setNewQConfig(prev => ({ ...prev, max_files: e.target.value === '' ? null : parseInt(e.target.value, 10) }))}
															placeholder="∞"
															className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm text-center"
														/>
														<span className="text-[10px] text-slate-400">(blank = unlimited)</span>
														<label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap ml-2">Required</label>
														<input
															type="number"
															min={0}
															value={(() => {
																const maxAllowed = newQConfig.max_files ? newQConfig.max_files - (newQConfig.fields || []).length : null;
																const v = newQConfig.required_count ?? '';
																if (maxAllowed !== null && v !== '' && v > maxAllowed) return maxAllowed > 0 ? maxAllowed : 0;
																return v;
															})()}
															onChange={(e) => {
																const maxAllowed = newQConfig.max_files ? newQConfig.max_files - (newQConfig.fields || []).length : null;
																let val = e.target.value === '' ? null : parseInt(e.target.value, 10);
																if (val !== null && maxAllowed !== null && val > maxAllowed) val = maxAllowed > 0 ? maxAllowed : 0;
																setNewQConfig(prev => ({ ...prev, required_count: val }));
															}}
															disabled={(() => {
																if (!newQConfig.max_files) return false;
																return newQConfig.max_files - (newQConfig.fields || []).length <= 0;
															})()}
															placeholder="0"
															className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm text-center disabled:opacity-50 disabled:cursor-not-allowed"
														/>
														<span className="text-[10px] text-slate-400">(for non-labelled)</span>
													</div>
													<label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Upload Fields</label>
													{(newQConfig.fields || []).map((field: any, fIdx: number) => (
														<div key={fIdx} className="flex items-start gap-2">
															<span className="text-[10px] text-slate-400 mt-2 w-4 text-right flex-shrink-0">{fIdx + 1}.</span>
															<div className="flex-1 space-y-1">
																<input
																	type="text"
																	value={field.label || ''}
																	onChange={(e) => {
																		setNewQConfig(prev => {
																			const fields = [...(prev.fields || [])];
																			fields[fIdx] = { ...fields[fIdx], label: e.target.value };
																			return { ...prev, fields };
																		});
																	}}
																	placeholder="Field label (e.g. Site Photo)"
																	className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
																/>
																<label className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 cursor-pointer">
																	<input
																		type="checkbox"
																		checked={field.is_required ?? false}
																		onChange={(e) => {
																			setNewQConfig(prev => {
																				const fields = [...(prev.fields || [])];
																				fields[fIdx] = { ...fields[fIdx], is_required: e.target.checked };
																				return { ...prev, fields };
																			});
																		}}
																		className="rounded border-slate-300 dark:border-slate-600 w-3 h-3"
																	/>
																	Required
																</label>
																<div className="flex flex-wrap gap-1.5">
																	{FILE_UPLOAD_TYPES.map(ft => {
																		const isActive = (field.types || []).includes(ft.key);
																		return (
																			<button
																				key={ft.key}
																				type="button"
																				onClick={() => {
																					setNewQConfig(prev => {
																						const fields = [...(prev.fields || [])];
																						const curTypes: string[] = fields[fIdx].types || [];
																						fields[fIdx] = {
																							...fields[fIdx],
																							types: isActive ? curTypes.filter(t => t !== ft.key) : [...curTypes, ft.key],
																						};
																						return { ...prev, fields };
																					});
																				}}
																				className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${isActive
																					? 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
																					: 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:border-slate-300'
																					}`}
																			>
																				{ft.label}
																			</button>
																		);
																	})}
																</div>
															</div>
															<button
																onClick={() => {
																	setNewQConfig(prev => ({
																		...prev,
																		fields: (prev.fields || []).filter((_: any, i: number) => i !== fIdx),
																	}));
																}}
																className="p-0.5 text-red-400 hover:text-red-600 transition-colors mt-1.5"
																title="Remove field"
															>
																<X className="w-3.5 h-3.5" />
															</button>
														</div>
													))}
													<button
														onClick={() => {
															setNewQConfig(prev => {
																const fields = [...(prev.fields || []), { label: '', types: [], is_required: false }];
																if (prev.max_files && fields.length > prev.max_files) return prev;
																return { ...prev, fields };
															});
														}}
														disabled={newQConfig.max_files ? (newQConfig.fields || []).length >= newQConfig.max_files : false}
														className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
													>
														+ Add upload field
													</button>
												</div>
											)}

											{/* DATA_SELECT: entity type, prefill mode, scope filter for new question */}
											{newQType === 'DATA_SELECT' && (
												<div className="space-y-2 pl-2">
													<div className="flex items-center gap-3 flex-wrap">
														<label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Entity Type</label>
														<select
															value={newQConfig.entity_type || ''}
															onChange={(e) => setNewQConfig(prev => ({ ...prev, entity_type: e.target.value || null }))}
															className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
														>
															<option value="">Select entity...</option>
															{DATA_SELECT_ENTITIES.map(e => (
																<option key={e.key} value={e.key}>{e.label}</option>
															))}
														</select>
														<label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Prefill Mode</label>
														<select
															value={newQConfig.prefill_mode || ''}
															onChange={(e) => setNewQConfig(prev => ({ ...prev, prefill_mode: e.target.value || null }))}
															className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
														>
															{DATA_SELECT_PREFILL_MODES.map(m => (
																<option key={m.key} value={m.key}>{m.label}</option>
															))}
														</select>
													</div>
													<label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
														<input
															type="checkbox"
															checked={newQConfig.scope_filter ?? false}
															onChange={(e) => setNewQConfig(prev => ({ ...prev, scope_filter: e.target.checked }))}
															className="rounded border-slate-300 dark:border-slate-600"
														/>
														Scope filter (restrict by company/site context)
													</label>
												</div>
											)}

											<div className="flex justify-end gap-2 pt-1">
												<button onClick={resetQuestionForm} className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
													Cancel
												</button>
												<button
													onClick={() => addQuestion(section.id)}
													disabled={saving || !newQText.trim()}
													className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
												>
													<Plus className="w-3.5 h-3.5" />
													Add Question
												</button>
											</div>
										</div>
									) : editingMode ? (
										<div className="border-t border-slate-100 dark:border-slate-800 px-5 py-3">
											<button
												onClick={() => { resetQuestionForm(); setAddingQuestionSection(section.id); }}
												className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
											>
												<Plus className="w-3.5 h-3.5" />
												Add Question
											</button>
										</div>
									) : null}
								</div>
							)
							}
						</div>
					);
				})}
			</div >

			{/* ── Add Section Button ── */}
			{
				editingMode && addingSectionIdx !== null ? (
					<div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-dashed border-blue-300 dark:border-blue-700 p-5 space-y-3">
						<input
							type="text"
							value={newSectionName}
							onChange={(e) => setNewSectionName(e.target.value)}
							placeholder="Section name (e.g. A. Site & Employer Details)"
							className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
							autoFocus
						/>
						<div className="flex items-center justify-between">
							<label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
								<input type="checkbox" checked={newSectionWizard} onChange={(e) => setNewSectionWizard(e.target.checked)} className="rounded border-slate-300 dark:border-slate-600" />
								Start new wizard page
							</label>
							<div className="flex gap-2">
								<button onClick={() => setAddingSectionIdx(null)} className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400">Cancel</button>
								<button
									onClick={addSection}
									disabled={saving || !newSectionName.trim()}
									className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
								>
									<Plus className="w-3.5 h-3.5" />
									Add Section
								</button>
							</div>
						</div>
					</div>
				) : editingMode ? (
					<button
						onClick={() => setAddingSectionIdx(0)}
						className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
					>
						<Plus className="w-5 h-5" />
						Add Section
					</button>
				) : null
			}
		</div >
	);
}
