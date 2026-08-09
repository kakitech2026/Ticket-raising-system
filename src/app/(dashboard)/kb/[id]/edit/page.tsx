"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/kb")
      .then(res => res.json())
      .then(data => {
        const article = data.find((a: any) => a.id === id);
        if (article) {
          setTitle(article.title);
          setContent(article.content);
        } else {
          setError("Article not found");
        }
        setInitialLoading(false);
      })
      .catch(() => setInitialLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/kb/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (!res.ok) {
        throw new Error("Failed to update article");
      }

      router.push(`/kb/${id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-8 text-center text-neutral-500">Loading editor...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href={`/kb/${id}`} className="inline-flex items-center text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Article
        </Link>
        <h1 className="text-2xl font-bold text-neutral-100 mt-4">Edit Article</h1>
      </div>

      <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-neutral-300 mb-1.5">Article Title</label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="appearance-none block w-full px-4 py-2.5 border border-neutral-700 bg-neutral-800/50 rounded-lg shadow-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-neutral-300 mb-1.5">Content (Markdown supported)</label>
            <textarea
              id="content"
              required
              rows={15}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="appearance-none block w-full px-4 py-2.5 border border-neutral-700 bg-neutral-800/50 rounded-lg shadow-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 mr-4 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex justify-center items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
