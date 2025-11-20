import Navbar from '@/components/Navbar';
import AboutHero  from "@/components/hero/AboutHero"
import Footer from '@/components/landing/Footer'
import Stats from '@/components/about/Stats'
import Services from '@/components/about/Services';
import ExpertsCarousel  from '@/components/about/ExpertsCarousel';
import ClientSuccess  from '@/components/about/ClientSuccess';
import Faqs from '@/components/about/Faqs';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <AboutHero title="About"
        highlight="Us"
        breadcrumbs={[
          { label: "Home", href: "/" },
          {
            label: "About Us",
            href: "/#",
          },
        ]} />
      <Services />
      <Stats />
      <Footer />
    </main>
  );
}
