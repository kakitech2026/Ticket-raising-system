"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X } from "lucide-react";
import { useState, useTransition, useEffect } from "react";

export function TicketFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "";
  const currentPriority = searchParams.get("priority") || "";

  const [search, setSearch] = useState(currentSearch);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== currentSearch) {
        updateFilters({ search });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const updateFilters = (updates: { search?: string; status?: string; priority?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    startTransition(() => {
      router.push(`/tickets?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    setSearch("");
    startTransition(() => {
      router.push("/tickets");
    });
  };

  const hasActiveFilters = currentSearch || currentStatus || currentPriority;

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
        <input 
          type="text"
          placeholder="Search tickets by title or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
        />
        {isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={currentStatus}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="appearance-none bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 px-4 py-2.5 pr-10 rounded-xl text-neutral-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="NEEDS_APPROVAL">Needs Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_TESTING">In Testing</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Filter className="w-4 h-4 text-neutral-500" />
          </div>
        </div>

        <div className="relative">
          <select
            value={currentPriority}
            onChange={(e) => updateFilters({ priority: e.target.value })}
            className="appearance-none bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 px-4 py-2.5 pr-10 rounded-xl text-neutral-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Filter className="w-4 h-4 text-neutral-500" />
          </div>
        </div>

        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className="p-2.5 bg-neutral-900 border border-neutral-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 rounded-xl text-neutral-400 transition-colors"
            title="Clear filters"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
