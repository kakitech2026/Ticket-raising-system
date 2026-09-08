"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { requestJson, jsonOptions, errorMessage } from "@/lib/client-api";
import { KeyRound, Mail, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ResetPassword() {
  const [token, setToken] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Check hash or query param for token
    const hashToken = new URLSearchParams(window.location.hash.slice(1)).get("token");
    const searchToken = new URLSearchParams(window.location.search).get("token");
    if (hashToken || searchToken) {
      setToken(hashToken || searchToken);
    }
  }, []);

  async function handleRequestReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email")).trim().toLowerCase();

    try {
      await requestJson(
        "/api/reset-password",
        jsonOptions("POST", { email })
      );
      setEmailSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleExecuteReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const pwd = String(formData.get("password"));
    const confirm = String(formData.get("confirm"));

    try {
      if (pwd !== confirm) {
        throw new Error("Passwords do not match");
      }
      if (!token) {
        throw new Error("Reset token is missing. Please request a new link.");
      }

      await requestJson(
        "/api/reset-password",
        jsonOptions("POST", { token, password: pwd })
      );
      window.history.replaceState(null, "", "/reset-password");
      setResetDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {resetDone
              ? "Password Reset Complete"
              : token
              ? "Choose a New Password"
              : "Reset Your Password"}
          </h1>
          <p className="text-sm text-neutral-400">
            {resetDone
              ? "Your password has been successfully updated."
              : token
              ? "Enter and confirm your new secure account password."
              : "Enter your registered email address and we'll send you a password reset link."}
          </p>
        </div>

        {resetDone ? (
          <div className="panel space-y-4 text-center">
            <div className="flex justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <p className="text-sm text-neutral-300">
              Your password has been updated and all previous active sessions have been safely revoked.
            </p>
            <Link href="/login" className="btn w-full bg-indigo-600 hover:bg-indigo-500 block">
              Sign In to Your Account
            </Link>
          </div>
        ) : emailSent ? (
          <div className="panel space-y-4 text-center">
            <div className="flex justify-center">
              <Mail className="w-10 h-10 text-indigo-400 animate-bounce" />
            </div>
            <p className="text-sm text-neutral-300">
              If an account is associated with that email, a password reset link has been dispatched. Please check your inbox and follow the instructions.
            </p>
            <div className="pt-2">
              <Link href="/login" className="btn bg-neutral-800 hover:bg-neutral-700 w-full block">
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : token ? (
          <form className="panel space-y-4" onSubmit={handleExecuteReset}>
            {error && (
              <p role="alert" className="text-sm text-rose-400">
                {error}
              </p>
            )}
            <label className="block">
              <span className="text-sm font-medium text-neutral-300">New Password</span>
              <input
                className="field mt-1"
                name="password"
                type="password"
                required
                minLength={12}
                maxLength={72}
                autoComplete="new-password"
                placeholder="At least 12 characters"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-neutral-300">Confirm Password</span>
              <input
                className="field mt-1"
                name="confirm"
                type="password"
                required
                minLength={12}
                maxLength={72}
                autoComplete="new-password"
                placeholder="Re-enter password"
              />
            </label>
            <button className="btn w-full bg-indigo-600 hover:bg-indigo-500" disabled={busy}>
              {busy ? "Saving new password..." : "Update Password"}
            </button>
          </form>
        ) : (
          <form className="panel space-y-4" onSubmit={handleRequestReset}>
            {error && (
              <p role="alert" className="text-sm text-rose-400">
                {error}
              </p>
            )}
            <label className="block">
              <span className="text-sm font-medium text-neutral-300">Email Address</span>
              <input
                className="field mt-1"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@company.com"
              />
            </label>
            <button className="btn w-full bg-indigo-600 hover:bg-indigo-500" disabled={busy}>
              {busy ? "Sending link..." : "Send Reset Link"}
            </button>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5 text-xs text-neutral-400 space-y-1">
              <p className="font-semibold text-neutral-200">Staff &amp; Employee Notice:</p>
              <p>
                If you do not receive an automated email, contact your <strong>System Administrator</strong> to generate an instant one-time reset link from the User Management panel.
              </p>
            </div>

            <div className="text-center pt-1">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}