import Link from "next/link";
import { Compass, Home, Ticket, BookOpen, PlusCircle, ArrowLeft } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-8">
      {/* Visual Icon */}
      <div className="relative inline-flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl">
          <Compass className="h-10 w-10 text-indigo-400" />
        </div>
      </div>

      {/* Heading & Context */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
          Not Found
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Item or Page Not Found
        </h1>
        <p className="text-sm text-neutral-400 max-w-md mx-auto">
          The requested ticket, project, or dashboard section could not be located. It might have been deleted, archived, or you may lack access permissions.
        </p>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        <Link
          href="/"
          className="group flex items-start gap-3 p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-850 hover:border-neutral-700 transition"
        >
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition">
            <Home className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition">
              Dashboard
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Return to your personal workspace.
            </p>
          </div>
        </Link>

        <Link
          href="/tickets"
          className="group flex items-start gap-3 p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-850 hover:border-neutral-700 transition"
        >
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition">
            <Ticket className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition">
              All Tickets
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Browse the full tickets queue.
            </p>
          </div>
        </Link>

        <Link
          href="/kb"
          className="group flex items-start gap-3 p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-850 hover:border-neutral-700 transition"
        >
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition">
              Knowledge Base
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Find help and documentation.
            </p>
          </div>
        </Link>

        <Link
          href="/tickets/new"
          className="group flex items-start gap-3 p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-850 hover:border-neutral-700 transition"
        >
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white group-hover:text-amber-400 transition">
              New Ticket
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Create a brand new request.
            </p>
          </div>
        </Link>
      </div>

      <div>
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Ticket List
        </Link>
      </div>
    </div>
  );
}
