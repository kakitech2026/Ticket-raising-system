"use client";

import { useSession } from "next-auth/react";
import { Bell, Search, UserCircle } from "lucide-react";
import { usePathname } from "next/navigation";

export function Topbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Basic breadcrumbs based on pathname
  const routeName = pathname === "/" 
    ? "Dashboard" 
    : pathname.split("/").filter(Boolean).map(segment => segment.charAt(0).toUpperCase() + segment.slice(1)).join(" / ");

  return (
    <header className="h-16 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-neutral-100">{routeName}</h1>
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tickets..."
            className="w-64 bg-neutral-800/50 border border-neutral-700 rounded-full pl-9 pr-4 py-1.5 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="relative text-neutral-400 hover:text-neutral-200 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-indigo-500 rounded-full border border-neutral-900"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-6 border-l border-neutral-800">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-neutral-200">{session?.user?.name || "Loading..."}</p>
            <p className="text-xs text-neutral-500">{session?.user?.role || "USER"}</p>
          </div>
          <UserCircle className="w-8 h-8 text-neutral-400" />
        </div>
      </div>
    </header>
  );
}
