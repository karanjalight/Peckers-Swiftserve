import { Button } from "@/components/ui/button";

export default function AboutHeroSection() {
  return (
    <section
      className="relative flex mb-80 lg:h-[45vh] h-[70vh] flex-col md:flex-row items-center  lg:justify-between px-6 sm:px-10 md:px-32 py-16 md:py-20 bg-cover md:bg-cover bg-no-repeat bg-center text-white"
      style={{ backgroundImage: "url('/landing-Container.png')" }}
    >
      {/* Overlays */}
      <div className="absolute inset-0 bg-green-800/40 z-0" />
      <div className="absolute inset-0 bg-black/60 z-0" />

      {/* Content Wrapper */}
      <div className="  w-full md:-mb-20 z-10">
        {/* Left Side - Heading */}
        <div className="relative z-10 mt-40 sm:mt-28  text-center ">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Coming 
            <span className="text-[#33B200] ml-4">
             Soon<br className="hidden sm:block" /> 
            </span>{" "}
             
          </h1>
        </div>

      </div>

      {/* Mobile-Only Text + Buttons */}
      <div className="relative z-10 mt-10 sm:hidden text-center">
        <p className="text-white font-light text-sm px-6">
          Shop certified batteries, inverters, and panels online, or partner
          with our engineers for a custom solution.
        </p>
        <div className="mt-6 flex flex-col gap-4 items-center">
          <Button
            variant="outline"
            className="bg-transparent rounded-none border-white px-8 hover:bg-white/10 text-sm"
          >
            Get A Quote
          </Button>
          <Button className="bg-[#33B200] hover:bg-[#33B200] flex gap-2 px-10 text-white text-sm">
            <div>Shop</div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                d="M2 12h20m-9-9l9 9l-9 9"
              />
            </svg>
          </Button>
        </div>
      </div>
    </section>
  );
}
