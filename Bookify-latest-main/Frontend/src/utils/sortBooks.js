// Shared sort options + sorter used by every book listing (Admin, Seller, Customer)
// so "Newest First", "Price: Low to High" etc. behave identically everywhere.

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "priceLow", label: "Price: Low to High" },
  { value: "priceHigh", label: "Price: High to Low" },
  { value: "nameAZ", label: "Book Name (A-Z)" },
  { value: "nameZA", label: "Book Name (Z-A)" },
  { value: "sold", label: "Sold" },
  { value: "unsold", label: "Unsold" },
];

// Best-effort accessors so this works whether a book uses bookName/title,
// finalPrice/aiEstimatedPrice/price, isSold, createdAt, etc.
const getName = (b) => b.bookName || b.title || "";
const getPrice = (b) => b.finalPrice ?? b.aiEstimatedPrice ?? b.price ?? 0;
const getDate = (b) => new Date(b.createdAt || b.updatedAt || 0).getTime();
const getSold = (b) => Boolean(b.isSold ?? b.sold ?? (b.status === "Completed"));

export function sortBooks(books, sortValue) {
  const list = [...books];
  switch (sortValue) {
    case "newest":
      return list.sort((a, b) => getDate(b) - getDate(a));
    case "oldest":
      return list.sort((a, b) => getDate(a) - getDate(b));
    case "priceLow":
      return list.sort((a, b) => getPrice(a) - getPrice(b));
    case "priceHigh":
      return list.sort((a, b) => getPrice(b) - getPrice(a));
    case "nameAZ":
      return list.sort((a, b) => getName(a).localeCompare(getName(b)));
    case "nameZA":
      return list.sort((a, b) => getName(b).localeCompare(getName(a)));
    case "sold":
      return list.filter((b) => getSold(b));
    case "unsold":
      return list.filter((b) => !getSold(b));
    default:
      return list;
  }
}

export { getSold as isBookSold };
