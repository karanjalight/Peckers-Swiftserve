"use client";

import React, { useEffect, useState } from "react";
import { createBlog } from "@/lib/blogs";
import { useRouter } from "next/navigation";
import SidebarLayout from "@/components/layouts/SidebarLayout";
import dynamic from "next/dynamic";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Image as ImageIcon, 
  Tag, 
  FileText,
  Globe,
  Clock
} from "lucide-react";
import Link from "next/link";

export default function CreateBlogPage() {
  const router = useRouter();
  // Load editor only in browser
  const BlogEditor = dynamic(() => import("@/components/editor/BlogEditor"), {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
          <p className="text-slate-600">Loading editor...</p>
        </div>
      </div>
    ),
  });

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("draft");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function generateSlug(text: string) {
    const s = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setSlug(s);
  }

  const [authorId, setAuthorId] = useState<string | null>(null);

useEffect(() => {
  const storedUser = localStorage.getItem("user");
  const userData = storedUser ? JSON.parse(storedUser) : null;
  setAuthorId(userData?.id ?? null);
}, []);


async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!authorId) {
    setErrorMsg("User not logged in");
    return;
  }

  setLoading(true);
  setErrorMsg("");

  try {
    const blog = {
      title,
      slug,
      excerpt,
      content,
      cover_image_url: coverImageUrl,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((t) => t.length),
      status,
      author_id: authorId,
      published_at: status === "published" ? new Date().toISOString() : undefined,
    };

    await createBlog(blog);
    router.push("/admin/blogs");
  } catch (err: any) {
    setErrorMsg(err.message);
    console.error("Create blog error:", err);
  } finally {
    setLoading(false);
  }
}

  const tagArray = tags
    .split(",")
    .map((tag) => tag.trim())
    .filter((t) => t.length);

  return (
    <SidebarLayout title="Create Blog">
      <div className="flex-1  min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className=" px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/admin/blogs"
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Create New Blog Post
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Write and publish your blog content
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/admin/blogs")}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="blog-form"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {status === "published" ? "Publish" : "Save Draft"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className=" mx-auto px-6 pt-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-600 text-sm font-bold">!</span>
              </div>
              <div>
                <p className="font-medium text-red-900">Error creating blog</p>
                <p className="text-sm text-red-700 mt-1">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form id="blog-form" onSubmit={handleSubmit} className=" mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <FileText className="w-4 h-4" />
                  Title
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg transition-all"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    generateSlug(e.target.value);
                  }}
                  placeholder="Enter your blog title..."
                  required
                />
              </div>

              {/* Slug Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Globe className="w-4 h-4" />
                  URL Slug
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm transition-all"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="blog-post-url"
                    required
                  />
                  <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                    <span>Preview: yoursite.com/blogs/</span>
                    <span className="font-medium text-green-600">{slug || "slug"}</span>
                  </div>
                </div>
              </div>

              {/* Excerpt Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <FileText className="w-4 h-4" />
                  Excerpt
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary of your blog post (optional)"
                  rows={3}
                />
                <p className="text-xs text-slate-500 mt-2">
                  {excerpt.length}/160 characters
                </p>
              </div>

              {/* Content Editor Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <FileText className="w-4 h-4" />
                  Content
                  <span className="text-red-500">*</span>
                </label>
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <BlogEditor value={content} onChange={setContent} />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Clock className="w-4 h-4" />
                  Publication Status
                </label>
                <select
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white transition-all"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="draft">📝 Draft</option>
                  <option value="published">✅ Published</option>
                </select>
                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600">
                    {status === "published" ? (
                      <>
                        <span className="font-semibold text-green-600">Published posts</span> are immediately visible to readers.
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-yellow-600">Drafts</span> are only visible to you.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Cover Image Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <ImageIcon className="w-4 h-4" />
                  Cover Image
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                {coverImageUrl && (
                  <div className="mt-4 relative aspect-video rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={coverImageUrl}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-2">
                  Recommended: 1200x630px
                </p>
              </div>

              {/* Tags Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Tag className="w-4 h-4" />
                  Tags
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="technology, solar, lifestyle"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Separate tags with commas
                </p>
                {tagArray.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tagArray.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview Card */}
              <div className=" rounded-lg hidden border border-green-200 p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">
                      Preview Your Blog
                    </h3>
                    <p className="text-xs text-slate-600 mb-3">
                      See how your blog will look to readers before publishing.
                    </p>
                    <button
                      type="button"
                      className="text-xs font-medium text-green-600 hover:text-green-700 underline"
                      onClick={() => {
                        if (slug) {
                          window.open(`/blogs/${slug}`, "_blank");
                        } else {
                          alert("Please enter a slug first");
                        }
                      }}
                    >
                      Open Preview →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </SidebarLayout>
  );
}