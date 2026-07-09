import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-ink text-white/70 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <Logo className="[&_span]:text-white mb-3" />
          <p className="text-sm leading-relaxed max-w-xs">Turning yesterday's textbooks into today's fair price, one scan at a time.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold text-sm mb-3">Marketplace</h4>
          <ul className="space-y-2 text-sm">
            <li>NCERT Books</li>
            <li>Competitive Exams</li>
            <li>College Books</li>
            <li>Reference Books</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold text-sm mb-3">Sell with us</h4>
          <ul className="space-y-2 text-sm">
            <li>Get an AI estimate</li>
            <li>Schedule a pickup</li>
            <li>Track your payout</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold text-sm mb-3">Company</h4>
          <ul className="space-y-2 text-sm">
            <li>About</li>
            <li>Support</li>
            <li>Terms</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs">© 2026 Bookify. All rights reserved.</div>
    </footer>
  );
}
