'use client';

import { useState, useEffect, useCallback } from 'react';
import {
	PenTool,
	KeyRound,
	CheckCircle,
	Plus,
	Loader2,
	User,
	Clock,
	Image as ImageIcon,
} from 'lucide-react';
import SignaturePad from './SignaturePad';

// ─── Types ───────────────────────────────────────────────────

interface SignoffRecord {
	id: string;
	name: string;
	designation: string | null;
	sign_method: 'DRAW' | 'OTP';
	signature_data: string | null;
	otp_verified: boolean;
	signed_at: string | null;
}

interface SignoffPanelProps {
	/** Response UUID */
	responseId: string;
	/** Existing signoffs from the response data */
	existingSignoffs: SignoffRecord[];
	/** Whether the response is completed (sign-offs only allowed on completed responses) */
	isCompleted: boolean;
	/** Callback after a signoff is added/verified */
	onSignoffAdded?: () => void;
}

// ─── Component ───────────────────────────────────────────────

/**
 * SignoffPanel — Displays existing signoffs and allows adding new ones.
 * Supports drawn (canvas) and OTP-based sign-off methods.
 */
export default function SignoffPanel({
	responseId,
	existingSignoffs,
	isCompleted,
	onSignoffAdded,
}: SignoffPanelProps) {
	const [signoffs, setSignoffs] = useState<SignoffRecord[]>(existingSignoffs);
	const [adding, setAdding] = useState(false);
	const [method, setMethod] = useState<'DRAW' | 'OTP'>('DRAW');
	const [signerName, setSignerName] = useState('');
	const [signerDesignation, setSignerDesignation] = useState('');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// OTP flow state
	const [otpSignoffId, setOtpSignoffId] = useState<string | null>(null);
	const [otpValue, setOtpValue] = useState('');
	const [verifying, setVerifying] = useState(false);

	/** Sync with prop changes */
	useEffect(() => {
		setSignoffs(existingSignoffs);
	}, [existingSignoffs]);

	/** Fetch helper */
	const apiFetch = useCallback(async (url: string, opts: RequestInit = {}) => {
		const token = localStorage.getItem('token');
		const headers: any = { 'Authorization': `Bearer ${token}`, ...opts.headers };
		if (opts.body && typeof opts.body === 'string') {
			headers['Content-Type'] = 'application/json';
		}
		const res = await fetch(url, { ...opts, headers });
		return res.json();
	}, []);

	/** Submit drawn signature */
	const handleDrawnSignoff = async (base64: string) => {
		if (!signerName.trim()) {
			setError('Signer name is required');
			return;
		}

		setSaving(true);
		setError(null);

		try {
			const json = await apiFetch(`/api/v1/surveys/responses/${responseId}/signoffs`, {
				method: 'POST',
				body: JSON.stringify({
					sign_method: 'DRAW',
					name: signerName.trim(),
					designation: signerDesignation.trim() || null,
					signature_data: base64,
				}),
			});

			if (json.status) {
				setAdding(false);
				resetForm();
				onSignoffAdded?.();
			} else {
				setError(json.message || 'Failed to save signature');
			}
		} catch {
			setError('Network error');
		} finally {
			setSaving(false);
		}
	};

	/** Request OTP */
	const handleRequestOtp = async () => {
		if (!signerName.trim()) {
			setError('Signer name is required');
			return;
		}

		setSaving(true);
		setError(null);

		try {
			const json = await apiFetch(`/api/v1/surveys/responses/${responseId}/signoffs`, {
				method: 'POST',
				body: JSON.stringify({
					sign_method: 'OTP',
					name: signerName.trim(),
					designation: signerDesignation.trim() || null,
				}),
			});

			if (json.status && json.data?.signoffId) {
				setOtpSignoffId(json.data.signoffId);
			} else {
				setError(json.message || 'Failed to request OTP');
			}
		} catch {
			setError('Network error');
		} finally {
			setSaving(false);
		}
	};

	/** Verify OTP */
	const handleVerifyOtp = async () => {
		if (!otpSignoffId || !otpValue) return;

		setVerifying(true);
		setError(null);

		try {
			const json = await apiFetch(`/api/v1/surveys/signoffs/${otpSignoffId}/verify`, {
				method: 'POST',
				body: JSON.stringify({ otp: otpValue }),
			});

			if (json.status) {
				setAdding(false);
				setOtpSignoffId(null);
				resetForm();
				onSignoffAdded?.();
			} else {
				setError(json.message || 'Invalid OTP');
			}
		} catch {
			setError('Network error');
		} finally {
			setVerifying(false);
		}
	};

	/** Reset form state */
	const resetForm = () => {
		setSignerName('');
		setSignerDesignation('');
		setMethod('DRAW');
		setOtpSignoffId(null);
		setOtpValue('');
		setError(null);
	};

	// ─── Render ──────────────────────────────────────────────

	return (
		<div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
			{/* Header */}
			<div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
				<h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
					<PenTool className="w-4 h-4 text-blue-500" />
					Sign-offs
					<span className="text-xs text-slate-400 font-normal ml-1">({signoffs.length})</span>
				</h3>
			</div>

			{/* Existing signoffs */}
			{signoffs.length > 0 && (
				<div className="divide-y divide-slate-100 dark:divide-slate-800">
					{signoffs.map((s) => (
						<div key={s.id} className="px-5 py-3 flex items-center gap-3">
							<div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${s.sign_method === 'DRAW'
									? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
									: 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
								}`}>
								{s.sign_method === 'DRAW' ? <PenTool className="w-3.5 h-3.5" /> : <KeyRound className="w-3.5 h-3.5" />}
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-slate-900 dark:text-white">{s.name}</p>
								{s.designation && (
									<p className="text-xs text-slate-500 dark:text-slate-400">{s.designation}</p>
								)}
							</div>

							{/* Status */}
							{s.sign_method === 'OTP' && !s.otp_verified ? (
								<span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
									Pending
								</span>
							) : (
								<div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
									<CheckCircle className="w-3.5 h-3.5" />
									<span>Signed</span>
								</div>
							)}

							{/* Timestamp */}
							{s.signed_at && (
								<span className="text-[10px] text-slate-400 flex items-center gap-1">
									<Clock className="w-3 h-3" />
									{new Date(s.signed_at).toLocaleString()}
								</span>
							)}

							{/* Signature preview (drawn only) */}
							{s.sign_method === 'DRAW' && s.signature_data && (
								<div className="h-8 w-20 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0">
									<img src={s.signature_data} alt="Signature" className="h-full w-full object-contain" />
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{/* No signoffs yet */}
			{signoffs.length === 0 && !adding && (
				<div className="px-5 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
					No sign-offs yet
				</div>
			)}

			{/* Add sign-off form */}
			{adding && (
				<div className="border-t border-slate-100 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/30 space-y-4">
					{/* Method selector */}
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => { setMethod('DRAW'); setOtpSignoffId(null); }}
							className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${method === 'DRAW'
									? 'bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-500/10 dark:border-blue-600 dark:text-blue-400'
									: 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
								}`}
						>
							<PenTool className="w-4 h-4" />
							Draw Signature
						</button>
						<button
							type="button"
							onClick={() => { setMethod('OTP'); }}
							className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${method === 'OTP'
									? 'bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-600 dark:text-indigo-400'
									: 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
								}`}
						>
							<KeyRound className="w-4 h-4" />
							OTP Verification
						</button>
					</div>

					{/* Signer info */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Signer Name *</label>
							<input
								type="text"
								value={signerName}
								onChange={(e) => setSignerName(e.target.value)}
								placeholder="Full name"
								className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Designation</label>
							<input
								type="text"
								value={signerDesignation}
								onChange={(e) => setSignerDesignation(e.target.value)}
								placeholder="e.g. Site Inspector"
								className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-blue-500"
							/>
						</div>
					</div>

					{/* Error */}
					{error && (
						<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
					)}

					{/* Drawn signature pad */}
					{method === 'DRAW' && (
						<SignaturePad
							onSave={handleDrawnSignoff}
							onCancel={() => { setAdding(false); resetForm(); }}
							saving={saving}
						/>
					)}

					{/* OTP flow */}
					{method === 'OTP' && !otpSignoffId && (
						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={() => { setAdding(false); resetForm(); }}
								className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleRequestOtp}
								disabled={saving || !signerName.trim()}
								className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
							>
								{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
								Send OTP
							</button>
						</div>
					)}

					{/* OTP entry */}
					{method === 'OTP' && otpSignoffId && (
						<div className="space-y-3">
							<p className="text-sm text-slate-600 dark:text-slate-400">
								A 6-digit OTP has been sent. Enter it below to verify:
							</p>
							<div className="flex items-center gap-3">
								<input
									type="text"
									value={otpValue}
									onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
									placeholder="000000"
									maxLength={6}
									className="w-32 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-indigo-500"
								/>
								<button
									type="button"
									onClick={handleVerifyOtp}
									disabled={verifying || otpValue.length !== 6}
									className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
								>
									{verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
									Verify
								</button>
							</div>
							<button
								type="button"
								onClick={() => { setAdding(false); resetForm(); }}
								className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
							>
								Cancel
							</button>
						</div>
					)}
				</div>
			)}

			{/* Add sign-off button */}
			{isCompleted && !adding && (
				<div className="border-t border-slate-100 dark:border-slate-800 px-5 py-3">
					<button
						type="button"
						onClick={() => setAdding(true)}
						className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
					>
						<Plus className="w-3.5 h-3.5" />
						Add Sign-off
					</button>
				</div>
			)}
		</div>
	);
}
