"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TicketPlus, Ticket, Settings, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "My Tickets", href: "/tickets", icon: Ticket },
  { name: "Create Ticket", href: "/tickets/new", icon: TicketPlus },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex flex-col w-64 bg-neutral-900 border-r border-neutral-800 h-full">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
          <Ticket className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">Tickety</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
                isActive
                  ? "bg-indigo-600/10 text-indigo-400"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : "text-neutral-500"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-neutral-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-neutral-400 hover:bg-neutral-800 hover:text-red-400 transition-all w-full text-left"
        >
          <LogOut className="w-5 h-5 text-neutral-500" />
          Sign out
        </button>
      </div>
    </div>
  );
}
