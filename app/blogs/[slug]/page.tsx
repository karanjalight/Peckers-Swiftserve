"use client";
import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BlogHero from "@/components/hero/BlogHero";
import Footer from "@/components/landing/Footer";
import { getBlogBySlug, incrementBlogViews } from "@/lib/blogs";
import { notFound } from "next/navigation";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  cover_image_url?: string;
  tags?: string[];
  published_at: string;
  created_at: string;
  view_count: number;
}

interface BlogDetailProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function BlogDetail({ params }: BlogDetailProps) {
  const { slug } = use(params);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadBlog() {
      try {
        const data = await getBlogBySlug(slug);
        if (!data) {
          notFound();
          return;
        }
        setBlog(data);

        // Increment view count after blog is loaded
        try {
          await incrementBlogViews(data.id);
          // Update local state with incremented view count
          setBlog((prev) => 
            prev ? { ...prev, view_count: (prev.view_count || 0) + 1 } : null
          );
        } catch (viewError) {
          console.error("Error incrementing views:", viewError);
          // Don't throw - view count is not critical
        }
      } catch (error) {
        console.error("Error loading blog:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    }
    loadBlog();
  }, [slug]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDay = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDate().toString();
  };

  const getMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short" });
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = blog?.title || "";
  const shareText = blog?.excerpt || blog?.title || "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareTitle + " - " + shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
  };

  if (loading) {
    return (
      <section className="bg-green-100/40">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#33B200] mb-4"></div>
            <p className="text-lg text-gray-600">Loading blog post...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!blog) {
    notFound();
  }

  return (
    <section className="bg-green-100/40">
      <Navbar />
      <BlogHero
        title="Blog"
        highlight={blog.title}
        coverImage={blog.cover_image_url}

        useCoverImage={true}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Blogs", href: "/blogs" },
          { label: blog.title, href: `/blogs/${blog.slug}` },
        ]}
      />

      <div className="lg:mx-20 mx-4 p-4 my-6 lg:p-8 lg:my-10 bg-white rounded-lg shadow-lg">
        <article className="mx-auto">
          {/* Blog Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-[#FFCA28] text-white text-center p-3 rounded-md shadow-md w-16">
                  <p className="text-lg font-bold leading-tight">
                    {getDay(blog.published_at || blog.created_at)}
                  </p>
                  <p className="text-xs uppercase">
                    {getMonth(blog.published_at || blog.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {formatDate(blog.published_at || blog.created_at)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {blog.view_count || 0} views
                  </p>
                </div>
              </div>
            </div>

            {blog.excerpt && (
              <p className="text-lg text-gray-600 mb-6 leading-relaxed border-l-4 border-[#33B200] pl-4 italic">
                {blog.excerpt}
              </p>
            )}

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {blog.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#33B200]/10 text-[#33B200] rounded-full text-sm font-medium hover:bg-[#33B200]/20 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Blog Content */}
          <div className="prose prose-lg max-w-none mb-8 prose-headings:text-[#244672] prose-a:text-[#33B200] prose-a:no-underline hover:prose-a:underline prose-strong:text-[#244672] prose-img:rounded-lg prose-img:shadow-md">
            <div
              className="prose prose-lg max-w-none mb-8
  prose-headings:text-[#244672]
  prose-a:text-[#33B200]
  prose-a:no-underline hover:prose-a:underline
  prose-strong:text-[#244672]
  prose-img:rounded-lg prose-img:shadow-md"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </div>

          {/* Back Button and Share Section */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <button
              onClick={() => router.push("/blogs")}
              className="px-6 py-3 bg-[#33B200] text-white font-medium rounded hover:bg-[#2a8f00] transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Blogs
            </button>

            {/* Share Section */}
            <div className="flex flex-col items-start sm:items-end gap-3">
              <p className="text-sm font-medium text-gray-700">
                Share this article
              </p>
              <div className="flex items-center gap-3">
                {/* WhatsApp */}
                <a
                  href={shareLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#25D366] text-white hover:bg-[#20BA5A] transition-all hover:scale-110"
                  aria-label="Share on WhatsApp"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href={shareLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1877F2] text-white hover:bg-[#0C63D4] transition-all hover:scale-110"
                  aria-label="Share on Facebook"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* Twitter/X */}
                <a
                  href={shareLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 transition-all hover:scale-110"
                  aria-label="Share on Twitter"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* LinkedIn */}
                <a
                  href={shareLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0A66C2] text-white hover:bg-[#004182] transition-all hover:scale-110"
                  aria-label="Share on LinkedIn"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>

                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-all hover:scale-110 relative"
                  aria-label="Copy link"
                >
                  {copied ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                  {copied && (
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      Copied!
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>

      <Footer />
    </section>
  );
}