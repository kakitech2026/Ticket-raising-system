import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Users as UsersIcon, Mail, Briefcase, Tag } from "lucide-react";
import { DeleteUserButton } from "@/components/DeleteUserButton";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      _count: {
        select: {
          tickets: true,
          assigned: true,
        },
      },
    },
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "TECH": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default: return "bg-neutral-800 text-neutral-300 border-neutral-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Users</h1>
          <p className="text-neutral-400 mt-1">Manage and view all users in the system.</p>
        </div>
        <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
          <UsersIcon className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-sm font-medium text-neutral-400">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4 text-center">Tickets Created</th>
                <th className="px-6 py-4 text-center">Tickets Assigned</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-neutral-200">{user.name}</span>
                      <span className="text-sm text-neutral-500 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> {user.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Briefcase className="w-4 h-4 text-neutral-500" />
                      {user.departmentId || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-800 text-neutral-300 font-medium">
                      {user._count.tickets}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-800 text-neutral-300 font-medium">
                      {user._count.assigned}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DeleteUserButton userId={user.id} userName={user.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="p-8 text-center text-neutral-500">
            No users found.
          </div>
        )}
      </div>
    </div>
  );
}
