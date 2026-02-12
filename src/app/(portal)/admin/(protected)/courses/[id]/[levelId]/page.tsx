'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAlert } from '@/components/ui/AlertDialog';
import { useToast } from '@/components/ui/Toast';
import {
    Plus,
    Video,
    HelpCircle,
    Pencil,
    Trash2,
    Settings,
    ChevronDown,
    ChevronUp,
    X,
    Save,
    Loader2,
    CheckCircle2
} from 'lucide-react';

/**
 * Content item shape.
 */
interface ContentItem {
    id: string;
    title: string;
    type: 'VIDEO' | 'QUESTIONNAIRE';
    video_url?: string;
    passing_score?: number;
    sequence_order: number;
}

/**
 * Quiz question option.
 */
interface QuizOption {
    id?: string;
    text: string;
    is_correct: boolean;
}

/**
 * Quiz question shape.
 */
interface QuizQuestion {
    id: string;
    text: string;
    type: string;
    points: number;
    options: QuizOption[];
}

/**
 * Level content page — content CRUD + quiz management.
 * Route: /admin/courses/[id]/[levelId]
 */
export default function LevelContentPage() {
    const params = useParams();
    const levelId = params?.levelId as string;
    const { confirm, error: alertError } = useAlert();
    const toast = useToast();

    const [contents, setContents] = useState<ContentItem[]>([]);
    const [levelTitle, setLevelTitle] = useState('');
    const [loading, setLoading] = useState(true);

    // Add/Edit Content state
    const [showContentForm, setShowContentForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState('');
    const [contentForm, setContentForm] = useState({
        title: '',
        type: 'VIDEO' as 'VIDEO' | 'QUESTIONNAIRE',
        video_url: '',
        passing_score: 70
    });
    const [actionLoading, setActionLoading] = useState(false);

    // Quiz state
    const [quizContentId, setQuizContentId] = useState<string | null>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [newQText, setNewQText] = useState('');
    const [newQPoints, setNewQPoints] = useState(1);
    const [newQOptions, setNewQOptions] = useState<QuizOption[]>([
        { text: '', is_correct: false },
        { text: '', is_correct: false }
    ]);

    /** Fetch level contents */
    const fetchContents = useCallback(async () => {
        try {
            const courseId = params?.id as string;
            const res = await fetch(`/api/v1/courses/${courseId}`);
            const json = await res.json();
            if (json.status) {
                const level = json.data.levels?.find((l: { id: string }) => l.id === levelId);
                if (level) {
                    setContents(level.contents || []);
                    setLevelTitle(level.title);
                }
            }
        } catch (err) {
            console.error('Failed to fetch contents:', err);
        } finally {
            setLoading(false);
        }
    }, [params?.id, levelId]);

    useEffect(() => {
        fetchContents();
    }, [fetchContents]);

    /** Open add content form */
    const openAddForm = () => {
        setIsEditing(false);
        setContentForm({ title: '', type: 'VIDEO', video_url: '', passing_score: 70 });
        setShowContentForm(true);
    };

    /** Open edit content form */
    const openEditForm = (item: ContentItem) => {
        setIsEditing(true);
        setEditId(item.id);
        setContentForm({
            title: item.title,
            type: item.type,
            video_url: item.video_url || '',
            passing_score: item.passing_score || 70
        });
        setShowContentForm(true);
    };

    /** Save content (create or update) */
    const handleSaveContent = async () => {
        if (!contentForm.title.trim()) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');

            if (isEditing) {
                const payload = {
                    title: contentForm.title,
                    video_url: contentForm.type === 'VIDEO' ? contentForm.video_url : undefined,
                    passing_score: contentForm.type === 'QUESTIONNAIRE' ? contentForm.passing_score : undefined
                };
                await fetch(`/api/v1/content/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                toast.success('Content updated successfully.');
            } else {
                const payload = {
                    course_level_id: levelId,
                    ...contentForm,
                    video_duration_seconds: contentForm.type === 'VIDEO' ? 600 : undefined,
                    is_final_exam: false
                };
                await fetch('/api/v1/content', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                toast.success('Content added successfully.');
            }
            setShowContentForm(false);
            fetchContents();
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setActionLoading(false);
        }
    };

    /** Delete content */
    const handleDeleteContent = async (item: ContentItem) => {
        const confirmed = await confirm('Delete Content', `Are you sure you want to delete "${item.title}"?`, 'danger');
        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/content/${item.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success(`"${item.title}" deleted.`);
                fetchContents();
            }
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    /** Fetch quiz questions */
    const openQuizManager = async (contentId: string) => {
        setQuizContentId(contentId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/content/${contentId}/questions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const text = await res.text();
            if (!text) {
                console.error('Empty response from questions API');
                setQuestions([]);
                return;
            }
            const json = JSON.parse(text);
            if (json.status) {
                setQuestions(json.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch questions:', err);
            setQuestions([]);
        }
    };

    /** Handle option change */
    const handleOptionChange = (index: number, field: 'text' | 'is_correct', value: string | boolean) => {
        const opts = [...newQOptions];
        if (field === 'text') {
            opts[index].text = value as string;
        } else {
            opts[index].is_correct = value as boolean;
            if (value === true) {
                opts.forEach((o, i) => { if (i !== index) o.is_correct = false; });
            }
        }
        setNewQOptions(opts);
    };

    /** Add a new question */
    const handleAddQuestion = async () => {
        if (!newQText.trim() || !quizContentId) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/v1/content/${quizContentId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    text: newQText,
                    type: 'MCQ',
                    points: newQPoints,
                    options: newQOptions
                })
            });
            const json = await res.json();
            if (json.status) {
                setNewQText('');
                setNewQOptions([{ text: '', is_correct: false }, { text: '', is_correct: false }]);
                openQuizManager(quizContentId);
                toast.success('Question added.');
            } else {
                alertError('Error', json.message);
            }
        } catch (err) {
            console.error('Add question failed:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Level Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{levelTitle}</h2>
                <button
                    onClick={openAddForm}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Content
                </button>
            </div>

            {/* Add/Edit Content Form */}
            {showContentForm && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                            {isEditing ? 'Edit Content' : 'Add Content'}
                        </h3>
                        <button onClick={() => setShowContentForm(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <input
                        type="text"
                        placeholder="Title"
                        value={contentForm.title}
                        onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                        className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {!isEditing && (
                        <select
                            value={contentForm.type}
                            onChange={(e) => setContentForm({ ...contentForm, type: e.target.value as 'VIDEO' | 'QUESTIONNAIRE' })}
                            className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="VIDEO">Video</option>
                            <option value="QUESTIONNAIRE">Questionnaire</option>
                        </select>
                    )}

                    {contentForm.type === 'VIDEO' && (
                        <input
                            type="text"
                            placeholder="Video URL"
                            value={contentForm.video_url}
                            onChange={(e) => setContentForm({ ...contentForm, video_url: e.target.value })}
                            className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    )}

                    {contentForm.type === 'QUESTIONNAIRE' && (
                        <input
                            type="number"
                            placeholder="Passing Score"
                            value={contentForm.passing_score}
                            onChange={(e) => setContentForm({ ...contentForm, passing_score: parseInt(e.target.value) || 70 })}
                            className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    )}

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setShowContentForm(false)}
                            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveContent}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isEditing ? 'Save Changes' : 'Add'}
                        </button>
                    </div>
                </div>
            )}

            {/* Content List */}
            {contents.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No content in this level yet.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                    {contents.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${item.type === 'VIDEO'
                                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                    : 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                    }`}>
                                    {item.type === 'VIDEO' ? <Video className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</span>
                                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                                        {item.type} • Order: {item.sequence_order}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {item.type === 'QUESTIONNAIRE' && (
                                    <button
                                        onClick={() => openQuizManager(item.id)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                        title="Manage Questions"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => openEditForm(item)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    title="Edit"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteContent(item)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Quiz Manager */}
            {quizContentId && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Quiz Questions</h3>
                        <button onClick={() => setQuizContentId(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Existing Questions */}
                    {questions.length > 0 && (
                        <div className="space-y-3">
                            {questions.map((q, idx) => (
                                <QuestionAccordion key={q.id} question={q} index={idx} />
                            ))}
                        </div>
                    )}

                    {/* Add New Question Form */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Add New Question</h4>

                        <input
                            type="text"
                            placeholder="Question text"
                            value={newQText}
                            onChange={(e) => setNewQText(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <input
                            type="number"
                            placeholder="Points"
                            value={newQPoints}
                            onChange={(e) => setNewQPoints(parseInt(e.target.value) || 1)}
                            className="w-32 px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Options</p>
                        {newQOptions.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <button
                                    onClick={() => handleOptionChange(idx, 'is_correct', !opt.is_correct)}
                                    className={`p-1 rounded ${opt.is_correct ? 'text-green-600' : 'text-slate-300 dark:text-slate-600'}`}
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <input
                                    type="text"
                                    placeholder={`Option ${idx + 1}`}
                                    value={opt.text}
                                    onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                                    className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}
                        <button
                            onClick={() => setNewQOptions([...newQOptions, { text: '', is_correct: false }])}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            + Add Option
                        </button>

                        <div className="flex justify-end">
                            <button
                                onClick={handleAddQuestion}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                Save Question
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Collapsible question accordion.
 */
function QuestionAccordion({ question, index }: { question: QuizQuestion; index: number }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <span className="font-medium text-slate-900 dark:text-white">
                    {index + 1}. {question.text} <span className="text-xs text-slate-400">({question.points} pts)</span>
                </span>
                {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {open && (
                <div className="px-4 pb-3 space-y-1.5">
                    {question.options.map((opt) => (
                        <div key={opt.id} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className={`w-4 h-4 ${opt.is_correct ? 'text-green-500' : 'text-slate-300 dark:text-slate-600'}`} />
                            <span className={opt.is_correct ? 'font-medium text-green-700 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}>
                                {opt.text}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
