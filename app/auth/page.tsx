"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { track } from "@/lib/mixpanel";

export const dynamic = "force-dynamic";

const GIM_EMAIL_DOMAIN = "@gim.ac.in";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { signUp } = useSignUp();
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const { signIn } = useSignIn();
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

  if (
    mode === "signup" &&
    !email.trim().toLowerCase().endsWith(GIM_EMAIL_DOMAIN)
  ) {
    toast.error(
      `GIM Bazaar is only for GIM students right now — please sign up with your ${GIM_EMAIL_DOMAIN} email address.`
    );
    return;
  }

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
              : "Enter your GIM email and we'll send you a reset code."}
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
            : `Create an account with your ${GIM_EMAIL_DOMAIN} email to start buying and selling`}
        </p>

        {!pendingVerification ? (<form onSubmit={handleSubmit} className="space-y-4">

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
      placeholder={mode === "signup" ? `you${GIM_EMAIL_DOMAIN}` : undefined}
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
