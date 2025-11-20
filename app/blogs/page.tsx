// app/blogs/page.tsx   (or wherever BlogsPage lives)
import Navbar from '@/components/Navbar';
import ProductHero from '@/components/hero/ProductsHero';
import Footer from '@/components/landing/Footer';
import Articles from '@/components/landing/Articles';
import { getBlogs } from '@/lib/blogs';
import BlogHero from '@/components/hero/BlogHero';

export default async function BlogsPage() {
  const { blogs, count } = await getBlogs(12, 1);   // <-- destructured

  return (
    <main className="min-h-screen">
      <Navbar />
      <BlogHero
        title="News and"
        highlight="Articles"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Blogs", href: "/blogs" },
        ]}
      />
      <Articles blogs={blogs} /> 
      <Footer />
    </main>
  );
}