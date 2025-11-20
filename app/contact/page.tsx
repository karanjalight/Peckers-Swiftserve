import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import ContactUs from "@/components/ContactUs";
import ContactHero from "@/components/hero/ContactHero";

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <ContactHero title="Contact" highlight="Us" />
      <ContactUs />

      <div className="mt-8  justify-center max-w-8xl mx-auto flex lg:flex-row  flex-col gap-6">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.9943196558465!2d36.94985287437872!3d-1.1644807988243822!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f3f58c5e70411%3A0x6a383884ac6c75ad!2sSukari%20Industrial%20Estate%2C%20Eastern%20By%20Pass%2C%20Ruiru!5e0!3m2!1sen!2ske!4v1763659131872!5m2!1sen!2ske"
          width={600}
          height={450}
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="rounded-lg w-full"
        ></iframe>
      </div>

      <Footer />
    </main>
  );
}
