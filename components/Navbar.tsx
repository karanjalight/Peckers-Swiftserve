"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronDown, Menu, X, GraduationCap } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTrainingClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (isAuthenticated) {
      router.push("/account/training");
    } else {
      router.push("/signup?redirect=/account/training");
    }
    if (mobileMenuOpen) {
      closeMobileMenu();
    }
  };

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const toggleDropdown = (menu: string) => {
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  const navBgClass = isScrolled ? "bg-white shadow-md" : "bg-transparent";

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${navBgClass}`}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-20 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Peckers Services Logo"
            className="h-12 sm:h-14 lg:h-16 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8 text-sm">
          <NavLink
            href="/"
            label="Home"
            pathname={pathname}
            isScrolled={isScrolled}
          />
          <NavLink
            href="/about"
            label="About Us"
            pathname={pathname}
            isScrolled={isScrolled}
          />
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("services")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              className={`flex items-center gap-1 transition-colors duration-300 font-medium ${
                activeDropdown === "services"
                  ? (isScrolled ? "text-[#b38f62]" : "text-white")
                  : isScrolled
                  ? "text-gray-700 hover:text-[#b38f62]"
                  : "text-white hover:text-gray-200"
              }`}
              aria-haspopup="true"
              aria-expanded={activeDropdown === "services"}
              type="button"
              tabIndex={0}
            >
              Services
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${
                  activeDropdown === "services" ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {activeDropdown === "services" && (
              <div
                className="absolute left-0 top-full w-48 z-50 pt-2"
                onMouseEnter={() => setActiveDropdown("services")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <div className="rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 overflow-hidden">
                  <div className="py-1 flex flex-col">
                    <Link
                      href="/services/emergency-nanny"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setActiveDropdown(null)}
                    >
                      Book Nanny
                    </Link>
                    <Link
                      href="/services/hire-security"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setActiveDropdown(null)}
                    >
                      Book Guard dogs
                    </Link>
                    <Link
                      href="/subscriptions"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setActiveDropdown(null)}
                    >
                      Subscriptions
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* <NavLink
            href="/services/corporate-support"
            label="Corporate Support"
            pathname={pathname}
            isScrolled={isScrolled}
          /> */}
          <NavLink
            href="/jobs"
            label="Jobs"
            pathname={pathname}
            isScrolled={isScrolled}
          />

          {/* Training Link - Conditional based on auth */}
          {isAuthenticated ? (
            <NavLink
              href="/account/training"
              label="Training"
              pathname={pathname}
              isScrolled={isScrolled}
            />
          ) : (
            <button
              onClick={handleTrainingClick}
              className={`transition-colors duration-300 font-medium ${
                isScrolled
                  ? "text-gray-700 hover:text-[#b38f62]"
                  : "text-white hover:text-gray-200"
              }`}
            >
              Training
            </button>
          )}

          <NavLink
            href="/contact"
            label="Contact Us"
            pathname={pathname}
            isScrolled={isScrolled}
          />
          {/* <NavLink
            href="/contact"
            label="Contact Us"
            pathname={pathname}
            isScrolled={isScrolled}
          /> */}
        </div>

        {/* Desktop Buttons */}
        <div className="hidden lg:flex items-center gap-4">
          {loading ? (
            <div className="w-20 h-10 bg-gray-200 animate-pulse rounded"></div>
          ) : isAuthenticated ? (
            <Link
              href="/account"
              className="relative font-normal inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#244672] text-white hover:bg-[#1a3554] transition-all duration-300 rounded-lg shadow-md hover:shadow-lg"
            >
              Account
            </Link>
          ) : (
            <Link
              href="/login"
              className="relative font-normal inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#b38f62] text-white hover:bg-[#02273f] transition-all duration-300 rounded-lg shadow-md hover:shadow-lg"
            >
              Login →
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`lg:hidden p-2 transition-colors ${
            isScrolled ? "text-gray-900" : "text-white"
          }`}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" />
          <div className="fixed top-0 left-0 right-0 bottom-0 bg-white z-50 lg:hidden overflow-y-auto">
            <div className="flex w-full justify-between p-4">
              <div className="flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="Peckers Services Logo"
                  className="h-12 w-auto"
                />
              </div>
              <button
                onClick={closeMobileMenu}
                className="border p-2 border-[#b38f62] text-[#b38f62] rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 py-6 space-y-4">
              <MobileNavLink
                href="/"
                label="Home"
                onClick={closeMobileMenu}
                pathname={pathname}
              />
              <MobileNavLink
                href="/about"
                label="About Us"
                onClick={closeMobileMenu}
                pathname={pathname}
              />
              
              <MobileNavLink
                href="/services/emergency-nanny"
                label="Book Nanny"
                onClick={closeMobileMenu}
                pathname={pathname}
              />
              
              <MobileNavLink
                href="/services/hire-security"
                label="Book Guard Dogs"
                onClick={closeMobileMenu}
                pathname={pathname}
              />
              
              <MobileNavLink
                href="/services/corporate-support"
                label="Corporate Support"
                onClick={closeMobileMenu}
                pathname={pathname}
              />
              
              <MobileNavLink
                href="/jobs"
                label="Jobs"
                onClick={closeMobileMenu}
                pathname={pathname}
              />

              {isAuthenticated ? (
                <MobileNavLink
                  href="/account/training"
                  label="Training"
                  onClick={closeMobileMenu}
                  pathname={pathname}
                />
              ) : (
                <button
                  onClick={handleTrainingClick}
                  className={`block py-3 font-medium transition-colors w-full text-left ${
                    pathname.includes("/account/training") || pathname.includes("/training")
                      ? "text-[#b38f62]"
                      : "text-gray-600 hover:text-[#b38f62]"
                  }`}
                >
                  Training
                </button>
              )}
              
              <MobileNavLink
                href="/subscriptions"
                label="Subscriptions"
                onClick={closeMobileMenu}
                pathname={pathname}
              />

              <div className="pt-4 space-y-2 border-t border-gray-200 mt-4">
                {loading ? (
                  <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
                ) : isAuthenticated ? (
                  <Link
                    href="/account"
                    onClick={closeMobileMenu}
                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-[#244672] text-white hover:bg-[#1a3554] transition-all duration-300 rounded-lg font-semibold"
                  >
                    Account
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={closeMobileMenu}
                      className="w-full inline-flex items-center justify-center px-6 py-3 bg-[#b38f62] text-white hover:bg-[#02273f] transition-all duration-300 rounded-lg font-semibold"
                    >
                      Login →
                    </Link>
                    <Link
                      href="/signup"
                      onClick={closeMobileMenu}
                      className="w-full inline-flex items-center justify-center px-6 py-3 bg-[#244672] text-white hover:bg-[#1a3554] transition-all duration-300 rounded-lg font-semibold"
                    >
                      Get Started →
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

/* Desktop NavLink */
function NavLink({
  href,
  label,
  pathname,
  isScrolled,
  onClick,
}: {
  href: string;
  label: string;
  pathname: string;
  isScrolled: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const isActive = pathname === href || (label === "Training" && pathname.includes("/account/training"));
  const base = isScrolled
    ? "text-gray-700 hover:text-[#b38f62]"
    : "text-white hover:text-gray-200";
  
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`transition-colors duration-300 font-medium ${
          isActive ? (isScrolled ? "text-[#b38f62]" : "text-white") : base
        }`}
      >
        {label}
      </button>
    );
  }
  
  return (
    <Link
      href={href}
      className={`transition-colors duration-300 font-medium ${
        isActive ? (isScrolled ? "text-[#b38f62]" : "text-white") : base
      }`}
    >
      {label}
    </Link>
  );
}

/* Desktop Dropdown */
function Dropdown({
  label,
  items,
  activeDropdown,
  toggleDropdown,
  pathname,
  isScrolled,
}: {
  label: string;
  items: { name: string; href: string }[];
  activeDropdown: string | null;
  toggleDropdown: (menu: string) => void;
  pathname: string;
  isScrolled: boolean;
}) {
  const isActive =
    activeDropdown === label || items.some((item) => item.href === pathname);
  const base = isScrolled
    ? "text-gray-700 hover:text-[#b38f62]"
    : "text-white hover:text-gray-200";
  return (
    <div
      className="relative"
      onMouseEnter={() => toggleDropdown(label)}
      onMouseLeave={() => toggleDropdown("")}
    >
      <button
        className={`flex items-center gap-1 font-medium transition-colors duration-300 ${
          isActive ? (isScrolled ? "text-[#b38f62]" : "text-white") : base
        }`}
      >
        {label}{" "}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isActive ? "rotate-180" : ""
          }`}
        />
      </button>
      {isActive && (
        <div className="absolute top-full left-0 pt-2 w-64 z-50">
          <div className="bg-white text-gray-600 shadow-lg px-2 py-2 divide-y">
            {items.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-4 py-2 hover:bg-gray-100 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* Mobile NavLink */
function MobileNavLink({
  href,
  label,
  onClick,
  pathname,
}: {
  href: string;
  label: string;
  onClick: () => void;
  pathname: string;
}) {
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block py-3 font-medium transition-colors ${
        isActive ? "text-[#b38f62]" : "text-gray-600 hover:text-[#b38f62]"
      }`}
    >
      {label}
    </Link>
  );
}

/* Mobile Dropdown */
function MobileDropdown({
  label,
  items,
  activeDropdown,
  toggleDropdown,
  closeMobileMenu,
  pathname,
}: {
  label: string;
  items: { name: string; href: string }[];
  activeDropdown: string | null;
  toggleDropdown: (menu: string) => void;
  closeMobileMenu: () => void;
  pathname: string;
}) {
  const isActive =
    activeDropdown === label || items.some((item) => item.href === pathname);
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => toggleDropdown(label)}
        className={`flex items-center justify-between w-full py-3 font-medium transition-colors ${
          isActive ? "text-[#b38f62]" : "text-gray-600 hover:text-[#b38f62]"
        }`}
      >
        {label}{" "}
        <ChevronDown
          className={`h-5 w-5 transition-transform ${
            isActive ? "rotate-180" : ""
          }`}
        />
      </button>
      {activeDropdown === label && (
        <div className="pl-4 pb-3 space-y-2">
          {items.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={closeMobileMenu}
              className={`block py-2 transition-colors ${
                item.href === pathname
                  ? "text-[#b38f62]"
                  : "text-gray-600 hover:text-[#b38f62]"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
