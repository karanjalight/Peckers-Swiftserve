import Navbar from '@/components/Navbar';
import ProductHero from '@/components/hero/ProductsHero';
import Footer from '@/components/landing/Footer'
import CategoryProductList from '@/components/products/CategoryProductList';

interface BooksPageProps {
  searchParams: Promise<{ subcategory?: string }>;
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const params = await searchParams;
  
  return (
    <main className="">
      <Navbar />
      <ProductHero
        title="Books"
        highlight="Collection"
        breadcrumbs={[
          { label: "Home", href: "/" },
          {
            label: "Books",
            href: "/books",
          },
        ]}
        background="/bb7.JPG"
      />     

      <CategoryProductList 
        category="books" 
        subcategory={params.subcategory}
      />

      <Footer />
    </main>
  );
}

