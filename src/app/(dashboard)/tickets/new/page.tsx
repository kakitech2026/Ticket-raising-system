"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Image as ImageIcon, X } from "lucide-react";
import Link from "next/link";

export default function CreateTicketPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [department, setDepartment] = useState("IT");
  const [assigneeId, setAssigneeId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => setStaffUsers(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, priority, department, images, assigneeId: assigneeId || undefined }),
      });

      if (!res.ok) {
        throw new Error("Failed to create ticket");
      }

      router.push("/");
      router.refresh(); // Refresh server components
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-neutral-100 mt-4">Create New Ticket</h1>
        <p className="text-neutral-400 mt-1">Please fill in the details below to raise a new ticket.</p>
      </div>

      <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-neutral-300 mb-1.5">
              Title
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Unable to connect to VPN"
              className="appearance-none block w-full px-4 py-2.5 border border-neutral-700 bg-neutral-800/50 rounded-lg shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Priority
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="appearance-none block w-full px-4 py-2.5 border border-neutral-700 bg-neutral-800/50 rounded-lg shadow-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                >
                  <option value="LOW">Low - No immediate action needed</option>
                  <option value="MEDIUM">Medium - Normal queue</option>
                  <option value="HIGH">High - Urgent attention required</option>
                </select>
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Department
                </label>
                <select
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="appearance-none block w-full px-4 py-2.5 border border-neutral-700 bg-neutral-800/50 rounded-lg shadow-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                >
                  <option value="IT">IT Support</option>
                  <option value="HR">Human Resources</option>
                  <option value="FACILITIES">Facilities</option>
                  <option value="FINANCE">Finance</option>
                </select>
              </div>

              <div>
                <label htmlFor="assignee" className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Assign To
                </label>
                <select
                  id="assignee"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="appearance-none block w-full px-4 py-2.5 border border-neutral-700 bg-neutral-800/50 rounded-lg shadow-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                >
                  <option value="">Unassigned</option>
                  {staffUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-300 mb-1.5 mt-6">
              Description
            </label>
            <textarea
              id="description"
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide detailed steps to reproduce or explain the issue..."
              className="appearance-none block w-full px-4 py-2.5 border border-neutral-700 bg-neutral-800/50 rounded-lg shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Attachments (Screenshots)
            </label>
            <div className="mt-1 flex items-center gap-4">
              <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition-colors">
                <ImageIcon className="w-5 h-5 mr-2 text-neutral-400" />
                <span className="text-sm font-medium text-neutral-300">Upload Images</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden border border-neutral-700">
                    <img src={img} alt="preview" className="w-full h-24 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-neutral-900/80 rounded-full text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
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
              className="flex justify-center items-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-neutral-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : null}
              Submit Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
