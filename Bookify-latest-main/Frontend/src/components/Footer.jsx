import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Logo from "./Logo";

// Footer is mounted globally in App.jsx. It:
//  - never renders on the admin dashboard (admin has its own sidebar/shell).
//  - for a logged-in seller/customer, every link routes back to their own
//    dashboard (there are no separate "Marketplace"/"About" pages inside a
//    dashboard session, so this keeps the footer useful instead of dead text).
//  - for a logged-out visitor, it behaves like the normal pre-login footer
//    with links to the marketplace, selling flow, and login.
export default function Footer() {
  const location = useLocation();
  const { role } = useSelector((s) => s.auth);

  if (location.pathname.startsWith("/admin")) return null;

  const dashboardPath = role === "seller" ? "/seller" : role === "customer" ? "/customer" : null;

  const homeLink = dashboardPath || "/";

  // When logged in, every footer link just takes the user back to their
  // dashboard. When logged out, links point to the relevant real pages.
  const marketplaceLinks = dashboardPath
    ? [{ label: "NCERT Books", to: dashboardPath }, { label: "Competitive Exams", to: dashboardPath }, { label: "College Books", to: dashboardPath }, { label: "Reference Books", to: dashboardPath }]
    : [
        { label: "NCERT Books", to: "/marketplace" },
        { label: "Competitive Exams", to: "/marketplace" },
        { label: "College Books", to: "/marketplace" },
        { label: "Reference Books", to: "/marketplace" },
      ];

  const sellLinks = dashboardPath
    ? [{ label: "Get an AI estimate", to: dashboardPath }, { label: "Schedule a pickup", to: dashboardPath }, { label: "Track your payout", to: dashboardPath }]
    : [
        { label: "Get an AI estimate", to: "/register/seller" },
        { label: "Schedule a pickup", to: "/register/seller" },
        { label: "Track your payout", to: "/login" },
      ];

  const companyLinks = dashboardPath
    ? [{ label: "About", to: dashboardPath }, { label: "Support", to: dashboardPath }, { label: "Terms", to: dashboardPath }]
    : [{ label: "About", to: "/" }, { label: "Support", to: "/" }, { label: "Terms", to: "/" }];

  return (
    <footer className="bg-ink text-white/70 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <Link to={homeLink}>
            <Logo className="[&_span]:text-white mb-3" />
          </Link>
          <p className="text-sm leading-relaxed max-w-xs">Turning yesterday's textbooks into today's fair price, one scan at a time.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold text-sm mb-3">Marketplace</h4>
          <ul className="space-y-2 text-sm">
            {marketplaceLinks.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="hover:text-white transition">{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold text-sm mb-3">Sell with us</h4>
          <ul className="space-y-2 text-sm">
            {sellLinks.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="hover:text-white transition">{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold text-sm mb-3">Company</h4>
          <ul className="space-y-2 text-sm">
            {companyLinks.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="hover:text-white transition">{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs">© 2026 Bookify. All rights reserved.</div>
    </footer>
  );
}
