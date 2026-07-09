import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function BookCard({ book }) {
  return (
    <Link to={`/book/${book.id}`} className="group block bg-white rounded-2xl border border-mint-line overflow-hidden hover:shadow-lg hover:shadow-forest/5 hover:-translate-y-0.5 transition">
      <div className="relative aspect-[4/3] grade-scan bg-mint">
        <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
        <span className="corner-tick top-2 left-2 border-r-0 border-b-0 rounded-tl-md" />
        <span className="corner-tick top-2 right-2 border-l-0 border-b-0 rounded-tr-md" />
        <span className="corner-tick bottom-2 left-2 border-r-0 border-t-0 rounded-bl-md" />
        <span className="corner-tick bottom-2 right-2 border-l-0 border-t-0 rounded-br-md" />
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-md text-[11px] font-mono font-medium text-forest flex items-center gap-1">
          <ShieldCheck size={12} /> {book.condition}
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs text-muted font-mono">{book.board} · Class {book.cls}</p>
        <h3 className="font-display font-semibold text-ink leading-snug mt-0.5 line-clamp-2">{book.title}</h3>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-ink">₹{book.price}</span>
          <span className="text-xs font-semibold text-forest">AI-graded · Verified by team</span>
        </div>
      </div>
    </Link>
  );
}
