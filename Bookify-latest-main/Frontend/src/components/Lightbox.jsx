import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

// Full-screen image preview modal shared by Admin, Seller, and Customer
// screens. Handles Prev/Next, click-to-zoom, keyboard arrows, ESC-to-close,
// and click-outside-to-close.
export default function Lightbox({ images = [], startIndex = 0, title, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => setIndex(startIndex), [startIndex]);

  const goPrev = useCallback(() => {
    setZoomed(false);
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    setZoomed(false);
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && images.length > 1) goPrev();
      else if (e.key === "ArrowRight" && images.length > 1) goNext();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [goPrev, goNext, onClose, images.length]);

  if (!images.length) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 sm:p-8 animate-[fadeIn_.15s_ease]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition z-10"
        aria-label="Close preview"
      >
        <X size={22} />
      </button>

      {title && (
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 text-white/90 font-semibold text-sm z-10">
          {title} {images.length > 1 && <span className="text-white/60 font-normal">({index + 1}/{images.length})</span>}
        </div>
      )}

      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-2 sm:left-4 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 sm:p-3 transition z-10"
          aria-label="Previous image"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      <div
        className={`relative max-w-[92vw] max-h-[85vh] overflow-auto rounded-xl ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
        onClick={(e) => {
          e.stopPropagation();
          setZoomed((z) => !z);
        }}
      >
        <img
          src={images[index]}
          alt={title ? `${title} ${index + 1}` : `Preview ${index + 1}`}
          className={`block select-none transition-transform duration-200 ease-out ${
            zoomed ? "max-w-none max-h-none scale-150 sm:scale-[1.8]" : "max-w-[92vw] max-h-[85vh] w-auto h-auto scale-100"
          } object-contain rounded-xl`}
          draggable={false}
        />
      </div>

      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-2 sm:right-4 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 sm:p-3 transition z-10"
          aria-label="Next image"
        >
          <ChevronRight size={24} />
        </button>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          setZoomed((z) => !z);
        }}
        className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition z-10 flex items-center gap-1.5 px-3 text-xs font-medium"
      >
        {zoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
        {zoomed ? "Zoom out" : "Zoom in"}
      </button>

      {images.length > 1 && (
        <div
          className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 hidden sm:flex gap-2 max-w-[40vw] overflow-x-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => {
                setZoomed(false);
                setIndex(i);
              }}
              className={`w-10 h-10 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                i === index ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
