"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signUp } = useSignUp();
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const { signIn } = useSignIn();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);

  try {
    if (mode === "signup") {
      const { error } = await signUp.password({
        emailAddress: email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (signUp.status === "complete") {
        const { error: finalizeError } = await signUp.finalize();

        if (finalizeError) {
          toast.error(finalizeError.message);
          return;
        }

        router.push("/");
        return;
      }

      const { error: verificationError } =
        await signUp.verifications.sendEmailCode();

      if (verificationError) {
        toast.error(verificationError.message);
        return;
      }

      setPendingVerification(true);
      toast.success("Verification code sent to your email!");
      return;
    }

    const { error } = await signIn.password({
      emailAddress: email,
      password,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    if (signIn.status === "complete") {
      const { error: finalizeError } = await signIn.finalize();

      if (finalizeError) {
        toast.error(finalizeError.message);
        return;
      }

      router.push("/");
    }
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Something went wrong"
    );
  } finally {
    setLoading(false);
  }
}

async function handleVerifyCode(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);

  try {
    if (!signUp) {
      toast.error("Sign-up is not ready. Please try again.");
      return;
    }

    const { error } = await signUp.verifications.verifyEmailCode({
      code: verificationCode,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    if (signUp.status === "complete") {
      const { error: finalizeError } = await signUp.finalize();

      if (finalizeError) {
        toast.error(finalizeError.message);
        return;
      }

      router.push("/");
      return;
    }

    toast.error("Verification could not be completed.");
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Verification failed"
    );
  } finally {
    setLoading(false);
  }
}

  async function handleGoogleSignIn() {
  try {
    const { error } = await signIn.sso({
      strategy: "oauth_google",
      redirectUrl: "/auth/callback",
      redirectCallbackUrl: "/auth/callback",
    });

    if (error) {
      toast.error(error.message);
    }
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Google sign-in failed"
    );
  }
}

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">
          {mode === "login" ? "Welcome back" : "Join GIM Bazaar"}
        </h1>
        <p className="mb-8 text-sm text-stone-500">
          {mode === "login"
            ? "Sign in to browse and sell"
            : "Create an account to start buying and selling"}
        </p>

        {!pendingVerification ? (<form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>
      
) : (
  <form onSubmit={handleVerifyCode} className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-stone-700">
        Verification Code
      </label>

      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        required
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        placeholder="Enter the code from your email"
      />
    </div>

    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
    >
      {loading ? "Verifying..." : "Verify Email"}
    </button>
  </form>
)}

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-xs text-stone-400">or</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-stone-500">
          {mode === "login" ? "No account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
