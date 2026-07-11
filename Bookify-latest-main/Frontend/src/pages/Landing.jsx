import { Link } from "react-router-dom";
import { ArrowRight, Camera, Sparkles, Truck, BookOpen } from "lucide-react";
import { categories, testimonials } from "../data/mockData";

const steps = [
  { icon: Camera, title: "Snap 4 photos", copy: "Cover, spine, corners, and any marked pages — that's all our model needs." },
  { icon: Sparkles, title: "Get an instant AI estimate", copy: "Our vision model reads condition and compares it against resale data in seconds." },
  { icon: Truck, title: "Schedule a pickup", copy: "An executive verifies the books at your door and confirms the final price." },
  { icon: BookOpen, title: "Get paid", copy: "Choose instant payment or credit within 24 hours — your call." },
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-mono font-medium text-forest bg-mint px-3 py-1 rounded-full mb-6">
              <Sparkles size={12} /> AI condition grading, in your pocket
            </span>
            <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[1.05] text-ink">
              Sell your old books,<br /> instantly.
            </h1>
            <p className="mt-5 text-lg text-muted max-w-md">
              Upload photos, get AI price estimates and earn money — then buy your next set for less than half the MRP.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/sell" className="px-6 py-3 rounded-full btn-brand text-white font-semibold transition flex items-center gap-2">
                Sell Books <ArrowRight size={16} />
              </Link>
              <Link to="/marketplace" className="px-6 py-3 rounded-full border border-mint-line text-ink font-semibold hover:bg-mint transition">
                Buy Books
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="grade-scan rounded-3xl overflow-hidden border border-mint-line shadow-xl shadow-forest/5">
              <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=70" alt="Stack of used books" className="w-full h-full object-cover aspect-[4/3]" />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted font-mono">AI Estimate</p>
                  <p className="font-display text-2xl font-semibold text-ink">₹234</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted font-mono">Confidence</p>
                  <p className="font-mono font-semibold text-forest">91%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <h2 className="font-display text-2xl font-semibold text-ink mb-6">Browse categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((c) => (
            <Link key={c} to="/marketplace" className="rounded-2xl bg-mint border border-mint-line p-5 text-center font-medium text-ink hover:text-white hover:shadow-lg hover:shadow-forest/20 hover:[background:var(--brand-gradient)] hover:border-transparent transition-all duration-300">
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