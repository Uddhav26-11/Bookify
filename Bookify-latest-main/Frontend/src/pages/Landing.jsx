import { Link } from "react-router-dom";
import {
  ArrowRight, Camera, Sparkles, Truck, BookOpen, Package,
  GraduationCap, Repeat, ShoppingBag, CheckCircle2, CreditCard, Leaf,
} from "lucide-react";
import { categories, testimonials } from "../data/mockData";

const steps = [
  { icon: Camera, title: "Snap 4 photos", copy: "Cover, spine, corners, and any marked pages — that's all our model needs." },
  { icon: Sparkles, title: "Get an instant AI estimate", copy: "Our vision model reads condition and compares it against resale data in seconds." },
  { icon: Truck, title: "Schedule a pickup", copy: "An executive verifies the books at your door and confirms the final price." },
  { icon: BookOpen, title: "Get paid", copy: "Choose instant payment or credit within 24 hours — your call." },
];

const trustIndicators = ["Verified Sellers", "Secure Payments", "Fast Pickup", "Affordable Prices"];

const featureChips = [
  { icon: Package, label: "Free Pickup" },
  { icon: CreditCard, label: "Secure Payment" },
  { icon: Leaf, label: "Eco Friendly" },
];

const stats = [
  { value: "15K+", label: "Books Listed" },
  { value: "8K+", label: "Happy Students" },
  { value: "120+", label: "Cities" },
  { value: "4.9★", label: "Average Rating" },
];

const floatingCards = [
  { icon: BookOpen, label: "Stack of Books", tone: "bg-mint text-forest", pos: "top-0 left-4", tilt: "-4deg", delay: "0s" },
  { icon: GraduationCap, label: "Student Reading", tone: "bg-forest text-white", pos: "top-6 right-0", tilt: "3deg", delay: "0.4s" },
  { icon: Repeat, label: "Book Exchange", tone: "bg-white text-forest", pos: "top-40 left-0", tilt: "2deg", delay: "0.8s" },
  { icon: Package, label: "Delivery Box", tone: "bg-lime/60 text-forest-dark", pos: "top-48 right-8", tilt: "-3deg", delay: "1.2s" },
  { icon: ShoppingBag, label: "Online Marketplace", tone: "bg-white text-forest", pos: "top-80 left-10", tilt: "4deg", delay: "0.6s" },
  { icon: Truck, label: "Book Pickup", tone: "bg-forest-dark text-white", pos: "top-[21rem] right-2", tilt: "-2deg", delay: "1s" },
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[85vh] md:min-h-[90vh] flex items-center bg-paper">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-mint/60 via-paper to-paper" />
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-mint blur-3xl opacity-70" />
          <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-lime/30 blur-3xl opacity-60" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: "linear-gradient(var(--color-forest) 1px, transparent 1px), linear-gradient(90deg, var(--color-forest) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />
          <BookOpen className="hidden md:block absolute top-16 left-1/2 text-forest/20 animate-float-icon" size={30} />
          <Sparkles className="hidden md:block absolute bottom-24 left-1/3 text-lime/60 animate-float-icon" size={22} style={{ animationDelay: "1.5s" }} />
          <BookOpen className="hidden md:block absolute bottom-12 right-1/4 text-forest/15 animate-float-icon" size={26} style={{ animationDelay: "2.2s" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 text-xs font-mono font-medium text-forest bg-mint px-3 py-1.5 rounded-full mb-6 border border-mint-line">
              📚 India's Smart Used Book Marketplace
            </span>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-ink">
              Buy &amp; Sell <span className="text-forest">Used Books</span><br />
              Save Money. <span className="text-forest">Save Trees.</span>
            </h1>

            <p className="mt-5 text-lg text-gray-600 max-w-md leading-relaxed">
              Bookify helps students buy affordable second-hand books and sell old books in just a few clicks. Every book finds a new reader instead of collecting dust.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/sell"
                className="w-full sm:w-auto justify-center px-6 py-3 rounded-xl bg-forest text-white font-semibold shadow-lg shadow-forest/20 hover:bg-forest-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-forest/30 transition-all duration-300 flex items-center gap-2"
              >
                Sell Your Books <ArrowRight size={16} />
              </Link>
              <Link
                to="/marketplace"
                className="w-full sm:w-auto justify-center px-6 py-3 rounded-xl border border-mint-line bg-white text-ink font-semibold shadow-sm hover:bg-mint hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex items-center"
              >
                Browse Books
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {trustIndicators.map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 text-sm text-muted font-medium">
                  <CheckCircle2 size={15} className="text-forest" /> {t}
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {featureChips.map((f) => (
                <span
                  key={f.label}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest bg-white border border-mint-line px-3 py-1.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                >
                  <f.icon size={14} /> {f.label}
                </span>
              ))}
            </div>
          </div>

          {/* Right illustration */}
          <div className="relative h-[420px] sm:h-[480px] lg:h-[520px] order-first lg:order-last animate-slide-left">
            <div className="absolute inset-6 sm:inset-10 rounded-[2rem] bg-gradient-to-br from-mint via-white to-lime/20 border border-mint-line" />
            {floatingCards.map((c, i) => (
              <div
                key={c.label}
                className={`absolute ${c.pos} w-36 sm:w-40 rounded-2xl border border-white/60 shadow-xl backdrop-blur bg-white/80 p-4 animate-float-card`}
                style={{ "--tilt": c.tilt, animationDelay: c.delay }}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${c.tone}`}>
                  <c.icon size={18} />
                </div>
                <p className="text-xs font-semibold text-ink leading-snug">{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-6 -mt-10 sm:-mt-16 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-white/70 backdrop-blur border border-mint-line shadow-md p-5 text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
            >
              <p className="font-display text-2xl sm:text-3xl font-bold text-forest">{s.value}</p>
              <p className="text-xs sm:text-sm text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <h2 className="font-display text-2xl font-semibold text-ink mb-6">Browse categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((c) => (
            <Link key={c} to="/marketplace" className="rounded-2xl bg-mint border border-mint-line p-5 text-center font-medium text-ink hover:bg-forest hover:text-white transition">
              {c}
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-14">
        <h2 className="font-display text-2xl font-semibold text-ink mb-10">How Bookify works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.title} className="relative bg-white border border-mint-line rounded-2xl p-6">
              <span className="font-mono text-xs text-muted">STEP {i + 1}</span>
              <div className="w-11 h-11 rounded-xl bg-mint flex items-center justify-center text-forest my-3">
                <s.icon size={20} />
              </div>
              <h3 className="font-display font-semibold text-lg text-ink">{s.title}</h3>
              <p className="text-sm text-muted mt-1.5 leading-relaxed">{s.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <h2 className="font-display text-2xl font-semibold text-ink mb-10">What people are saying</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-mint rounded-2xl p-6 border border-mint-line">
              <p className="text-ink leading-relaxed">"{t.quote}"</p>
              <p className="mt-4 font-semibold text-sm text-ink">{t.name}</p>
              <p className="text-xs text-muted">{t.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}