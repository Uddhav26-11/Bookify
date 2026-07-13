import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ShieldCheck, Truck } from "lucide-react";
import ConditionMeter from "../components/ConditionMeter";
import BackButton from "../components/BackButton";
import { addToCart } from "../store/cartSlice";
import api from "../api/axios";

// Backend stores condition as a label (Excellent/Good/Fair/Poor), but the
// ConditionMeter dial needs a 0-100 grade — map the two.
const CONDITION_GRADE = { Excellent: 92, Good: 74, Fair: 52, Poor: 28 };

export default function BookDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/books/${id}`)
      .then((res) => {
        const b = res.data.book;
        setBook({
          id: b._id,
          title: b.bookName,
          author: b.author,
          board: b.board,
          cls: b.class,
          subject: b.subject,
          condition: b.condition,
          grade: CONDITION_GRADE[b.condition] ?? 60,
          price: b.finalPrice || b.aiEstimatedPrice || 0,
          image: b.images?.[0] || "",
        });
      })
      .catch((err) => setError(err.response?.data?.message || "Book not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="max-w-3xl mx-auto px-6 py-20 text-center text-muted">Loading...</div>;
  }

  if (error || !book) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="text-muted">{error || "Book not found."}</p>
        <Link to="/marketplace" className="text-forest font-semibold">Back to marketplace</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <BackButton fallback="/marketplace" className="mb-6" sticky />
      <div className="grid md:grid-cols-2 gap-10">
      <div className="grade-scan rounded-2xl overflow-hidden border border-mint-line bg-mint">
        <img src={book.image} alt={book.title} className="w-full aspect-[4/3] object-cover" />
      </div>

      <div>
        <p className="text-xs font-mono text-muted">{book.board} · Class {book.cls} · {book.subject}</p>
        <h1 className="font-display text-3xl font-semibold text-ink mt-1">{book.title}</h1>
        {book.author && <p className="text-sm text-muted mt-1">by {book.author}</p>}

        <div className="flex items-center gap-2 mt-4">
          <ShieldCheck size={16} className="text-forest" />
          <span className="text-sm font-semibold text-forest">Seller Verified</span>
        </div>

        <div className="flex items-center gap-6 bg-mint border border-mint-line rounded-2xl p-5 mt-5">
          <ConditionMeter grade={book.grade} label={book.condition} />
          <p className="text-sm text-muted leading-relaxed">
            Graded by our AI condition model across cover, binding, and page quality, then verified by our team on pickup.
          </p>
        </div>

        <div className="mt-6 flex items-baseline gap-3">
          <span className="font-display text-4xl font-bold text-ink">₹{book.price}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted mt-3">
          <Truck size={16} /> Estimated delivery: 3–5 business days
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => dispatch(addToCart(book))}
            className="flex-1 border border-forest text-forest font-semibold py-3 rounded-full hover:bg-mint transition"
          >
            Add To Cart
          </button>
          <Link
            to="/cart"
            onClick={() => dispatch(addToCart(book))}
            className="flex-1 btn-brand text-white font-semibold py-3 rounded-full text-center transition"
          >
            Buy Now
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}