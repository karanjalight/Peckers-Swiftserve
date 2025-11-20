import Navbar from '@/components/Navbar';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import HeroSection from "@/components/HeroSection"
import Service from '@/components/landing/Services';
import CarouselComponent from '@/components/landing/Carousel'
import Tabs from '@/components/landing/Tabs'
import ProductCarousel from  '@/components/landing/ProductsCarousel'
import Testimonials from  '@/components/landing/Testimonials'
import Faqs from  '@/components/landing/Faqs'
import Partners from  '@/components/landing/Partners'
import Articles from  '@/components/landing/Articles'
import Footer from '@/components/landing/Footer'
import { getBlogs } from '@/lib/blogs';

export default async function HomePage() {
  // Fetch latest 6 blogs for home page
  let blogs = null;
  try {
    blogs = await getBlogs(6, 1);
  } catch (error) {
    console.error('Error fetching blogs for home page:', error);
    blogs = [];
  }

  return (
    <main className="min-h-screen ">
      <Navbar />
      <HeroSection />
      <CarouselComponent />
      <Service />
      <Tabs />
      <ProductCarousel />
      <Partners />
      <Testimonials />
      <Faqs />
      <Articles />
      <Footer />  
    </main>
  );
}
