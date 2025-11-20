import Navbar from '@/components/Navbar';
import AboutHero  from "@/components/services/ServicesHero"
import Footer from '@/components/landing/Footer'
import Stats from '@/components/about/Stats'
import Services from '@/components/about/Services';
import ExpertsCarousel  from '@/components/services/ExpertsCarousel';
import ClientSuccess  from '@/components/services/ClientSuccess';
import Faqs from '@/components/about/Faqs';
import InfiniteCarousel from '@/components/services/ServicesCarousel';
export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <AboutHero  />
      <InfiniteCarousel />
      {/* <Services />       */}
      <ExpertsCarousel />
      <ClientSuccess />  
      {/* <Faqs />  */}
      <Footer />
      
    </main>
  );
}
