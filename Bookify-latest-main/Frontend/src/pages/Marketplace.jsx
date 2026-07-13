import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import BookCard from "../components/BookCard";
import BackButton from "../components/BackButton";
import { categories } from "../data/mockData";
import api from "../api/axios";

// Maps a raw Book document from the backend into the flat shape
// BookCard/Cart/BookDetails expect: { id, title, image, price, condition, board, cls, subject, author }
function normalizeBook(b) {
  return {
    id: b._id,
    title: b.bookName,
    author: b.author,
    board: b.board,
    cls: b.class,
    subject: b.subject,
    condition: b.condition,
    price: b.finalPrice || b.aiEstimatedPrice || 0,
    image: b.images?.[0] || "",
  };
}

export default function Marketplace() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [board, setBoard] = useState("All");
  const [condition, setCondition] = useState("All");
  const [sort, setSort] = useState("relevance");
  const categoryParam = searchParams.get("category");

  useEffect(() => {
    api
      .get("/books/all", { params: { marketplace: "true" } })
      .then((res) => setInventory(res.data.books.map(normalizeBook)))
      .catch((err) => setError(err.response?.data?.message || "Failed to load books."))
      .finally(() => setLoading(false));
  }, []);

  // Quick-category chips on the dashboard link here with ?category=school etc.
  // The backend doesn't have a dedicated category field, so it's used as a
  // best-effort board filter instead of leaving the link dead.
  useEffect(() => {
    if (!categoryParam) return;
    const map = { school: "CBSE", college: "College", competitive: "Competitive" };
    const guess = map[categoryParam];
    if (guess) setBoard((prev) => (prev === "All" ? guess : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryParam, inventory]);

  const boards = ["All", ...new Set(inventory.map((b) => b.board).filter(Boolean))];
  const conditions = ["All", ...new Set(inventory.map((b) => b.condition).filter(Boolean))];

  const filtered = useMemo(() => {
    let list = inventory.filter((b) => b.title?.toLowerCase().includes(query.toLowerCase()));
    if (board !== "All") list = list.filter((b) => b.board === board);
    if (condition !== "All") list = list.filter((b) => b.condition === condition);
    if (sort === "priceAsc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "priceDesc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [inventory, query, board, condition, sort]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <BackButton fallback="/" sticky />
      <h1 className="font-display text-3xl font-semibold text-ink mt-5">Buy Books</h1>
      <p className="text-muted text-sm mt-1">Quality-checked used books, at a fraction of the price.</p>

      <div className="relative mt-6 mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title..."
          className="w-full border border-mint-line rounded-full pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
        />
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <Select label="Board" value={board} onChange={setBoard} options={boards} />
        <Select label="Condition" value={condition} onChange={setCondition} options={conditions} />
        <Select
          label="Sort"
          value={sort}
          onChange={setSort}
          options={["relevance", "priceAsc", "priceDesc"]}
          display={{ relevance: "Relevance", priceAsc: "Price: Low to High", priceDesc: "Price: High to Low" }}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((c) => (
          <span key={c} className="text-xs font-mono px-3 py-1 rounded-full bg-mint text-forest">{c}</span>
        ))}
      </div>

      {loading ? (
        <p className="text-muted text-sm">Loading books...</p>
      ) : error ? (
        <p className="text-rose text-sm">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted text-sm">No books match your filters.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((b) => <BookCard key={b.id} book={b} />)}
        </div>
      )}
    </div>
  );
}

function Select({ label, value, onChange, options, display }) {
  return (
    <select
      value={value} onChange={(e) => onChange(e.target.value)}
      className="border border-mint-line rounded-full px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest"
    >
      {options.map((o) => <option key={o} value={o}>{display ? display[o] : o}</option>)}
    </select>
  );
}