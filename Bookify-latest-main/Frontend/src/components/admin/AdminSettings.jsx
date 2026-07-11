import { useSelector } from "react-redux";
import { ShieldCheck, Mail, User } from "lucide-react";

export default function AdminSettings() {
  const { name, email, role } = useSelector((s) => s.auth);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">Settings</h1>
      <p className="text-muted text-sm mb-6">Your admin account details.</p>

      <div className="bg-white border border-mint-line rounded-2xl p-6 shadow-sm max-w-lg space-y-4">
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
    </div>
  );
}
