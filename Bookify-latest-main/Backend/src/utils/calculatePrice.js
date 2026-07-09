// Base resale price table (in ₹), before any condition adjustment.
// These are rough market baselines for the categories Bookify deals in —
// tune these numbers to match what you actually see sell in your market.
const BASE_PRICE_TABLE = {
  ncert: 60,
  school: 90,
  competitive: 220,
  college: 260,
  reference: 140,
  default: 100,
};

// Guesses a book's category from whatever metadata the seller filled in,
// so we can pick a sensible base price before condition is even considered.
function detectCategory({ board, subject, publication, bookName } = {}) {
  const text = `${board || ""} ${subject || ""} ${publication || ""} ${bookName || ""}`.toLowerCase();

  if (text.includes("ncert")) return "ncert";
  if (
    text.includes("neet") ||
    text.includes("jee") ||
    text.includes("competitive") ||
    text.includes("upsc") ||
    text.includes("ssc") ||
    text.includes("gate")
  ) {
    return "competitive";
  }
  if (
    text.includes("college") ||
    text.includes("engineering") ||
    text.includes("b.tech") ||
    text.includes("btech") ||
    text.includes("university")
  ) {
    return "college";
  }
  if (text.includes("reference") || text.includes("guide") || text.includes("dictionary") || text.includes("atlas")) {
    return "reference";
  }
  if (board) return "school";
  return "default";
}

function calculateBasePrice(bookMeta) {
  const category = detectCategory(bookMeta);
  return BASE_PRICE_TABLE[category] ?? BASE_PRICE_TABLE.default;
}

// Converts a 0-100 AI condition score into a ₹ price against the base price.
// A book in perfect (100) condition tops out around 90% of base price;
// a badly worn book (near 0) floors out around 15%, so a beat-up book is
// never quoted ₹0 (there's always some resale/scrap-paper value).
function calculatePriceFromScore({ basePrice, conditionScore }) {
  const fraction = Math.max(0.15, Math.min(0.9, (conditionScore / 100) * 0.75 + 0.15));
  return Math.max(10, Math.round(basePrice * fraction));
}

module.exports = {
  BASE_PRICE_TABLE,
  detectCategory,
  calculateBasePrice,
  calculatePriceFromScore,
};
