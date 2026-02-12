'use client';

import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';

interface BulkImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BulkImportDialog({ isOpen, onClose, onSuccess }: BulkImportDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<{ message: string; success: boolean } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile && droppedFile.type === 'text/csv') {
            setFile(droppedFile);
            setResult(null);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setImporting(true);
        setResult(null);

        const formData = new FormData();
        // Assuming the backend expects 'file' key
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/companies/bulk', {
                method: 'POST',
                headers: {
                    // Don't set Content-Type header manually for FormData, browser does it with boundary
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            const data = await res.json();

            if (data.status) {
                setResult({ message: data.message || 'Import successful!', success: true });
                setTimeout(() => {
                    onSuccess(); // Refresh parent data
                    onClose();
                    setFile(null);
                    setResult(null);
                }, 1500);
            } else {
                setResult({ message: data.message || 'Import failed.', success: false });
            }
        } catch (err) {
            setResult({ message: 'Network error occurred.', success: false });
        } finally {
            setImporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Bulk Import Companies</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 space-y-4 overflow-y-auto">
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        Upload a CSV file containing company data. Headers should include:<br />
                        <code className="inline-block mt-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                            name, industry_id, website, tax_id, address, contact_email, contact_phone
                        </code>
                    </p>

                    {/* Dropzone */}
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative group
							${file
                                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                                : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }
						`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />

                        {file ? (
                            <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                    <UploadCloud className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-slate-900 dark:text-white truncate max-w-[200px] mx-auto">{file.name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                                    className="text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded transition-colors"
                                >
                                    Remove file
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 py-2">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full group-hover:scale-110 transition-transform duration-200">
                                    <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to upload or drag and drop</p>
                                    <p className="text-xs text-slate-500 mt-1">CSV files only</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Result Message */}
                    {result && (
                        <div className={`
							p-4 rounded-lg flex items-start gap-3 text-sm animate-in slide-in-from-top-2 duration-200
							${result.success
                                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800'
                                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800'
                            }
						`}>
                            {result.success
                                ? <CheckCircle className="w-5 h-5 mt-0.5 shrink-0 text-green-600 dark:text-green-400" />
                                : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
                            }
                            <div className="flex-1">
                                <p className="font-medium">{result.success ? 'Success' : 'Error'}</p>
                                <p className="opacity-90 mt-0.5">{result.message}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3 sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg transition-colors border border-transparent"
                        disabled={importing}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!file || importing}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-all shadow-sm active:scale-95"
                    >
                        {importing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Importing...</span>
                            </>
                        ) : (
                            'Start Import'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
