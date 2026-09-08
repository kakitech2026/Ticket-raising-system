import Link from "next/link";
import { Compass, Home, Ticket, BookOpen, PlusCircle, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Page Not Found | Tickety",
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6 py-16">
      <div className="w-full max-w-xl text-center space-y-8">
        {/* Visual Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl">
            <Compass className="h-12 w-12 text-indigo-400" />
          </div>
        </div>

        {/* Friendly Heading & Explanatory Copy */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Error 404
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Page Not Found
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 max-w-md mx-auto leading-relaxed">
            The page, ticket, or resource you are looking for doesn&apos;t exist, has been moved, or you may not have permission to view it.
          </p>
        </div>

        {/* Quick Action Navigation Hub */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <Link
            href="/"
            className="group flex items-start gap-3.5 p-4 rounded-xl border border-neutral-800 bg-neutral-900/70 hover:bg-neutral-850 hover:border-neutral-700 transition"
          >
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition">
                Return Home
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Head back to your main overview dashboard.
              </p>
            </div>
          </Link>

          <Link
            href="/tickets"
            className="group flex items-start gap-3.5 p-4 rounded-xl border border-neutral-800 bg-neutral-900/70 hover:bg-neutral-850 hover:border-neutral-700 transition"
          >
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition">
                View Tickets
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Browse your active, completed, and assigned requests.
              </p>
            </div>
          </Link>

          <Link
            href="/kb"
            className="group flex items-start gap-3.5 p-4 rounded-xl border border-neutral-800 bg-neutral-900/70 hover:bg-neutral-850 hover:border-neutral-700 transition"
          >
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition">
                Knowledge Base
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Search guides, answers, and troubleshooting articles.
              </p>
            </div>
          </Link>

          <Link
            href="/tickets/new"
            className="group flex items-start gap-3.5 p-4 rounded-xl border border-neutral-800 bg-neutral-900/70 hover:bg-neutral-850 hover:border-neutral-700 transition"
          >
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-amber-400 transition">
                Raise New Ticket
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Submit a new support or service inquiry.
              </p>
            </div>
          </Link>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Safety
          </Link>
        </div>
      </div>
    </main>
  );
}
