import { Button } from "@/components/ui/button";

export default function AboutHero() {
  return (
    <section
      className="relative flex lg:h-[41vh] h-[50%] flex-col md:flex-row items-center  lg:justify-between px-6 sm:px-10 md:px-32 py-8 md:py-20 bg-cover md:bg-cover bg-no-repeat bg-center text-white"
      style={{ backgroundImage: "url('/landing-Container.png')" }}
    >
      {/* Overlays */}
      <div className="absolute inset-0 bg-green-800/40 z-0" />
      <div className="absolute inset-0 bg-black/60 z-0" />

      {/* Content Wrapper */}
      <div className=" w-full   z-10">
        {/* Left Side - Heading */}
        <div className="relative z-10 lg:my-40 my-40 sm:mt-28  text-center ">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
          Solar Energy
            <span className="text-[#33B200] ml-4">
            Solutions
              <br className="hidden sm:block" />
            </span>{" "}
          </h1>

          <nav
            className="flex items-center justify-center px-5 py-3 text-white "
            aria-label="Breadcrumb"
          >
            <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
              <li className="inline-flex items-center">
                <a
                  href="#"
                  className="inline-flex items-center text-sm font-medium text-white hover:text-green-600 dark:text-gray-400 dark:hover:text-white"
                >
                  <svg
                    className="w-3 h-3 me-2.5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                  </svg>
                  Cytek
                </a>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="rtl:rotate-180 block w-3 h-3 mx-1 text-gray-400 "
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 6 10"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 9 4-4-4-4"
                    />
                  </svg>
                  <a
                    href="#"
                    className="ms-1 text-sm font-medium text-[#33B200] hover:text-green-600 md:ms-2 "
                  >
                    Our Services
                  </a>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

    </section>
  );
}
