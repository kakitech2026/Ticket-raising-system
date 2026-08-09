"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { Search, Download, Filter } from "lucide-react";

export function TicketFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [query, setQuery] = useState(searchParams.get("q") || "");

  // Update URL function
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (key: string, value: string) => {
    const qs = createQueryString(key, value);
    // Force a hard navigation to bypass Next.js client router cache issues
    window.location.href = qs ? `${pathname}?${qs}` : pathname;
  };

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const urlQuery = searchParams.get("q") || "";
      if (query !== urlQuery && (query.length === 0 || query.length >= 3 || searchParams.has("q"))) {
        const qs = createQueryString("q", query);
        window.location.href = qs ? `${pathname}?${qs}` : pathname;
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, createQueryString, router, searchParams]);

  const handleExport = () => {
    // We will hit our export API with the current search params
    const currentQueryString = searchParams.toString();
    window.location.href = `/api/export-csv${currentQueryString ? `?${currentQueryString}` : ""}`;
  };

  return (
    <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center mb-6">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Search tickets..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>
      
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-500" />
          <select
            value={searchParams.get("status") || ""}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="NEEDS_APPROVAL">Needs Approval</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="RE_REVIEW">Re-Review</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <select
          value={searchParams.get("priority") || ""}
          onChange={(e) => handleFilterChange("priority", e.target.value)}
          className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>

        <select
          value={searchParams.get("department") || ""}
          onChange={(e) => handleFilterChange("department", e.target.value)}
          className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Departments</option>
          <option value="IT">IT</option>
          <option value="HR">HR</option>
          <option value="FACILITIES">Facilities</option>
          <option value="FINANCE">Finance</option>
        </select>

        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors ml-auto md:ml-2 whitespace-nowrap"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>
    </div>
  );
}
