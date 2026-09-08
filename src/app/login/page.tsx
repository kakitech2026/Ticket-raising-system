"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorMessage } from "@/lib/client-api";
import { LogIn } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
              <Link
                href="/reset-password"
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                Forgot password?
              </Link>
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
    </main>
  );
}