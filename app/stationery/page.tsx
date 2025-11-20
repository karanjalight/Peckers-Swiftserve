import Navbar from '@/components/Navbar';
import ProductHero from '@/components/hero/ProductsHero';
import Footer from '@/components/landing/Footer'
import CategoryProductList from '@/components/products/CategoryProductList';

interface StationeryPageProps {
  searchParams: Promise<{ subcategory?: string }>;
}

export default async function StationeryPage({ searchParams }: StationeryPageProps) {
  const params = await searchParams;
  
  return (
    <main className="">
      <Navbar />
      <ProductHero
        title="Stationery"
        highlight="Supplies"
        breadcrumbs={[
          { label: "Home", href: "/" },
          {
            label: "Stationery",
            href: "/stationery",
          },
        ]}
        background="/bb7.JPG"
      />     

      <CategoryProductList 
        category="stationery" 
        subcategory={params.subcategory}
      />

      <Footer />
    </main>
  );
}

