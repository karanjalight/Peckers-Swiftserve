// lib/blogs.ts
import { supabase } from "./supabase";

export async function getBlogs(limit = 9, page = 1) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("blogs")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[getBlogs] Supabase error:", error);
    return { blogs: [], count: 0 };
  }

  return { blogs: data ?? [], count: count ?? 0 };
}

export async function getBlogBySlug(slug: string) {
  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Blog not found");
  return data;
}

export async function incrementBlogViews(blogId: string) {
  const { error } = await supabase.rpc("increment_blog_views", {
    blog_id: blogId,
  });

  if (error) {
    console.error("[incrementBlogViews] Error:", error);
    throw error;
  }
}

export async function createBlog(blog: {
  title: string;
  slug: string;
  content: string;
  author_id: string;
  cover_image_url?: string;
  excerpt?: string;
  tags?: string[];
  status?: string;
  published_at?: string;
}) {
  const { data, error } = await supabase
    .from("blogs")
    .insert(blog)
    .select()
    .single();

  if (error) {
    console.error("[createBlog] Supabase error:", error);
    throw error;
  }

  return data;
}