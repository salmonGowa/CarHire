import React, { useState, useEffect, useRef } from "react";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../components/ThemeContext";
import ICONS from "../components/SvgIcons";
import { motion } from "framer-motion";
import FooterLanding from "../components/FooterLanding";
import NavLanding from "../components/NavLanding";

const SERVICES = [
  {
    icon: <ICONS.Building />,
    title: "Multi-Dealer Hub",
    desc: "Onboard unlimited dealers under one roof. Each gets isolated accounts, branding, and fleet management.",
    tag: "Core",
    accent: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-500/10",
    border: "border-blue-200 dark:border-blue-500/20",
  },
  {
    icon: <ICONS.Car />,
    title: "Smart Fleet Tracking",
    desc: "Real-time GPS tracking, maintenance scheduling, and automated alerts across all your vehicles.",
    tag: "AI-Powered",
    accent: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-100 dark:bg-violet-500/10",
    border: "border-violet-200 dark:border-violet-500/20",
  },
  {
    icon: <ICONS.Clipboard />,
    title: "Booking & Rentals",
    desc: "End-to-end booking management. Digital contracts, e-signatures, and integrated M-PESA payments.",
    tag: "Popular",
    accent: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-500/10",
    border: "border-emerald-200 dark:border-emerald-500/20",
  },
  {
    icon: <ICONS.CircleDollar />,
    title: "Revenue Analytics",
    desc: "Deep financial insights across all dealers. Commission management and KRA-compliant invoicing.",
    tag: "Finance",
    accent: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-10０ dark:bg-amber-5００/１０",
    border: "border-amber-2００ dark:border-amber-5００/２０",
  },
  {
    icon: <ICONS.Users />,
    title: "HR & Payroll",
    desc: "Manage drivers and staff. Automated payroll with PAYE, NHIF, and NSSF compliance.",
    tag: "HR",
    accent: "text-rose-6００ dark:text-rose-4００",
    bg: "bg-rose-1００ dark:bg-rose-5００/１０",
    border: "border-rose-2００ dark:border-rose-5００/２０",
  },
  {
    icon: <ICONS.Lock />,
    title: "Role-Based Access",
    desc: "Granular permissions for Super Admins, Admins, HR, Dealers, and Customers with full audit trails.",
    tag: "Security",
    accent: "text-cyan-6００ dark:text-cyan-4００",
    bg: "bg-cyan-1００ dark:bg-cyan-5０₀/１₀",
    border: "border-cyan-2０₀ dark:border-cyan-5０₀/２₀",
  },
  {
    icon: <ICONS.Zap />,
    title: "Mobile-First Design",
    desc: "Fully responsive across all devices. Customers book on mobile, dealers manage on tablet.",
    tag: "UX",
    accent: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-100 dark:bg-pink-500/10",
    border: "border-pink-200 dark:border-pink-500/20",
  },
  {
    icon: <ICONS.BarChart />,
    title: "Real-Time Notifications",
    desc: "Instant alerts for bookings, payments, and incidents via SMS, email, and push notifications.",
    tag: "Comms",
    accent: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-500/10",
    border: "border-orange-200 dark:border-orange-500/20",
  },
  {
    icon: <ICONS.Clipboard />,
    title: "Reports & Compliance",
    desc: "One-click reports for every regulatory need. Export to Excel, PDF, and integrate with accounting tools.",
    tag: "Reporting",
    accent: "text-lime-600 dark:text-lime-400",
    bg: "bg-lime-100 dark:bg-lime-500/10",
    border: "border-lime-200 dark:border-lime-500/2０",
  },
];

const REVIEWS = [
  {
    name: "Grace Wanjiku",
    role: "Owner, Swift Car Hire",
    city: "Nairobi",
    color: "hsl(210,55%,50%)",
    darkColor: "hsl(210,55%,35%)",
    quote:
      "We moved from WhatsApp bookings to DriveFleet Pro 8 months ago. Bookings up 340%, zero double-bookings. Absolute game changer for our business.",
  },
  {
    name: "James Otieno",
    role: "Fleet Manager, Premier Auto",
    city: "Mombasa",
    color: "hsl(260,55%,50%)",
    darkColor: "hsl(260,55%,35%)",
    quote:
      "The multi-dealer dashboard is incredible. I can see every vehicle, every booking, every driver across 3 branches from my phone. Saves me 4 hours daily.",
  },
  {
    name: "Amina Hassan",
    role: "HR Manager, Luxe Drive",
    city: "Nakuru",
    color: "hsl(160,55%,45%)",
    darkColor: "hsl(160,55%,30%)",
    quote:
      "The payroll module handles PAYE automatically. What used to take our accountant 2 full days every month now happens in minutes. Absolutely brilliant.",
  },
  {
    name: "Samuel Mutua",
    role: "CEO, Budget Wheels",
    city: "Kisumu",
    color: "hsl(35,60%,50%)",
    darkColor: "hsl(35,60%,35%)",
    quote:
      "Customers love booking online and tracking their rental status. Our review score went from 3.8 to 4.9 in just 3 months on this platform.",
  },
  {
    name: "Fatuma Mohamed",
    role: "Dealer, City Movers",
    city: "Nairobi",
    color: "hsl(340,55%,50%)",
    darkColor: "hsl(340,55%,35%)",
    quote:
      "The pricing is fair — no setup fees, just a small percentage of what we earn. Support team responds on WhatsApp within minutes. Highly recommend.",
  },
  {
    name: "Brian Kamau",
    role: "Director, Alpha Rentals",
    city: "Thika",
    color: "hsl(195,55%,45%)",
    darkColor: "hsl(195,55%,30%)",
    quote:
      "DriveFleet Pro's analytics helped us identify underperforming vehicles and retire them. We now run at 94% fleet utilisation.",
  },
];

const PLANS = [
  {
    name: "Starter",
    monthly: 2999,
    annual: 2499,
    desc: "For solo dealers just getting started",
    accentCls: "text-blue-600 dark:text-blue-400",
    bgCls: "bg-blue-100 dark:bg-blue-500/10",
    borderCls: "border-blue-200 dark:border-blue-500/25",
    btnCls:
      "border border-blue-200 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/8 hover:bg-blue-100 dark:hover:bg-blue-500/15",
    featured: false,
    features: [
      "Up to 10 vehicles",
      "1 dealer account",
      "Basic booking management",
      "M-PESA payments",
      "Email support",
      "Mobile app access",
    ],
  },
  {
    name: "Business",
    monthly: 8999,
    annual: 7499,
    desc: "For growing dealerships with active fleets",
    accentCls: "text-violet-600 dark:text-violet-400",
    bgCls: "bg-violet-100 dark:bg-violet-500/10",
    borderCls: "border-violet-300 dark:border-violet-500/50",
    btnCls:
      "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-xl shadow-violet-200 dark:shadow-violet-900/30",
    featured: true,
    features: [
      "Up to 50 vehicles",
      "3 dealer accounts",
      "Advanced analytics",
      "GPS fleet tracking",
      "HR & payroll module",
      "Priority WhatsApp support",
      "Custom branding",
      "API access",
    ],
  },
  {
    name: "Enterprise",
    monthly: null,
    annual: null,
    desc: "For large-scale multi-location operations",
    accentCls: "text-emerald-600 dark:text-emerald-400",
    bgCls: "bg-emerald-100 dark:bg-emerald-500/10",
    borderCls: "border-emerald-200 dark:border-emerald-500/25",
    btnCls:
      "border border-emerald-200 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/8 hover:bg-emerald-100 dark:hover:bg-emerald-500/15",
    featured: false,
    features: [
      "Unlimited vehicles",
      "Unlimited dealer accounts",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "On-site training",
      "White-label solution",
      "24/7 phone support",
    ],
  },
];
const FLEET_DATA = [
  {
    id: 1,
    name: "BMW 5 Series",
    category: "Luxury",
    dealer: "Swift Car Hire · Nairobi CBD",
    price: "12,000",
    image:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80&auto=format&fit=crop",
    tags: ["Auto", "5 Seats", "A/C", "GPS"],
    rating: <ICONS.StarFilled />,
    reviews: 128,
    delay: "0s",
    colors: {
      hoverBorder: "hover:border-blue-300 dark:hover:border-blue-500/40",
      hoverShadow: "dark:hover:shadow-blue-900/30",
      badgeBg: "bg-blue-600",
      priceText: "text-blue-600 dark:text-blue-400",
      btnBg: "bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500",
    },
  },
  {
    id: 2,
    name: "Toyota Land Cruiser",
    category: "4×4 SUV",
    dealer: "Premier Auto · Westlands",
    price: "18,000",
    image:
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80&auto=format&fit=crop",
    tags: ["4WD", "7 Seats", "Leather", "Sunroof"],
    rating: <ICONS.StarFilled />,
    reviews: 94,
    delay: "0.1s",
    colors: {
      hoverBorder: "hover:border-violet-300 dark:hover:border-violet-500/40",
      hoverShadow: "dark:hover:shadow-violet-900/30",
      badgeBg: "bg-violet-600",
      priceText: "text-violet-600 dark:text-violet-400",
      btnBg: "bg-violet-600 hover:bg-violet-700 dark:hover:bg-violet-500",
    },
  },
  {
    id: 3,
    name: "Toyota Corolla",
    category: "Economy",
    dealer: "City Movers · Upper Hill",
    price: "4,500",
    image:
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80&auto=format&fit=crop",
    tags: ["Auto", "5 Seats", "A/C", "Bluetooth"],
    rating: <ICONS.StarFilled />,
    reviews: 203,
    delay: "0.2s",
    colors: {
      hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-500/40",
      hoverShadow: "dark:hover:shadow-emerald-900/30",
      badgeBg: "bg-emerald-600",
      priceText: "text-emerald-600 dark:text-emerald-400",
      btnBg: "bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500",
    },
  },
];
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 70, damping: 15 },
  },
};

export default function LandingPage() {
  const { isDark } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const countersRef = useRef([]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("show");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    document
      .querySelectorAll(".reveal, .reveal-left, .reveal-right")
      .forEach((el) => observer.observe(el));

    const counterObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target;
            const target = parseInt(el.dataset.count, 10);
            const suffix = el.dataset.suffix || "";
            let cur = 0;
            const step = Math.ceil(target / 120);
            const t = setInterval(() => {
              cur = Math.min(cur + step, target);
              el.textContent = cur.toLocaleString() + suffix;
              if (cur >= target) clearInterval(t);
            }, 14);
            counterObs.unobserve(el);
          }
        });
      },
      { threshold: 0.5 },
    );

    countersRef.current.forEach((el) => el && counterObs.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
      counterObs.disconnect();
    };
  }, []);

  return (
    <div className="bg-slate-50 dark:bg-[#030711] text-slate-900 dark:text-white font-sans antialiased overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-900 dark:selection:text-blue-200 transition-colors duration-300">
      <NavLanding />

      <section
        id="hero"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=1920&q=80&auto=format&fit=crop"
            alt="Luxury car fleet"
            className="w-full h-full object-cover object-center"
          />
          {/* Light/Dark gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/95 via-slate-100/90 to-slate-100/80 dark:from-[#030711]/95 dark:via-[#030711]/90 dark:to-[#030711]/80"></div>
        </div>

        {/* grid overlay */}
        <div
          className="absolute inset-0 z-0 opacity-30 dark:opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(59,130,246,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.15) 1px,transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage:
              "radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 70%)",
          }}
        ></div>

        {/* Glow orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-blue-300/20 dark:bg-blue-600/15 blur-[120px] pointer-events-none animate-pulse-glow"></div>
        <div className="absolute top-1/4 right-[10%] w-64 h-64 rounded-full bg-violet-300/30 dark:bg-violet-600/10 blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-[10%] w-72 h-72 rounded-full bg-cyan-300/20 dark:bg-cyan-600/10 blur-[80px] pointer-events-none"></div>

        {/* Hero content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 w-full pt-32 pb-20 flex flex-col items-center text-center">
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="font-display font-black leading-[1.1] mb-6 text-slate-900 dark:text-white max-w-4xl"
          >
            <span className="block text-[clamp(40px,6vw,42px)] mb-2">
              Manage Every Rental.
            </span>
            <span className="block text-[clamp(40px,6vw,42px)] mb-2">
              Every Dealer.
            </span>
            <span className="block text-[clamp(24px,4vw,36px)] bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-violet-500 to-cyan-500 dark:from-blue-400 dark:via-violet-400 dark:to-cyan-400 drop-shadow-sm">
              One Central Hub.
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="text-slate-600 dark:text-white/60 text-[clamp(16px,1.6vw,20px)] leading-[1.8] max-w-2xl mb-12"
          >
            The all-in-one fleet management platform built for car hire
            operators across East Africa. Real-time bookings, fleet tracking,
            payroll, and more.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            className="flex flex-wrap justify-center gap-5 mb-16 w-full"
          >
            <a
              href="#pricing"
              className="bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-[15px] px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl dark:btn-glow transition-all hover:-translate-y-1 inline-flex items-center justify-center min-w-[200px]"
            >
              Start Free Trial
            </a>
            <a
              href="#how"
              className="bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white/90 font-semibold text-[15px] px-8 py-4 rounded-2xl backdrop-blur-md hover:bg-white dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all inline-flex items-center justify-center min-w-[200px] shadow-sm"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              See How It Works
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6 sm:gap-12 w-full max-w-4xl border-t border-slate-200 dark:border-white/10 pt-10"
          >
            {[
              { num: 1200, suff: "+", label: "Vehicles Listed" },
              { num: 47, suff: "+", label: "Partner Dealers" },
              { num: 8431, suff: "+", label: "Happy Customers" },
              
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <p
                  className="font-display font-black text-[clamp(24px,2vw,28px)] text-slate-900 dark:text-white leading-none tracking-tight"
                  data-count={stat.num}
                  data-suffix={stat.suff}
                  ref={(el) => (countersRef.current[i] = el)}
                >
                  0{stat.suff}
                </p>
                <p className="text-slate-500 dark:text-white/40 text-[12px] uppercase tracking-[0.1em] font-bold mt-2">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FLEET SHOWCASE */}
      <section
        id="fleet"
        className="py-24 sm:py-32 bg-slate-50 dark:bg-[#030711]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* Header */}
          <div className="text-center mb-16 reveal">
            <h2 className="font-display font-black text-[clamp(28px,4.5vw,54px)] leading-tight text-slate-900 dark:text-white mb-4">
              Premium vehicles for
              <br />
              <span className="gradient-text">every journey</span>
            </h2>
            <p className="text-slate-600 dark:text-white/45 text-[clamp(14px,1.4vw,17px)] max-w-lg mx-auto leading-relaxed">
              From city cruisers to rugged 4×4s. Every vehicle GPS-tracked,
              insured, and maintained to the highest standards.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FLEET_DATA.map((car) => (
              <div
                key={car.id}
                className={`group bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/8 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-2xl reveal ${car.colors.hoverBorder} ${car.colors.hoverShadow}`}
                style={{ transitionDelay: car.delay }}
              >
                {/* Image & Badges */}
                <div className="img-zoom h-52 bg-slate-200 dark:bg-slate-800 relative">
                  <img
                    src={car.image}
                    alt={car.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <span
                    className={`absolute top-3.5 left-3.5 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-md ${car.colors.badgeBg}`}
                  >
                    {car.category}
                  </span>
                  <span className="absolute top-3.5 right-3.5 bg-emerald-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                    Available
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">
                        {car.name}
                      </h3>
                      <p className="text-slate-500 dark:text-white/45 text-xs mt-0.5">
                        {car.dealer}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-display font-black text-lg leading-none ${car.colors.priceText}`}
                      >
                        KSH {car.price}
                      </p>
                      <p className="text-slate-400 dark:text-white/30 text-[10px]">
                        /day
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex gap-2 flex-wrap mb-4">
                    {car.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 text-slate-600 dark:text-white/50 px-2.5 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Footer (Rating & Button) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 text-xs">
                      {car.rating}{" "}
                      <span className="text-slate-400 dark:text-white/30 ml-1">
                        ({car.reviews})
                      </span>
                    </div>
                    <button
                      className={`text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm ${car.colors.btnBg}`}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="text-center mt-10 reveal">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold border border-blue-200 dark:border-blue-500/25 hover:border-blue-300 dark:hover:border-blue-500/50 px-6 py-3 rounded-xl transition-all bg-blue-50 dark:bg-transparent hover:bg-blue-100 dark:hover:bg-blue-500/8 shadow-sm"
            >
              Browse all 1,200+ vehicles
            </a>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section
        id="services"
        className="py-24 sm:py-32 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-[#040a1c] dark:to-[#030711] relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-300 dark:via-blue-500/30 to-transparent"></div>
        <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-blue-400/10 dark:bg-blue-600/5 blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-full px-4 py-1.5 mb-5">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 tracking-widest uppercase">
                What We Offer
              </span>
            </div>
            <h2 className="font-display font-black text-[clamp(28px,4.5vw,56px)] leading-tight text-slate-900 dark:text-white mb-4">
              Everything your fleet
              <br />
              <span className="gradient-text">operation needs</span>
            </h2>
            <p className="text-slate-600 dark:text-white/45 text-[clamp(14px,1.4vw,17px)] max-w-lg mx-auto leading-relaxed">
              Purpose-built for the East African car hire market. One platform
              that scales from a solo dealer to a full enterprise network.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((s, i) => {
              const delay = (i % 3) * 0.07 + Math.floor(i / 3) * 0.1;
              return (
                <div
                  key={i}
                  className="group bg-white dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.15] shadow-sm dark:shadow-none hover:shadow-md hover:-translate-y-1 rounded-2xl p-6 transition-all duration-300 reveal cursor-default"
                  style={{ transitionDelay: `${delay}s` }}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className={`w-12 h-12 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center text-2xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}
                    >
                      {s.icon}
                    </div>
                    <span
                      className={`text-[9px] font-black ${s.accent} ${s.bg} border ${s.border} px-2.5 py-1 rounded-full uppercase tracking-[0.08em]`}
                    >
                      {s.tag}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-slate-900 dark:text-white text-[15px] mb-2.5 leading-snug">
                    {s.title}
                  </h3>
                  <p className="text-slate-600 dark:text-white/40 text-[13px] leading-relaxed">
                    {s.desc}
                  </p>
                  <div
                    className={`mt-4 flex items-center gap-1.5 ${s.accent} text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0`}
                  >
                    Learn more <span className="text-base">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how"
        className="py-24 sm:py-32 bg-slate-50 dark:bg-[#030711] relative overflow-hidden"
      >
        {/* Top subtle gradient border */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-300 dark:via-violet-500/30 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* Header Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-full px-4 py-1.5 mb-5 shadow-sm">
              <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300 tracking-widest uppercase">
                How It Works
              </span>
            </div>

            <h2 className="font-display font-black text-[clamp(28px,4.5vw,56px)] leading-tight text-slate-900 dark:text-white mb-4">
              Live in{" "}
              <span className="bg-gradient-to-br from-violet-500 to-pink-500 bg-clip-text text-transparent">
                4 simple steps
              </span>
            </h2>

            <p className="text-slate-600 dark:text-white/60 text-[clamp(14px,1.4vw,17px)] max-w-md mx-auto leading-relaxed">
              No technical expertise needed. Start accepting bookings on the
              very same day you sign up.
            </p>
          </motion.div>

          {/* Steps Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative"
          >
            {/* Connecting Line */}
            <div className="hidden lg:block absolute top-[40px] left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-blue-300/50 dark:from-blue-500/20 via-violet-300/50 dark:via-violet-500/40 to-amber-300/50 dark:to-amber-500/20 z-0"></div>

            {/* Step 1 */}
            <motion.div
              variants={itemVariants}
              className="relative z-10 text-center px-4"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-600/20 dark:to-blue-800/10 border border-blue-200 dark:border-blue-500/25 shadow-lg shadow-blue-500/5 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-6 relative group hover:-translate-y-1 transition-transform duration-300">
                <ICONS.StoreIcon />
                <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[10px] font-black text-white border-[3px] border-slate-50 dark:border-[#030711] shadow-sm">
                  1
                </span>
              </div>
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base mb-3">
                Register Dealership
              </h3>
              <p className="text-slate-500 dark:text-white/50 text-sm leading-relaxed max-w-[240px] mx-auto">
                Sign up, add your business details, and get your fully branded
                dealer portal in minutes.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              variants={itemVariants}
              className="relative z-10 text-center px-4"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-600/20 dark:to-violet-800/10 border border-violet-200 dark:border-violet-500/25 shadow-lg shadow-violet-500/5 flex items-center justify-center text-violet-600 dark:text-violet-400 mx-auto mb-6 relative group hover:-translate-y-1 transition-transform duration-300">
                <ICONS.CarIcon />
                <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-[10px] font-black text-white border-[3px] border-slate-50 dark:border-[#030711] shadow-sm">
                  2
                </span>
              </div>
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base mb-3">
                Upload Your Fleet
              </h3>
              <p className="text-slate-500 dark:text-white/50 text-sm leading-relaxed max-w-[240px] mx-auto">
                Add vehicles with photos and specs. AI suggests optimal daily
                rates for your market.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              variants={itemVariants}
              className="relative z-10 text-center px-4"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-600/20 dark:to-emerald-800/10 border border-emerald-200 dark:border-emerald-500/25 shadow-lg shadow-emerald-500/5 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-6 relative group hover:-translate-y-1 transition-transform duration-300">
                <ICONS.SmartphoneIcon />
                <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[10px] font-black text-white border-[3px] border-slate-50 dark:border-[#030711] shadow-sm">
                  3
                </span>
              </div>
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base mb-3">
                Customers Book
              </h3>
              <p className="text-slate-500 dark:text-white/50 text-sm leading-relaxed max-w-[240px] mx-auto">
                Clients search, compare, and book instantly via your dedicated
                portal or the marketplace.
              </p>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              variants={itemVariants}
              className="relative z-10 text-center px-4"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-600/20 dark:to-amber-800/10 border border-amber-200 dark:border-amber-500/25 shadow-lg shadow-amber-500/5 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto mb-6 relative group hover:-translate-y-1 transition-transform duration-300">
                <ICONS.BanknoteIcon />
                <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-[10px] font-black text-white border-[3px] border-slate-50 dark:border-[#030711] shadow-sm">
                  4
                </span>
              </div>
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base mb-3">
                Track & Earn
              </h3>
              <p className="text-slate-500 dark:text-white/50 text-sm leading-relaxed max-w-[240px] mx-auto">
                Monitor rentals in real-time. Payments settle directly to your
                M-PESA or bank account.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/*ABOUT */}
      <section
        id="about"
        className="py-24 sm:py-32 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#030711] dark:to-[#040a1c] relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-300 dark:via-emerald-500/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-emerald-400/10 dark:bg-emerald-600/5 blur-[80px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative reveal-left">
              <div className="grid grid-cols-2 gap-3">
                <div className="img-zoom rounded-2xl overflow-hidden aspect-[4/3] shadow-md dark:shadow-none">
                  <img
                    src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=500&q=80&auto=format&fit=crop"
                    alt="Driver with keys"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="img-zoom rounded-2xl overflow-hidden aspect-[4/3] mt-6 shadow-md dark:shadow-none">
                  <img
                    src="https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&q=80&auto=format&fit=crop"
                    alt="Luxury car side"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="img-zoom rounded-2xl overflow-hidden aspect-[4/3] shadow-md dark:shadow-none">
                  <img
                    src="https://images.unsplash.com/photo-1546614042-7df3c24c9e5d?w=500&q=80&auto=format&fit=crop"
                    alt="Car fleet"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="img-zoom rounded-2xl overflow-hidden aspect-[4/3] -mt-6 shadow-md dark:shadow-none">
                  <img
                    src="https://images.unsplash.com/photo-1502877338535-766e1452684a?w=500&q=80&auto=format&fit=crop"
                    alt="Dealership"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="reveal-right">
              {/* <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 tracking-widest uppercase">
                  About DriveFleet Pro
                </span>
              </div> */}
              <h2 className="font-display font-black text-[clamp(28px,4vw,50px)] leading-tight text-slate-900 dark:text-white mb-5">
                Built in Kenya,
                <br />
                <span className="gradient-text-green">for Africa</span>
              </h2>
              <p className="text-slate-600 dark:text-white/50 text-[15px] leading-[1.85] mb-5">
                Founded in Nairobi, DriveFleet was built by fleet
                operators and engineers who were tired of managing rentals over
                WhatsApp and spreadsheets. We knew there had to be a better way.
              </p>
              <p className="text-slate-600 dark:text-white/50 text-[15px] leading-[1.85] mb-8">
                Today we power 47+ dealerships across Kenya, Uganda, and
                Tanzania managing over 1,200 vehicles and processing millions
                in monthly transactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/*TESTIMONIALS */}
      <section
        id="testimonials"
        className="py-24 sm:py-32 bg-slate-50 dark:bg-[#030711] relative"
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-300 dark:via-amber-500/25 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full px-4 py-1.5 mb-5">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 tracking-widest uppercase">
                Customer Stories
              </span>
            </div>
            <h2 className="font-display font-black text-[clamp(28px,4.5vw,56px)] leading-tight text-slate-900 dark:text-white mb-4">
              Loved by fleet operators
              <br />
              <span className="gradient-text-gold">across East Africa</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {REVIEWS.map((r, i) => {
              const delay = (i % 3) * 0.08 + Math.floor(i / 3) * 0.12;
              return (
                <div
                  key={i}
                  className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl p-6 hover:border-slate-300 dark:hover:border-white/14 hover:shadow-md hover:-translate-y-1 transition-all duration-300 reveal"
                  style={{ transitionDelay: `${delay}s` }}
                >
                  <div className="flex gap-0.5 mb-4 text-amber-400 text-sm">
                    {ICONS.Star}
                  </div>
                  <p className="text-slate-600 dark:text-white/55 text-[13px] leading-[1.78] mb-5 italic">
                    "{r.quote}"
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/6">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm text-white flex-shrink-0"
                      style={{ background: isDark ? r.darkColor : r.color }}
                    >
                      {r.name[0]}
                    </div>
                    <div>
                      <p className="text-slate-900 dark:text-white text-[13px] font-semibold leading-none">
                        {r.name}
                      </p>
                      <p className="text-slate-500 dark:text-white/32 text-[11px] mt-1">
                        {r.role} · {r.city}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/*  PRICING */}
      <section
        id="pricing"
        className="py-24 sm:py-32 bg-slate-100 dark:bg-gradient-to-b dark:from-[#040a1c] dark:to-[#030711] relative"
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-300 dark:via-violet-500/30 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-full px-4 py-1.5 mb-5">
              <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300 tracking-widest uppercase">
                Pricing
              </span>
            </div>
            <h2 className="font-display font-black text-[clamp(28px,4.5vw,56px)] leading-tight text-slate-900 dark:text-white mb-4">
              Simple, transparent{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-cyan-400">
                pricing
              </span>
            </h2>
            <p className="text-slate-600 dark:text-white/45 text-base max-w-sm mx-auto mb-7">
              No hidden fees. Start free for 14 days, no credit card required.
            </p>

            <div className="inline-flex items-center gap-4 bg-white dark:bg-white/4 border border-slate-200 dark:border-white/8 rounded-full px-5 py-2.5 shadow-sm dark:shadow-none">
              <span
                className="text-sm font-semibold transition-colors"
                style={{
                  color: isAnnual ? "var(--color-slate-400)" : "inherit",
                }}
              >
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-11 h-6 rounded-full transition-colors duration-300 relative flex-shrink-0 bg-slate-200 dark:bg-white/15"
                style={{ background: isAnnual ? "#7c3aed" : "" }}
              >
                <span
                  className="absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow transition-all duration-300"
                  style={{ left: isAnnual ? "25px" : "3px" }}
                ></span>
              </button>
              <span
                className={`text-sm font-semibold transition-colors ${isAnnual ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-white/40"}`}
              >
                Annual{" "}
                <span className="text-emerald-500 dark:text-emerald-400 font-bold">
                  −17%
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLANS.map((p, i) => {
              const price =
                p.monthly === null ? null : isAnnual ? p.annual : p.monthly;
              return (
                <div
                  key={i}
                  className={`relative rounded-3xl p-8 border transition-all duration-300 reveal ${p.featured ? `bg-white dark:bg-gradient-to-b dark:from-violet-600/15 dark:to-blue-600/10 ${p.borderCls} shadow-xl dark:shadow-2xl dark:shadow-violet-900/20 scale-[1.02] border-blue-200 dark:border-violet-500/50` : `bg-slate-50 dark:bg-white/[0.025] ${p.borderCls} border-slate-200 hover:-translate-y-1 shadow-sm dark:shadow-none`}`}
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  {p.featured && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-violet-600 dark:from-violet-600 dark:to-blue-600 text-white text-[10px] font-black px-5 py-1.5 rounded-b-xl tracking-widest uppercase shadow-md">
                      Most Popular
                    </div>
                  )}
                  <div
                    className={`${p.accentCls} font-display font-black text-sm mb-2`}
                  >
                    {p.name}
                  </div>
                  <div className="font-display font-black text-slate-900 dark:text-white mb-1.5">
                    {price !== null ? (
                      <>
                        <span className="text-[42px] tracking-tight">
                          KSH {price.toLocaleString()}
                        </span>
                        <span className="text-sm font-normal text-slate-500 dark:text-white/35">
                          /mo
                        </span>
                      </>
                    ) : (
                      <span className="text-[36px]">Custom</span>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-white/38 text-sm leading-relaxed mb-7">
                    {p.desc}
                  </p>
                  <div className="space-y-3 mb-8">
                    {p.features.map((f, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <div
                          className={`w-4 h-4 rounded-full ${p.bgCls} border ${p.borderCls} flex items-center justify-center ${p.accentCls} text-[9px] font-black flex-shrink-0 mt-0.5`}
                        >
                          <ICONS.Check/>
                        </div>
                        <span className="text-slate-700 dark:text-white/55 text-[13px] leading-relaxed">
                          {f}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${p.btnCls}`}
                  >
                    {p.featured
                      ? "Get Started"
                      : p.monthly === null
                        ? "Contact Sales"
                        : "Start Free Trial"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="py-16 sm:py-24 bg-slate-50 dark:bg-[#030711]">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <div className="relative bg-gradient-to-br from-blue-50 via-violet-50 to-cyan-50 dark:from-blue-600/15 dark:via-violet-600/12 dark:to-cyan-600/10 border border-blue-100 dark:border-violet-500/20 rounded-3xl p-10 sm:p-16 text-center overflow-hidden reveal shadow-md dark:shadow-none">
            <div className="absolute -top-20 left-1/4 w-80 h-80 rounded-full bg-violet-400/20 dark:bg-violet-600/15 blur-[80px] pointer-events-none"></div>
            <div className="absolute -bottom-20 right-1/4 w-64 h-64 rounded-full bg-blue-400/20 dark:bg-blue-600/12 blur-[70px] pointer-events-none"></div>
            <div className="relative">
              <h2 className="font-display font-black text-[clamp(18px,4vw,26px)] leading-tight text-slate-900 dark:text-white mb-5">
                Ready to transform
                
                your fleet business?
              </h2>
              <p className="text-slate-600 dark:text-white/50 text-[clamp(14px,1.4vw,17px)] max-w-md mx-auto mb-10 leading-relaxed">
                Join 47+ dealerships already using DriveFleet. 14-day free
                trial, no credit card required.
              </p>
              <div className="flex flex-wrap gap-4 justify-center mb-6">
                <a
                  href="#pricing"
                  className="bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-[15px] px-10 py-4 rounded-2xl shadow-lg hover:shadow-xl dark:btn-glow transition-all hover:-translate-y-0.5 inline-block"
                >
                  Start Free Trial — 14 Days
                </a>
                <a
                  href="#footer"
                  className="bg-white dark:bg-white/6 border border-slate-200 dark:border-white/12 text-slate-800 dark:text-white/85 font-semibold text-[15px] px-10 py-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/25 transition-all inline-block shadow-sm"
                >
                  Book a Demo
                </a>
              </div>
              <p className="text-slate-500 dark:text-white/25 text-xs">
                No setup fees · Cancel anytime · M-PESA & Card accepted
              </p>
            </div>
          </div>
        </div>
      </section>
      <FooterLanding />
    </div>
  );
}
