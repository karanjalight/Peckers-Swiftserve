"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronDown, Menu, X } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${navBgClass}`}>
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-20 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Peckers Services Logo" className="h-12 sm:h-14 lg:h-16 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8 text-sm">
          <NavLink href="/" label="Home" pathname={pathname} isScrolled={isScrolled} />
          <NavLink href="/about" label="About Us" pathname={pathname} isScrolled={isScrolled} />
          <NavLink href="/services/emergency-nanny" label="Hire Nanny" pathname={pathname} isScrolled={isScrolled} />
          <NavLink href="/services/hire-security" label="Hire Security" pathname={pathname} isScrolled={isScrolled} />

          <Dropdown
            label="Our Services"
            items={[
              { name: "Household Staffing", href: "/about#household" },
              { name: "Pharma & Corporate Training", href: "/about#training" },
              { name: "Performance Analytics", href: "/about#analytics" },
            ]}
            activeDropdown={activeDropdown}
            toggleDropdown={toggleDropdown}
            pathname={pathname}
            isScrolled={isScrolled}
          />

          <NavLink href="/blogs" label="Blogs" pathname={pathname} isScrolled={isScrolled} />
        </div>

        {/* Desktop Buttons */}
        <div className="hidden lg:flex items-center gap-4">
          <Link href="/login" className="relative font-normal inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#b38f62] text-white hover:bg-[#02273f] transition-all duration-300">
            Login →
          </Link>

          <Link href="/signup" className="relative font-normal inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#b38f62] text-white hover:bg-[#02273f] transition-all duration-300">
            Get Started →
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`lg:hidden p-2 transition-colors ${isScrolled ? "text-gray-900" : "text-white"}`}>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" />
          <div className="fixed top-0 left-0 right-0 bottom-0 bg-white z-50 lg:hidden overflow-y-auto">
            <div className="flex w-full justify-between p-4">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Peckers Services Logo" className="h-12 w-auto" />
              </div>
              <button onClick={closeMobileMenu} className="border p-2 border-[#b38f62] text-[#b38f62] rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 py-6 space-y-4">
              <MobileNavLink href="/" label="Home" onClick={closeMobileMenu} pathname={pathname} />
              <MobileNavLink href="/about" label="About Us" onClick={closeMobileMenu} pathname={pathname} />

              <MobileDropdown
                label="Services"
                items={[
                  { name: "Household Staffing", href: "/about#household" },
                  { name: "Pharma & Corporate Training", href: "/about#training" },
                  { name: "Performance Analytics", href: "/about#analytics" },
                ]}
                activeDropdown={activeDropdown}
                toggleDropdown={toggleDropdown}
                closeMobileMenu={closeMobileMenu}
                pathname={pathname}
              />

              <MobileNavLink href="/contact" label="Contact" onClick={closeMobileMenu} pathname={pathname} />

              <div className="pt-4 space-y-2">
                <Button className="w-full text-white bg-[#b38f62] hover:bg-[#02273f] rounded-none">Get Started →</Button>
                <Button className="w-full text-white bg-[#b38f62] hover:bg-[#02273f] rounded-none">Login →</Button>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

/* Desktop NavLink */
function NavLink({ href, label, pathname, isScrolled }: { href: string; label: string; pathname: string; isScrolled: boolean }) {
  const isActive = pathname === href;
  const base = isScrolled ? "text-gray-700 hover:text-[#b38f62]" : "text-white hover:text-gray-200";
  return (
    <Link href={href} className={`transition-colors duration-300 font-medium ${isActive ? (isScrolled ? "text-[#b38f62]" : "text-white") : base}`}>
      {label}
    </Link>
  );
}

/* Desktop Dropdown */
function Dropdown({ label, items, activeDropdown, toggleDropdown, pathname, isScrolled }: { label: string; items: { name: string; href: string }[]; activeDropdown: string | null; toggleDropdown: (menu: string) => void; pathname: string; isScrolled: boolean; }) {
  const isActive = activeDropdown === label || items.some(item => item.href === pathname);
  const base = isScrolled ? "text-gray-700 hover:text-[#b38f62]" : "text-white hover:text-gray-200";
  return (
    <div className="relative" onMouseEnter={() => toggleDropdown(label)} onMouseLeave={() => toggleDropdown("")}>
      <button className={`flex items-center gap-1 font-medium transition-colors duration-300 ${isActive ? (isScrolled ? "text-[#b38f62]" : "text-white") : base}`}>
        {label} <ChevronDown className={`h-4 w-4 transition-transform ${isActive ? "rotate-180" : ""}`} />
      </button>
      {isActive && (
        <div className="absolute top-full left-0 pt-2 w-64 z-50">
          <div className="bg-white text-gray-600 shadow-lg px-2 py-2 divide-y">
            {items.map(item => (
              <Link key={item.name} href={item.href} className="block px-4 py-2 hover:bg-gray-100 transition-colors">
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
function MobileNavLink({ href, label, onClick, pathname }: { href: string; label: string; onClick: () => void; pathname: string }) {
  const isActive = pathname === href;
  return (
    <Link href={href} onClick={onClick} className={`block py-3 font-medium transition-colors ${isActive ? "text-[#b38f62]" : "text-gray-600 hover:text-[#b38f62]"}`}>
      {label}
    </Link>
  );
}

/* Mobile Dropdown */
function MobileDropdown({ label, items, activeDropdown, toggleDropdown, closeMobileMenu, pathname }: { label: string; items: { name: string; href: string }[]; activeDropdown: string | null; toggleDropdown: (menu: string) => void; closeMobileMenu: () => void; pathname: string }) {
  const isActive = activeDropdown === label || items.some(item => item.href === pathname);
  return (
    <div className="border-b border-gray-200">
      <button onClick={() => toggleDropdown(label)} className={`flex items-center justify-between w-full py-3 font-medium transition-colors ${isActive ? "text-[#b38f62]" : "text-gray-600 hover:text-[#b38f62]"}`}>
        {label} <ChevronDown className={`h-5 w-5 transition-transform ${isActive ? "rotate-180" : ""}`} />
      </button>
      {activeDropdown === label && (
        <div className="pl-4 pb-3 space-y-2">
          {items.map(item => (
            <Link key={item.name} href={item.href} onClick={closeMobileMenu} className={`block py-2 transition-colors ${item.href === pathname ? "text-[#b38f62]" : "text-gray-600 hover:text-[#b38f62]"}`}>
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
