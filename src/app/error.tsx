"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Log client-side error to telemetry/console
    console.error("[App Error Boundary]:", error);
  }, [error]);

  const errorReference = error.digest || (typeof error.message === "string" ? error.message.slice(0, 80) : "ERR_RUNTIME");

  function copyErrorRef() {
    navigator.clipboard.writeText(`Error Reference: ${errorReference}\nMessage: ${error.message}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6 py-16">
      <div className="w-full max-w-lg text-center space-y-6">
        {/* Visual Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-xl animate-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl">
            <AlertTriangle className="h-10 w-10 text-rose-400" />
          </div>
        </div>

        {/* Heading & Friendly Copy */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-rose-400">
            System Notice
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Something Went Wrong
          </h1>
          <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            We encountered an unexpected problem while processing this request. Our team has been logged of the incident.
          </p>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="btn bg-indigo-600 hover:bg-indigo-500 inline-flex items-center gap-2 text-sm px-5 py-2.5 shadow-lg shadow-indigo-950/40"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/"
            className="btn bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 inline-flex items-center gap-2 text-sm px-5 py-2.5"
          >
            <Home className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>

        {/* Collapsible IT / Diagnostics Details */}
        <div className="pt-4 border-t border-neutral-800/80 text-left">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition select-none"
          >
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>Technical Details &amp; Error Reference</span>
          </button>

          {showDetails && (
            <div className="mt-3 p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/90 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-neutral-400">
                <span>Incident Reference:</span>
                <button
                  type="button"
                  onClick={copyErrorRef}
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy Ref"}</span>
                </button>
              </div>
              <p className="text-neutral-200 break-all select-all font-semibold">
                {errorReference}
              </p>
              {error.message && (
                <p className="text-neutral-400 text-[11px] pt-1 border-t border-neutral-800 break-words font-sans">
                  {error.message}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
