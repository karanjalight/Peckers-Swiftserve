import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import Service from "@/components/landing/Services";
import CarouselComponent from "@/components/landing/Carousel";
import Tabs from "@/components/landing/Tabs";
import ProductCarousel from "@/components/landing/ProductsCarousel";
import Testimonials from "@/components/landing/Testimonials";
import Faqs from "@/components/landing/Faqs";
import Partners from "@/components/landing/Partners";
import Articles from "@/components/landing/Articles";
import Footer from "@/components/landing/Footer";
import { getBlogs } from "@/lib/blogs";
import Stats from "@/components/about/Stats";
import TermsModal from "@/components/TermsModal";

export default async function HomePage() {
  let blogs = null;
  try {
    blogs = await getBlogs(6, 1);
  } catch {
    blogs = [];
  }

  return (
    <main className="min-h-screen">
      {/* Terms Modal */}
      <TermsModal />

      <Navbar />
      <HeroSection />

      <div className="w-full">
        <Stats />
      </div>

      <Service />
      <Tabs />
      <CarouselComponent />
      <Testimonials />
      <Faqs />
      <Articles />
      <Footer />
    </main>
  );
}

