import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AboutHeroSection from "@/components/AboutHeroSection";
import Service from "@/components/landing/Services";
import CarouselComponent from "@/components/landing/Carousel";
import Tabs from "@/components/landing/Tabs";
import ProductCarousel from "@/components/landing/ProductsCarousel";
import Testimonials from "@/components/landing/Testimonials";
import Faqs from "@/components/landing/Faqs";
import Partners from "@/components/landing/Partners";
import Articles from "@/components/landing/Articles";
import Footer from "@/components/landing/Footer";
// import ProjectsShowcase from "@/components/landing/Tabs";
import ProjectHero from "@/components/hero/ProjectsHero";
import Projects from "@/components/services/Projects";
import ClientSuccess from "@/components/about/ClientSuccess";
import ExpertsCarousel from "@/components/about/ExpertsCarousel";



export default function ProjectsPage() {
  return (
    <main className="min-h-screen ">
      <Navbar />
      <ProjectHero
        title="Featured"
        highlight="Collections"
      />
      <Projects  />
      {/* <ClientSuccess /> */}
      {/* <ExpertsCarousel /> */}
      <Footer />
    </main>
  );
}
