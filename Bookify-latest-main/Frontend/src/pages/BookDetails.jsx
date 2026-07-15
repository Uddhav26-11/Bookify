import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ShieldCheck, Truck, ZoomIn } from "lucide-react";
import ConditionMeter from "../components/ConditionMeter";
import BackButton from "../components/BackButton";
import Lightbox from "../components/Lightbox";
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
  const [activeImg, setActiveImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const carouselRef = useRef(null);

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
          images: b.images?.length ? b.images : b.image ? [b.image] : [],
        });
      })
      .catch((err) => setError(err.response?.data?.message || "Book not found."))
      .finally(() => setLoading(false));
  }, [id]);

  // Keep the mobile carousel and the thumbnail selection in sync when the
  // user swipes on touch devices.
  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveImg(index);
  };

  const scrollToImage = (index) => {
    setActiveImg(index);
    const el = carouselRef.current;
    if (el) el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

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

  const images = book.images.length ? book.images : [""];
  const asProduct = { id: book.id, title: book.title, image: images[0], price: book.price, condition: book.condition, board: book.board, cls: book.cls, subject: book.subject };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <BackButton fallback="/marketplace" className="mb-6" sticky />
      <div className="grid md:grid-cols-2 gap-10">
        {/* ---------------- Gallery ---------------- */}
        <div>
          {/* Desktop: thumbnails left, big image right */}
          <div className="hidden md:flex gap-3">
            <div className="flex flex-col gap-2.5 shrink-0">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition ${
                    i === activeImg ? "border-forest" : "border-mint-line opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt={`${book.title} ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setLightboxOpen(true)}
              className="relative flex-1 grade-scan rounded-2xl overflow-hidden border border-mint-line bg-mint group"
            >
              <img
                src={images[activeImg]}
                alt={book.title}
                className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur rounded-full p-2 text-forest shadow-sm opacity-0 group-hover:opacity-100 transition">
                <ZoomIn size={16} />
              </span>
            </button>
          </div>

          {/* Mobile: swipeable carousel */}
          <div className="md:hidden">
            <div
              ref={carouselRef}
              onScroll={handleCarouselScroll}
              className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl border border-mint-line bg-mint scroll-smooth [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxOpen(true)}
                  className="w-full shrink-0 snap-center"
                >
                  <img src={src} alt={`${book.title} ${i + 1}`} className="w-full aspect-[4/3] object-cover" loading="lazy" />
                </button>
              ))}
            </div>
            {images.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToImage(i)}
                    className={`h-1.5 rounded-full transition-all ${i === activeImg ? "w-5 bg-forest" : "w-1.5 bg-mint-line"}`}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ---------------- Details ---------------- */}
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
              onClick={() => dispatch(addToCart(asProduct))}
              className="flex-1 border border-forest text-forest font-semibold py-3 rounded-full hover:bg-mint transition"
            >
              Add To Cart
            </button>
            <Link
              to="/cart"
              onClick={() => dispatch(addToCart(asProduct))}
              className="flex-1 btn-brand text-white font-semibold py-3 rounded-full text-center transition"
            >
              Buy Now
            </Link>
          </div>
        </div>
      </div>

      {lightboxOpen && (
        <Lightbox
          images={images}
          startIndex={activeImg}
          title={book.title}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
