import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ShieldCheck, Mail, User, CreditCard, Wallet, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import api from "../../api/axios";

export default function AdminSettings() {
  const { name, email, role } = useSelector((s) => s.auth);

  const [stripeInfo, setStripeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStripeInfo = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/admin/stripe-account");
      setStripeInfo(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load Stripe account details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStripeInfo();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">Settings</h1>
      <p className="text-muted text-sm mb-6">Your admin account details.</p>

      <div className="bg-white border border-mint-line rounded-2xl p-6 shadow-sm max-w-lg space-y-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center text-forest shrink-0">
            <User size={18} />
          </div>
          <div>
            <p className="text-xs text-muted font-mono">Name</p>
            <p className="font-medium text-ink">{name || "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center text-forest shrink-0">
            <Mail size={18} />
          </div>
          <div>
            <p className="text-xs text-muted font-mono">Email</p>
            <p className="font-medium text-ink">{email || "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center text-forest shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-xs text-muted font-mono">Role</p>
            <p className="font-medium text-ink capitalize">{role || "—"}</p>
          </div>
        </div>
      </div>

      {/* ---------------- Stripe Account & Balance ---------------- */}
      <div className="bg-white border border-mint-line rounded-2xl p-6 shadow-sm max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink flex items-center gap-2">
            <CreditCard size={18} className="text-forest" /> Stripe Payment Account
          </h2>
          <button
            onClick={fetchStripeInfo}
            className="text-muted hover:text-forest transition p-1.5 rounded-lg hover:bg-mint"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-muted">Loading Stripe account details...</p>
        ) : error ? (
          <p className="text-sm text-rose">{error}</p>
        ) : !stripeInfo?.configured ? (
          <p className="text-sm text-muted">{stripeInfo?.message || "Stripe is not configured."}</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                  stripeInfo.account?.mode === "live"
                    ? "bg-rose/10 text-rose"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {stripeInfo.account?.mode === "live" ? "Live Mode" : "Test Mode"}
              </span>
              {stripeInfo.account?.chargesEnabled !== undefined && (
                <span className="flex items-center gap-1 text-xs text-muted">
                  {stripeInfo.account.chargesEnabled ? (
                    <CheckCircle2 size={14} className="text-forest" />
                  ) : (
                    <XCircle size={14} className="text-rose" />
                  )}
                  Charges {stripeInfo.account.chargesEnabled ? "Enabled" : "Disabled"}
                </span>
              )}
            </div>

            {stripeInfo.account?.id && (
              <div>
                <p className="text-xs text-muted font-mono">Account ID</p>
                <p className="font-mono text-sm text-ink break-all">{stripeInfo.account.id}</p>
              </div>
            )}
            {stripeInfo.account?.businessName && (
              <div>
                <p className="text-xs text-muted font-mono">Business Name</p>
                <p className="font-medium text-ink">{stripeInfo.account.businessName}</p>
              </div>
            )}
            {stripeInfo.account?.email && (
              <div>
                <p className="text-xs text-muted font-mono">Account Email</p>
                <p className="font-medium text-ink">{stripeInfo.account.email}</p>
              </div>
            )}

            <div className="border-t border-mint-line pt-4">
              <p className="text-xs text-muted font-mono mb-2 flex items-center gap-1">
                <Wallet size={14} /> Balance
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-mint rounded-xl p-3">
                  <p className="text-xs text-muted">Available</p>
                  {stripeInfo.balance?.available?.length ? (
                    stripeInfo.balance.available.map((b) => (
                      <p key={b.currency} className="font-display font-semibold text-ink">
                        {b.currency} {b.amount.toFixed(2)}
                      </p>
                    ))
                  ) : (
                    <p className="font-display font-semibold text-ink">—</p>
                  )}
                </div>
                <div className="bg-mint rounded-xl p-3">
                  <p className="text-xs text-muted">Pending</p>
                  {stripeInfo.balance?.pending?.length ? (
                    stripeInfo.balance.pending.map((b) => (
                      <p key={b.currency} className="font-display font-semibold text-ink">
                        {b.currency} {b.amount.toFixed(2)}
                      </p>
                    ))
                  ) : (
                    <p className="font-display font-semibold text-ink">—</p>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-muted">
              This is where customer payments actually land. For full transaction history, payouts,
              and bank settlement, open your{" "}
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noreferrer"
                className="text-forest underline"
              >
                Stripe Dashboard
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}