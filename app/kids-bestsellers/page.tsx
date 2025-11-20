import Navbar from '@/components/Navbar';
import ProductHero from '@/components/hero/ProductsHero';
import Footer from '@/components/landing/Footer'
import CategoryProductList from '@/components/products/CategoryProductList';

export default function KidsBestsellersPage() {
  return (
    <main className="">
      <Navbar />
      <ProductHero
        title="Kids"
        highlight="Bestsellers"
        breadcrumbs={[
          { label: "Home", href: "/" },
          {
            label: "Kids Bestsellers",
            href: "/kids-bestsellers",
          },
        ]}
        background="/bb7.JPG"
      />     

      <CategoryProductList category="kids bestsellers" />

      <Footer />
    </main>
  );
}

