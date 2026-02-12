'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Pencil, Trash2, Save, X, Loader2 } from 'lucide-react';
import { useAlert } from '@/components/tailwind/ui/AlertDialog';
import { useToast } from '@/components/tailwind/ui/Toast';

/**
 * Valid reference types.
 */
const VALID_TYPES = ['industries', 'categories', 'skills'];

interface RefItem {
    id: string;
    name: string;
    is_active?: boolean;
}

/**
 * Dynamic reference data page.
 * Renders items for the given [type] (industries, categories, or skills).
 */
export default function ReferenceTypePage() {
    const params = useParams();
    const type = (params?.type as string) || 'industries';
    const { confirm, error } = useAlert();
    const toast = useToast();

    const [items, setItems] = useState<RefItem[]>([]);
    const [loading, setLoading] = useState(true);
    const initialLoadDone = useRef(false);

    // Inline editing state
    const [editId, setEditId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    // Inline create state
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');

    // Action loading
    const [actionLoading, setActionLoading] = useState(false);

    /** Fetch reference items by type */
    const fetchData = useCallback(async () => {
        if (!VALID_TYPES.includes(type)) return;
        // Only show full loader on initial load — refetches are silent
        if (!initialLoadDone.current) setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/reference/${type}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.status) {
                setItems(json.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        } finally {
            setLoading(false);
            initialLoadDone.current = true;
        }
    }, [type]);

    useEffect(() => {
        initialLoadDone.current = false;
        fetchData();
        setEditId(null);
        setIsCreating(false);
    }, [type, fetchData]);

    /** Create a new item */
    const handleCreate = async () => {
        if (!newName.trim()) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/reference/${type}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim() })
            });
            const json = await res.json();
            if (json.status) {
                setNewName('');
                setIsCreating(false);
                fetchData();
                toast.success(`${typeLabel.slice(0, -1)} created successfully.`);
            } else {
                error('Create Failed', json.message || 'Could not create the item.');
            }
        } catch (error) {
            console.error('Create failed:', error);
        } finally {
            setActionLoading(false);
        }
    };

    /** Update an existing item */
    const handleUpdate = async (id: string) => {
        if (!editName.trim()) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/reference/${type}?id=${id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName.trim() })
            });
            const json = await res.json();
            if (json.status) {
                setEditId(null);
                setEditName('');
                fetchData();
                toast.success(`${typeLabel.slice(0, -1)} updated successfully.`);
            } else {
                error('Update Failed', json.message || 'Could not update the item.');
            }
        } catch (error) {
            console.error('Update failed:', error);
        } finally {
            setActionLoading(false);
        }
    };

    /** Delete an item */
    const handleDelete = async (id: string, name: string) => {
        const confirmed = await confirm('Delete Item', `Are you sure you want to delete "${name}"? This action cannot be undone.`, 'danger');
        if (!confirmed) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/reference/${type}?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.status) {
                fetchData();
                toast.success(`"${name}" has been deleted.`);
            } else {
                error('Delete Failed', json.message || 'Could not delete the item.');
            }
        } catch (error) {
            console.error('Delete failed:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

    if (!VALID_TYPES.includes(type)) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                <p className="text-slate-500 dark:text-slate-400">Invalid reference type.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Header with Add button */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {items.length} {typeLabel}
                </span>
                <button
                    onClick={() => { setIsCreating(true); setNewName(''); }}
                    disabled={isCreating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add New
                </button>
            </div>

            {/* Create row */}
            {isCreating && (
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-50/50 dark:bg-blue-500/5 border-b border-slate-200 dark:border-slate-800">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        placeholder={`Enter ${type.slice(0, -1)} name...`}
                        autoFocus
                        className="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleCreate}
                        disabled={actionLoading || !newName.trim()}
                        className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => { setIsCreating(false); setNewName(''); }}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Items List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
            ) : items.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                    No items found. Click &quot;Add New&quot; to create one.
                </div>
            ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((item) => (
                        <li key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            {editId === item.id ? (
                                <>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate(item.id)}
                                        autoFocus
                                        className="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <button
                                        onClick={() => handleUpdate(item.id)}
                                        disabled={actionLoading || !editName.trim()}
                                        className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => { setEditId(null); setEditName(''); }}
                                        className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="flex-1 text-sm text-slate-900 dark:text-white">{item.name}</span>
                                    <button
                                        onClick={() => { setEditId(item.id); setEditName(item.name); }}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id, item.name)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
