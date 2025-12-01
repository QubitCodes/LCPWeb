"use client";

import { auth } from "@src/lib/firebase";
import { FirebaseError } from "firebase/app";
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";

export default function MobileLogin({ onBack }: { onBack: () => void }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null
  );
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // Use useRef to store the RecaptchaVerifier instance
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // --------------------------
  // Create reCAPTCHA instance (can be called multiple times to recreate)
  // --------------------------
  const setupRecaptcha = () => {
    // Ensure the container is available and no verifier currently exists
    if (!recaptchaVerifierRef.current && recaptchaContainerRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        recaptchaContainerRef.current,
        { size: "invisible" }
      );
      console.log("reCAPTCHA verifier created.");
    }
  };

  // --------------------------
  // Effect for initial setup and cleanup
  // --------------------------
  useEffect(() => {
    setupRecaptcha(); // Create on mount

    return () => {
      // Cleanup reCAPTCHA when component unmounts
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
        console.log("reCAPTCHA verifier cleared.");
      }
    };
  }, [auth]); // Depend on 'auth' if it could change, otherwise [] is fine if it's stable

  // --------------------------
  // Send OTP
  // --------------------------
  const sendOtp = async () => {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      setError(
        "Invalid phone number format. Please use the E.164 format (e.g., +919876543210)."
      );
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const appVerifier = recaptchaVerifierRef.current; // Use the ref here

      if (!appVerifier) {
        setError("reCAPTCHA not initialized. Please refresh the page.");
        setLoading(false);
        // Attempt to re-setup in case it somehow failed to initialize
        setupRecaptcha();
        return;
      }

      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmation(result);
      console.log("SMS sent. Confirmation result stored.");
    } catch (err: unknown) {
      console.error("Error during SMS sending:", err);
      if (err instanceof FirebaseError) {
        if (err.code === "auth/too-many-requests") {
          setError(
            "Too many requests. Please wait a while before trying again."
          );
        } else if (err.code === "auth/invalid-phone-number") {
          setError("The phone number provided is invalid.");
        } else if (err.code === "auth/captcha-check-failed") {
          setError("Security check failed. Please try again.");
        } else if (err.code === "auth/argument-error") {
          setError(
            "Invalid parameters provided. Please check the phone number format."
          );
        } else {
          setError(err.message); // Fallback to Firebase's message
        }
      } else {
        setError("An unexpected error occurred while sending the OTP.");
      }

      // **Important:** Clear the existing reCAPTCHA and recreate it
      // so a new challenge can be presented on the next attempt.
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null; // Ensure the ref is cleared
        console.log("reCAPTCHA verifier cleared after error.");
      }
      setupRecaptcha(); // Re-create a new verifier instance
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // Verify OTP (remains largely the same)
  // --------------------------
  const verifyOtp = async () => {
    try {
      setError(null);
      setLoading(true);
      if (confirmation) {
        const res = await confirmation.confirm(otp);
        console.log("Login successful! User:", res.user);
        // Handle successful login, e.g., redirect or update UI
        // Clear state after successful login for a clean slate
        setPhone("");
        setOtp("");
        setConfirmation(null);
        // Also clear reCAPTCHA as the flow is complete
        if (recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        }
        setupRecaptcha(); // Prepare a new one for future logins if needed
      } else {
        setError(
          "Confirmation result is not available. Please send OTP first."
        );
      }
    } catch (err: unknown) {
      console.error("Error confirming OTP:", err);
      if (err instanceof FirebaseError) {
        if (err.code === "auth/invalid-verification-code") {
          setError("The verification code is invalid or has expired.");
        } else {
          setError(err.message);
        }
      } else {
        setError("An unexpected error occurred while verifying the OTP.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* This div is where reCAPTCHA will attach itself (invisibly for size='invisible') */}
      <div ref={recaptchaContainerRef}></div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {!confirmation ? (
        <>
          <input
            value={phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPhone(e.target.value)
            }
            placeholder="+919876543210"
            className="border p-2 w-full rounded"
            disabled={loading}
          />

          <Button
            onClick={sendOtp}
            disabled={loading || !phone} // Disable if phone is empty
            className="w-full">
            {loading ? "Sending..." : "Send OTP"}
          </Button>
        </>
      ) : (
        <>
          <p className="text-green-600 text-sm">
            OTP sent successfully to {phone}
          </p>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            maxLength={6}
            className="border p-2 w-full rounded"
            autoFocus
          />

          <Button
            onClick={verifyOtp}
            disabled={loading || !otp} // Disable if OTP is empty
            className="w-full">
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>
        </>
      )}
      <Button
        type="button"
        variant="link"
        onClick={onBack}
        className="text-sm text-muted-foreground w-full">
        <ArrowLeft className="mr-2 h-4 w-4" /> All login options
      </Button>
    </div>
  );
}
