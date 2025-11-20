import Navbar from '@/components/Navbar';
import ProductHero from '@/components/hero/ProductsHero';
import Footer from '@/components/landing/Footer'
import CategoryProductList from '@/components/products/CategoryProductList';

interface ComputerAccessoriesPageProps {
  searchParams: Promise<{ subcategory?: string }>;
}

export default async function ComputerAccessoriesPage({ searchParams }: ComputerAccessoriesPageProps) {
  const params = await searchParams;
  
  return (
    <main className="">
      <Navbar />
      <ProductHero
        title="Computer"
        highlight="Accessories"
        breadcrumbs={[
          { label: "Home", href: "/" },
          {
            label: "Computer Accessories",
            href: "/computer-accessories",
          },
        ]}
        background="/bb7.JPG"
      />     

      <CategoryProductList 
        category="computer accessories" 
        subcategory={params.subcategory}
      />

      <Footer />
    </main>
  );
}

