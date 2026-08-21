"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useSignUp, useClerk } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { track } from "@/lib/mixpanel";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { signUp } = useSignUp();
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const { signIn } = useSignIn();
  const clerk = useClerk();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [resendCooldown, setResendCooldown] = useState(0);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function ensureProfile(clerkUserId: string, userEmail: string) {
    try {
      const res = await fetch("/api/profile/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkUserId, email: userEmail }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        console.error("PROFILE ENSURE ERROR:", error);
      }
    } catch (error) {
      console.error("PROFILE ENSURE ERROR:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  setLoading(true);

  try {
    if (mode === "signup") {
      const { error } = await signUp.password({
  emailAddress: email,
  password,
  username,
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

        if (signUp.createdUserId) {
          await ensureProfile(signUp.createdUserId, email);
          track("Sign Up Completed", { method: "email" });
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

      track("Sign In Completed", { method: "email" });
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

async function handleGoogleSignIn() {
  try {
    track("Sign In Started", { method: "google" });

    // Deliberately using the classic Clerk client (via useClerk()) instead of
    // the `useSignIn()` Future-API resource here. The Future resource's
    // `signIn.sso()` routes through Clerk's Account Portal domain
    // (accounts.gimbazar.in) as an intermediate hop, and that domain has no
    // DNS record for this instance — Clerk's own dashboard confirms "Account
    // portal is not supported with your current domain configuration."
    // `clerk.client.signIn.authenticateWithRedirect()` redirects straight to
    // Google with no detour through that broken domain — confirmed working
    // end-to-end against production (redirects to Google's real consent
    // screen with the correct client ID and callback URL).
    await clerk.client.signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/auth/callback",
      redirectUrlComplete: "/",
    });
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Google sign-in failed"
    );
  }
}

useEffect(() => {
  if (resendCooldown <= 0) return;

  const timer = setInterval(() => {
    setResendCooldown((c) => (c <= 1 ? 0 : c - 1));
  }, 1000);

  return () => clearInterval(timer);
}, [resendCooldown]);

async function handleResendCode() {
  if (resendCooldown > 0 || !signUp) return;
  setLoading(true);

  try {
    const { error } = await signUp.verifications.sendEmailCode();

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("New code sent! Check your email (and spam/junk folder).");
    setResendCooldown(30);
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Could not resend code"
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
  console.error("VERIFY ERROR:", error);
  toast.error(error.message);
  return;
}

console.log("SIGNUP STATUS AFTER OTP:", signUp.status);
console.log("SIGNUP MISSING FIELDS:", signUp.missingFields);
console.log("SIGNUP UNVERIFIED FIELDS:", signUp.unverifiedFields);
console.log("SIGNUP REQUIRED FIELDS:", signUp.requiredFields);
console.log("SIGNUP OBJECT:", signUp);

if (signUp.status === "complete") {
      const { error: finalizeError } = await signUp.finalize();

      if (finalizeError) {
        toast.error(finalizeError.message);
        return;
      }

      if (signUp.createdUserId) {
        await ensureProfile(signUp.createdUserId, email);
        track("Sign Up Completed", { method: "email" });
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

  function openForgotPassword() {
    setResetEmail(email);
    setResetCode("");
    setNewPassword("");
    setResetCodeSent(false);
    setShowForgotPassword(true);
  }

  function closeForgotPassword() {
    setShowForgotPassword(false);
    setResetCodeSent(false);
    setResetCode("");
    setNewPassword("");
  }

  async function handleSendResetCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: createError } = await signIn.create({
        identifier: resetEmail,
      });

      if (createError) {
        toast.error(createError.message);
        return;
      }

      const { error } = await signIn.resetPasswordEmailCode.sendCode();

      if (error) {
        toast.error(error.message);
        return;
      }

      setResetCodeSent(true);
      toast.success("Reset code sent! Check your email.");
      track("Password Reset Requested");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not send reset code"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: verifyError } =
        await signIn.resetPasswordEmailCode.verifyCode({ code: resetCode });

      if (verifyError) {
        toast.error(verifyError.message);
        return;
      }

      const { error: submitError } =
        await signIn.resetPasswordEmailCode.submitPassword({
          password: newPassword,
        });

      if (submitError) {
        toast.error(submitError.message);
        return;
      }

      if (signIn.status === "complete") {
        const { error: finalizeError } = await signIn.finalize();

        if (finalizeError) {
          toast.error(finalizeError.message);
          return;
        }

        track("Password Reset Completed");
        toast.success("Password reset! You're signed in.");
        router.push("/");
        return;
      }

      toast.error("Could not reset your password. Please try again.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Password reset failed"
      );
    } finally {
      setLoading(false);
    }
  }

  if (showForgotPassword) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full max-w-sm">
          <h1 className="mb-1 text-2xl font-semibold tracking-tight">
            Reset your password
          </h1>
          <p className="mb-8 text-sm text-stone-500">
            {resetCodeSent
              ? "Enter the code we emailed you and choose a new password."
              : "Enter your email and we'll send you a reset code."}
          </p>

          {!resetCodeSent ? (
            <form onSubmit={handleSendResetCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700">
                  Email
                </label>

                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send reset code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700">
                  Reset Code
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  placeholder="Enter the code from your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700">
                  New Password
                </label>

                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? "Resetting..." : "Reset password"}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-stone-500">
            <button
              onClick={closeForgotPassword}
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    );
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

        {!pendingVerification ? (
        <>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11C3.24 21.3 7.28 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.62H1.26A11.96 11.96 0 000 12c0 1.94.46 3.77 1.26 5.38l4.01-3.11z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.26 6.62l4.01 3.11C6.22 6.86 8.87 4.75 12 4.75z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-xs font-medium text-stone-400">or</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

  {mode === "signup" && (
    <div>
      <label className="block text-sm font-medium text-stone-700">
        Username
      </label>

      <input
        type="text"
        required
        minLength={4}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        placeholder="Choose a username"
      />
    </div>
  )}

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
  <div className="flex items-center justify-between">
    <label className="block text-sm font-medium text-stone-700">
      Password
    </label>

    {mode === "login" && (
      <button
        type="button"
        onClick={openForgotPassword}
        className="text-xs font-medium text-brand-600 hover:text-brand-700"
      >
        Forgot password?
      </button>
    )}
  </div>

  <div className="relative mt-1">
    <input
      type={showPassword ? "text" : "password"}
      required
      minLength={6}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className="w-full rounded-lg border border-stone-300 px-3 py-2 pr-16 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
    />

    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-500 hover:text-stone-700"
    >
      {showPassword ? "Hide" : "Show"}
    </button>
  </div>
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
        </>

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

    <p className="text-center text-sm text-stone-500">
      Didn&apos;t get a code?{" "}
      <button
        type="button"
        onClick={handleResendCode}
        disabled={resendCooldown > 0 || loading}
        className="font-medium text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:text-stone-400"
      >
        {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
      </button>
    </p>
  </form>
)}

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
