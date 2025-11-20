import Navbar from '@/components/Navbar';
import ProductHero from '@/components/hero/ProductsHero';
import Footer from '@/components/landing/Footer'
import Stats from '@/components/about/Stats'
import Services from '@/components/about/Services';
import ExpertsCarousel  from '@/components/services/ExpertsCarousel';
import ClientSuccess  from '@/components/services/ClientSuccess';
import Faqs from '@/components/about/Faqs';
import InfiniteCarousel from '@/components/services/ServicesCarousel';
import ProductList from '@/components/products/product-list';

export default function HomePage() {
  return (
    <main className="">
      <Navbar />
      <ProductHero
        title="Shop"
        highlight="Products"
        breadcrumbs={[
          { label: "Home", href: "/" },
          {
            label: "products",
            href: "/#",
          },
        ]}
      />     

      <ProductList />

      {/* <InfiniteCarousel /> */}
      {/* <Services />       */}
      {/* <ExpertsCarousel /> */}
      {/* <ClientSuccess />   */}
      {/* <Faqs />  */}
      <Footer />
      
    </main>
  );
}
