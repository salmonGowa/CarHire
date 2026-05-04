import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const NavLanding = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 px-4 sm:px-8 ${scrolled ? "bg-white/90 dark:bg-[#030711]/92 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.06] shadow-sm dark:shadow-2xl dark:shadow-black/50" : "bg-transparent"}`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-[70px]">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 flex-shrink-0">
            <img src="/logo.png" alt="DriveFleet Pro Logo" className="w-9 h-9 rounded-xl" />
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {["Features", "How It Works", "Fleet", "About", "Pricing"].map(
              (item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s/g, "")}`}
                  className="nav-link text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                >
                  {item}
                </a>
              ),
            )}
            <a
              href="/login"
              className="ml-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl btn-glow transition-all hover:-translate-y-0.5 shadow-md"
            >
                Get Started
            </a>
            <div className="ml-4 pl-4 border-l border-slate-200 dark:border-slate-700">
              {<ThemeToggle size="sm" /> }
            </div>
          </div>

          {/* Mobile burger & toggle */}
          <div className="md:hidden flex items-center gap-4">
            {<ThemeToggle size="sm" /> }
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X size={20} strokeWidth={2.5} />
              ) : (
                <Menu size={20} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`${isMenuOpen ? "block" : "hidden"} md:hidden bg-white/95 dark:bg-[#030711]/97 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 px-4 pb-6 pt-2 shadow-xl`}
        >
          <div className="flex flex-col gap-1">
            {["Features", "How It Works", "Fleet", "About", "Pricing"].map(
              (item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s/g, "")}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white text-[15px] font-medium py-3 border-b border-slate-100 dark:border-white/5"
                >
                  {item}
                </a>
              ),
            )}
            <a
              href="#pricing"
              onClick={() => setIsMenuOpen(false)}
              className="mt-4 w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white text-[14px] font-bold py-3.5 rounded-xl text-center block shadow-md hover:opacity-90 transition-opacity"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </nav>
    </>
  );
};

export default NavLanding;
