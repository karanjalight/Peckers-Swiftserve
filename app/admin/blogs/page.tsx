"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SidebarLayout from "@/components/layouts/SidebarLayout";
import { supabase } from "@/lib/supabase";
import { Search, Plus, Eye, Edit, Trash2 } from "lucide-react";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  cover_image_url?: string;
  status: string;
  view_count: number;
  published_at?: string;
  created_at: string;
  tags?: string[];
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (err: any) {
      console.error("Error fetching blogs:", err);
      setError(err.message || "Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  const deleteBlog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;

    try {
      const { error } = await supabase.from("blogs").delete().eq("id", id);

      if (error) throw error;

      setBlogs(blogs.filter((blog) => blog.id !== id));
      alert("Blog deleted successfully");
    } catch (err: any) {
      console.error("Error deleting blog:", err);
      alert(err.message || "Failed to delete blog");
    }
  };

  // Filter and sort blogs
  const filteredBlogs = blogs
    .filter((blog) => {
      const matchesSearch =
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || blog.status === filterStatus;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "views":
          return (b.view_count || 0) - (a.view_count || 0);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-700";
      case "draft":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const statuses = ["all", "published", "draft"];

  return (
    <SidebarLayout title="Blogs">
      <div className="flex-1 space-y-6 p-2 pt-6 bg-white min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Blogs</h1>
            <p className="text-slate-600 mt-1">Manage your blog posts</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/admin/blogs/create"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors font-medium round"
            >
              <Plus className="w-4 h-4" />
              Create Blog
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-300 rounded-lg p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search blogs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="views">Most Views</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {filteredBlogs.length}
                </span>{" "}
                blogs found
              </div>
            </div>
          </div>
        </div>

        {/* Blogs Table */}
        <div className="bg-white border border-slate-300 rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Loading blogs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchBlogs}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-50">
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Blog Post
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Slug
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Published
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Views
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBlogs.map((blog) => (
                    <tr
                      key={blog.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {blog.cover_image_url && (
                            <img
                              src={blog.cover_image_url}
                              alt={blog.title}
                              className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                            />
                          )}
                          <div className="max-w-md">
                            <p className="font-medium text-slate-900 truncate">
                              {blog.title}
                            </p>
                            {blog.excerpt && (
                              <p className="text-xs text-slate-500 truncate mt-1">
                                {blog.excerpt.substring(0, 60)}...
                              </p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">
                              {formatDate(blog.created_at)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs">
                        <span className="truncate block">{blog.slug}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            blog.status
                          )}`}
                        >
                          {blog.status.charAt(0).toUpperCase() +
                            blog.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {blog.published_at
                          ? formatDate(blog.published_at)
                          : "—"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {blog.view_count || 0}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/blogs/${blog.slug}`}
                            target="_blank"
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                            title="View blog"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/blogs/edit/${blog.slug}`}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                            title="Edit blog"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => deleteBlog(blog.id)}
                            className="p-1 hover:bg-red-100 rounded-lg transition-colors text-slate-600 hover:text-red-600"
                            title="Delete blog"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && filteredBlogs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600 text-sm">
                No blogs found. Try adjusting your filters or create a new blog.
              </p>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {!loading && !error && blogs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-300 rounded-lg p-4">
              <p className="text-sm text-slate-600">Total Blogs</p>
              <p className="text-2xl font-bold text-slate-900">{blogs.length}</p>
            </div>
            <div className="bg-white border border-slate-300 rounded-lg p-4">
              <p className="text-sm text-slate-600">Published</p>
              <p className="text-2xl font-bold text-green-600">
                {blogs.filter((b) => b.status === "published").length}
              </p>
            </div>
            <div className="bg-white border border-slate-300 rounded-lg p-4">
              <p className="text-sm text-slate-600">Drafts</p>
              <p className="text-2xl font-bold text-yellow-600">
                {blogs.filter((b) => b.status === "draft").length}
              </p>
            </div>
            <div className="bg-white border border-slate-300 rounded-lg p-4">
              <p className="text-sm text-slate-600">Total Views</p>
              <p className="text-2xl font-bold text-blue-600">
                {blogs.reduce((sum, b) => sum + (b.view_count || 0), 0)}
              </p>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}