"use client";

import { ApiPostResponse } from "@src/hooks/commons/useMutationData";
import { api } from "@src/lib/axios";
import { auth } from "@src/lib/firebase";
import { FirebaseError } from "firebase/app";
import { getIdToken, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";

export default function GoogleLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      // The signed-in user info.
      const user = result.user;
      const token = await getIdToken(user);

      console.log("Google sign-in successful:", { user });

      // Send token and user details to your backend using axios
      const backendResponse = await api.post<ApiPostResponse>(
        "/auth/firebase",
        {
          // The request body
          roleType: 2,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const responseData = backendResponse.data?.data as {
        user: {
          id: number;
          name: string;
          email: string;
          role_type: number;
        };
      };
      const User = responseData.user;
      const Token = backendResponse.data?.misc?.auth as {
        access_token?: string;
      };

      if (Token?.access_token) {
        localStorage.setItem("authToken", Token.access_token);
        router.push("/dashboard");
      }
      if (User) localStorage.setItem("user", JSON.stringify(User));
      console.log("Backend response:", backendResponse.data.misc);

      // You can handle successful login here, e.g., redirect or update global state
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        // Handle Firebase-specific errors
        console.error("Google sign-in error:", {
          code: error.code,
          message: error.message,
        });
        setError(error.message);
      } else if (error instanceof Error) {
        console.error("An error occurred:", error.message);
        setError(error.message);
      } else {
        // Handle other kinds of errors
        console.error("An unexpected error occurred:", error);
        setError("An unexpected error occurred during sign-in.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button
        onClick={signInWithGoogle}
        disabled={loading}
        variant="outline"
        className="w-full rounded-3xl py-3">
        <svg className="w-5 h-5" viewBox="0 0 48 48">
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          <path fill="none" d="M0 0h48v48H0z"></path>
        </svg>
        <span>{loading ? "Signing in..." : "Sign in with Google"}</span>
      </Button>
    </>
  );
}
