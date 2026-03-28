'use client';

import { useState, useRef, useCallback, useEffect, useId } from 'react';
import { auth } from '@/lib/firebaseClient';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

/**
 * Return type for the useFirebaseOtp hook.
 * Provides all state and methods needed for Firebase phone OTP flows.
 */
interface UseFirebaseOtpReturn {
	/** Whether an OTP send request is in progress */
	sending: boolean;
	/** Whether an OTP verify request is in progress */
	verifying: boolean;
	/** Seconds remaining before resend is allowed (0 = can resend) */
	resendTimer: number;
	/** Error message from the last operation, empty string if none */
	error: string;
	/** Whether an OTP has been successfully sent (confirmationResult exists) */
	otpSent: boolean;
	/** The unique DOM id for the reCAPTCHA container div. Render a hidden <div> with this id. */
	recaptchaContainerId: string;
	/**
	 * Send an OTP to the given phone number.
	 * @param phoneNumber - Full international phone number (e.g. "+919876543210")
	 */
	sendOtp: (phoneNumber: string) => Promise<boolean>;
	/**
	 * Verify the OTP code entered by the user.
	 * @param code - The 6-digit OTP code
	 * @returns The Firebase ID token string on success, or null on failure
	 */
	verifyOtp: (code: string) => Promise<string | null>;
	/**
	 * Resend OTP to the last phone number. Only works if resendTimer is 0.
	 */
	resendOtp: () => Promise<boolean>;
	/** Clear the current error */
	resetError: () => void;
	/** Full reset back to initial state (clears OTP sent status, error, etc.) */
	reset: () => void;
}

/** Default cooldown duration in seconds before resend is allowed */
const RESEND_COOLDOWN = 30;

/**
 * useFirebaseOtp — Shared hook for Firebase Phone OTP authentication.
 *
 * Manages the entire reCAPTCHA verifier lifecycle, OTP sending, verification,
 * resend cooldown, and error handling. Used by admin login, company login,
 * and company registration pages.
 *
 * Usage:
 * ```tsx
 * const otp = useFirebaseOtp();
 * // Render: <div id={otp.recaptchaContainerId} style={{ display: 'none' }} />
 * // Send:   await otp.sendOtp('+919876543210');
 * // Verify: const idToken = await otp.verifyOtp('123456');
 * ```
 */
export function useFirebaseOtp(): UseFirebaseOtpReturn {
	const [sending, setSending] = useState(false);
	const [verifying, setVerifying] = useState(false);
	const [resendTimer, setResendTimer] = useState(0);
	const [error, setError] = useState('');
	const [otpSent, setOtpSent] = useState(false);

	/** Stable unique id for the reCAPTCHA container DOM element */
	const instanceId = useId();
	const recaptchaContainerId = `recaptcha-${instanceId.replace(/:/g, '')}`;

	/** Internal refs — never exposed */
	const confirmationResultRef = useRef<ConfirmationResult | null>(null);
	const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
	const lastPhoneRef = useRef<string>('');
	const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// ---------------------------------------------------------------
	// RESEND COOLDOWN TIMER
	// ---------------------------------------------------------------

	/**
	 * Start the resend cooldown countdown.
	 * Automatically clears itself when it reaches 0.
	 */
	const startResendTimer = useCallback(() => {
		setResendTimer(RESEND_COOLDOWN);
		if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
		timerIntervalRef.current = setInterval(() => {
			setResendTimer((prev) => {
				if (prev <= 1) {
					if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
					timerIntervalRef.current = null;
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	}, []);

	// ---------------------------------------------------------------
	// RECAPTCHA VERIFIER MANAGEMENT
	// ---------------------------------------------------------------

	/**
	 * Create a fresh RecaptchaVerifier on the container element.
	 * Always clears any previous verifier first to avoid "already rendered" errors.
	 */
	const createRecaptchaVerifier = useCallback(() => {
		// 1. Clear existing verifier
		if (recaptchaVerifierRef.current) {
			try { recaptchaVerifierRef.current.clear(); } catch (_) { /* ignore */ }
			recaptchaVerifierRef.current = null;
		}

		// 2. Get or create the container element
		let container = document.getElementById(recaptchaContainerId);
		if (!container) {
			container = document.createElement('div');
			container.id = recaptchaContainerId;
			container.style.display = 'none';
			document.body.appendChild(container);
		}

		// 3. Create fresh verifier
		const verifier = new RecaptchaVerifier(auth, container, {
			size: 'invisible',
			callback: () => { /* reCAPTCHA solved */ },
		});
		recaptchaVerifierRef.current = verifier;
		return verifier;
	}, [recaptchaContainerId]);

	// ---------------------------------------------------------------
	// CLEANUP ON UNMOUNT
	// ---------------------------------------------------------------

	useEffect(() => {
		return () => {
			// Clear timer
			if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
			// Clear reCAPTCHA verifier
			if (recaptchaVerifierRef.current) {
				try { recaptchaVerifierRef.current.clear(); } catch (_) { /* ignore */ }
			}
		};
	}, []);

	// ---------------------------------------------------------------
	// SEND OTP
	// ---------------------------------------------------------------

	/**
	 * Send an OTP to the given phone number via Firebase.
	 * @param phoneNumber - Full international phone (e.g. "+919876543210")
	 * @returns true if OTP was sent successfully, false otherwise
	 */
	const sendOtp = useCallback(async (phoneNumber: string): Promise<boolean> => {
		setSending(true);
		setError('');

		try {
			const verifier = createRecaptchaVerifier();
			const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
			confirmationResultRef.current = result;
			lastPhoneRef.current = phoneNumber;
			setOtpSent(true);
			startResendTimer();
			return true;
		} catch (err: any) {
			console.error('[useFirebaseOtp] sendOtp error:', err);
			// Provide user-friendly error messages
			const code = err?.code || '';
			if (code === 'auth/invalid-phone-number') {
				setError('Invalid phone number format. Please check and try again.');
			} else if (code === 'auth/too-many-requests') {
				setError('Too many attempts. Please wait a few minutes and try again.');
			} else if (code === 'auth/quota-exceeded') {
				setError('SMS quota exceeded. Please try again later.');
			} else {
				setError(err.message || 'Failed to send OTP. Please try again.');
			}
			// reCAPTCHA is consumed on failure, clear it so next attempt starts fresh
			if (recaptchaVerifierRef.current) {
				try { recaptchaVerifierRef.current.clear(); } catch (_) { /* ignore */ }
				recaptchaVerifierRef.current = null;
			}
			return false;
		} finally {
			setSending(false);
		}
	}, [createRecaptchaVerifier, startResendTimer]);

	// ---------------------------------------------------------------
	// VERIFY OTP
	// ---------------------------------------------------------------

	/**
	 * Verify the 6-digit OTP code and return the Firebase ID token.
	 * @param code - The 6-digit OTP
	 * @returns Firebase ID token string on success, null on failure
	 */
	const verifyOtp = useCallback(async (code: string): Promise<string | null> => {
		if (!confirmationResultRef.current) {
			setError('OTP session expired. Please request a new code.');
			return null;
		}

		setVerifying(true);
		setError('');

		try {
			const credential = await confirmationResultRef.current.confirm(code);
			const idToken = await credential.user.getIdToken();
			return idToken;
		} catch (err: any) {
			console.error('[useFirebaseOtp] verifyOtp error:', err);
			const code_err = err?.code || '';
			if (code_err === 'auth/invalid-verification-code') {
				setError('Invalid OTP. Please check and try again.');
			} else if (code_err === 'auth/code-expired') {
				setError('OTP has expired. Please request a new code.');
			} else {
				setError('Verification failed. Please try again.');
			}
			return null;
		} finally {
			setVerifying(false);
		}
	}, []);

	// ---------------------------------------------------------------
	// RESEND OTP
	// ---------------------------------------------------------------

	/**
	 * Resend OTP to the last phone number used.
	 * Blocked if cooldown timer is still active.
	 * @returns true if OTP was resent successfully
	 */
	const resendOtp = useCallback(async (): Promise<boolean> => {
		if (resendTimer > 0) return false;
		if (!lastPhoneRef.current) {
			setError('No phone number to resend to.');
			return false;
		}
		return sendOtp(lastPhoneRef.current);
	}, [resendTimer, sendOtp]);

	// ---------------------------------------------------------------
	// UTILITY METHODS
	// ---------------------------------------------------------------

	/** Clear the current error */
	const resetError = useCallback(() => setError(''), []);

	/** Full reset — clears everything back to initial state */
	const reset = useCallback(() => {
		setError('');
		setOtpSent(false);
		setSending(false);
		setVerifying(false);
		setResendTimer(0);
		confirmationResultRef.current = null;
		lastPhoneRef.current = '';
		if (timerIntervalRef.current) {
			clearInterval(timerIntervalRef.current);
			timerIntervalRef.current = null;
		}
		// Clear reCAPTCHA for clean state
		if (recaptchaVerifierRef.current) {
			try { recaptchaVerifierRef.current.clear(); } catch (_) { /* ignore */ }
			recaptchaVerifierRef.current = null;
		}
	}, []);

	return {
		sending,
		verifying,
		resendTimer,
		error,
		otpSent,
		recaptchaContainerId,
		sendOtp,
		verifyOtp,
		resendOtp,
		resetError,
		reset,
	};
}
