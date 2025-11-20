import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Breadcrumb {
  label: string;
  href: string;
}

interface ProductHeroProps {
  title: string;
  highlight: string;
  breadcrumbs?: Breadcrumb[];
  background?: string;
}

export default function ProductHero({
  title,
  highlight,
  breadcrumbs = [],
  background = "https://www.ku.ac.ke/wp-content/uploads/2025/11/sika3.jpeg",
}: ProductHeroProps) {
  return (
    <section
    className="relative flex lg:h-[53vh] h-[20%] flex-col md:flex-row items-center  lg:justify-between px-6 sm:px-10 md:px-32 py-8 md:py-20 bg-cover md:bg-center bg-no-repeat bg-bottom text-white"
    style={{ backgroundImage: `url('${background}')` }}
    >
      {/* Overlays */}
      <div className="absolute inset-0 bg-[#b38f62]/10 z-0" />
      <div className="absolute inset-0 bg-black/70 z-0" />

      {/* Content */}
      <div className="w-full z-10">
      <div className="relative z-10 lg:my-40 my-20 sm:mt-28  text-center ">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            {title}{" "}
            <span className="text-[#b38f62] ml-2">{highlight}</span>
          </h1>

          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav
              className="flex items-center justify-center px-5 py-3 text-white"
              aria-label="Breadcrumb"
            >
              <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                {breadcrumbs.map((crumb, index) => (
                  <li key={index} className="inline-flex items-center">
                    {/* Arrow separator for all except first */}
                    {index > 0 && (
                      <svg
                        className="rtl:rotate-180 block w-3 h-3 mx-1 text-gray-300"
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
                    )}
                    {/* Link */}
                    <Link
                      href={crumb.href || "#"}
                      className={`text-sm font-medium ${
                        index === breadcrumbs.length - 1
                          ? "text-[#b38f62]"
                          : "text-white hover:text-[#b38f62]"
                      } no-underline`}
                    >
                      {crumb.label}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}
