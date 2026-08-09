"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Edit } from "lucide-react";
import Link from "next/link";

export function ArticleActions({ articleId }: { articleId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this article? This action cannot be undone.")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/kb/${articleId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/kb");
        router.refresh();
      } else {
        alert("Failed to delete article");
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />;
  }

  return (
    <div className="flex gap-3 mt-6">
      <Link href={`/kb/${articleId}/edit`} className="inline-flex items-center px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm font-medium transition-colors border border-neutral-700">
        <Edit className="w-4 h-4 mr-2" />
        Edit Article
      </Link>
      <button onClick={handleDelete} className="inline-flex items-center px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-500 rounded-lg text-sm font-medium transition-colors border border-red-500/20">
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </button>
    </div>
  );
}
