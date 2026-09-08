"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorMessage } from "@/lib/client-api";
import { LogIn, ShieldAlert, X } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Sign in to Tickety
          </h1>
          <p className="text-sm text-neutral-400">
            Enter your credentials to access your support workspace.
          </p>
        </div>

        <form
          className="panel space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fields = new FormData(e.currentTarget);
            setBusy(true);
            setError("");
            try {
              const result = await signIn("credentials", {
                email: String(fields.get("email")).trim().toLowerCase(),
                password: String(fields.get("password")),
                redirect: false,
              });
              if (result?.error) {
                throw new Error(
                  result.error === "CredentialsSignin"
                    ? "Email or password is incorrect"
                    : result.error
                );
              }
              router.push("/");
              router.refresh();
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          {error && (
            <p role="alert" className="text-sm text-rose-400">
              {error}
            </p>
          )}

          <label className="block">
            <span className="text-sm font-medium text-neutral-300">Email Address</span>
            <input
              className="field mt-1"
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="name@company.com"
            />
          </label>

          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-300">Password</span>
              <button
                type="button"
                onClick={() => setShowHelp(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                Forgot password? Contact Admin
              </button>
            </div>
            <input
              className="field mt-1"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              maxLength={72}
              placeholder="Enter your password"
            />
          </label>

          <button
            className="btn w-full bg-indigo-600 hover:bg-indigo-500 font-medium"
            disabled={busy}
          >
            {busy ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-neutral-400">
            Don&apos;t have an account yet?{" "}
            <Link className="text-indigo-400 hover:text-indigo-300 font-medium" href="/register">
              Create employee account &rarr;
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Guidance Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                <ShieldAlert className="w-5 h-5" />
                <span>Password Reset Help</span>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-neutral-300 leading-relaxed">
              <p>
                <strong>For Employees &amp; Staff:</strong>
                <br />
                Please reach out directly to your <strong>System Administrator</strong> to generate a secure, one-time password reset link for your account.
              </p>
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-400 space-y-1">
                <p className="font-medium text-neutral-200">How Admins create your link:</p>
                <p>1. Admin logs into Tickety.</p>
                <p>2. Goes to <strong>User Management</strong> (`/users`).</p>
                <p>3. Clicks <strong>Reset Password</strong> next to your name and gives you the link.</p>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="btn w-full bg-indigo-600 hover:bg-indigo-500 text-xs py-2"
              >
                Got it, close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}