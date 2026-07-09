import {
  BookOpen, CheckCircle2, XCircle, Tag, Sparkles, ShoppingBag,
  PackageCheck, PackageX, Truck, UserPlus, AlertTriangle, Wallet, Bell, X,
} from "lucide-react";
import { timeAgo } from "../utils/timeAgo";

const ICONS = {
  BOOK_REQUEST: BookOpen,
  BOOK_APPROVED: CheckCircle2,
  BOOK_REJECTED: XCircle,
  PRICE_UPDATED: Tag,
  NEW_BOOK: Sparkles,
  ORDER_PLACED: ShoppingBag,
  ORDER_ACCEPTED: PackageCheck,
  ORDER_CANCELLED: PackageX,
  ORDER_UPDATE: Truck,
  NEW_SELLER: UserPlus,
  NEW_CUSTOMER: UserPlus,
  PAYMENT_ISSUE: AlertTriangle,
  PAYMENT_DONE: Wallet,
};

const ICON_COLORS = {
  BOOK_REQUEST: "text-forest bg-mint",
  BOOK_APPROVED: "text-forest bg-mint",
  BOOK_REJECTED: "text-rose bg-rose/10",
  PRICE_UPDATED: "text-amber bg-amber/10",
  NEW_BOOK: "text-forest bg-lime/30",
  ORDER_PLACED: "text-forest bg-mint",
  ORDER_ACCEPTED: "text-forest bg-mint",
  ORDER_CANCELLED: "text-rose bg-rose/10",
  ORDER_UPDATE: "text-forest bg-mint",
  NEW_SELLER: "text-forest bg-mint",
  NEW_CUSTOMER: "text-forest bg-mint",
  PAYMENT_ISSUE: "text-rose bg-rose/10",
  PAYMENT_DONE: "text-forest bg-mint",
};

export default function NotificationItem({ notification, onMarkRead, onDelete, compact = false }) {
  const Icon = ICONS[notification.type] || Bell;
  const colorClass = ICON_COLORS[notification.type] || "text-forest bg-mint";

  return (
    <div
      onClick={() => !notification.read && onMarkRead(notification._id)}
      className={`group relative flex gap-3 px-4 py-3 border-b border-mint-line last:border-b-0 transition cursor-pointer hover:bg-mint/40 ${
        notification.read ? "bg-white" : "bg-mint/20"
      }`}
    >
      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon size={16} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm ${notification.read ? "font-medium text-ink/80" : "font-semibold text-ink"}`}>
            {notification.title}
          </p>
          {!notification.read && <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-forest" />}
        </div>
        <p className={`text-xs mt-0.5 ${compact ? "line-clamp-2" : ""} text-muted`}>{notification.message}</p>
        <p className="text-[11px] mt-1 text-muted font-mono">{timeAgo(notification.createdAt)}</p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(notification._id); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition p-1 rounded-full hover:bg-rose/10 text-muted hover:text-rose"
        aria-label="Delete notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}
