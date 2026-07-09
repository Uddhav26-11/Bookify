import api from "../api/axios";

// Calls POST /api/ai/estimate with the seller's photos + book details.
// The backend runs the real AI pricing model (Gemini Vision if a free
// GEMINI_API_KEY is configured, otherwise an offline photo-analysis
// heuristic) and returns a condition/price estimate. The photos are
// uploaded to Cloudinary as part of this call, so the returned imageUrls
// can be reused when the seller accepts the offer (no re-upload needed).
export async function getAIEstimate({ form, files, sellerPrice }) {
  const fd = new FormData();
  fd.append("bookName", form.name);
  fd.append("class", form.cls);
  fd.append("board", form.board);
  fd.append("subject", form.subject);
  fd.append("author", form.author);
  fd.append("publication", form.publication);
  fd.append("condition", form.condition);
  if (sellerPrice) fd.append("sellerPrice", sellerPrice);
  files.forEach((f) => fd.append("images", f));

  const res = await api.post("/ai/estimate", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const data = res.data;
  return {
    grade: data.conditionScore,
    confidence: data.confidenceScore,
    priceEstimate: data.estimatedPrice,
    imageUrls: data.imageUrls,
    sellerPrice: sellerPrice ? Number(sellerPrice) : null,
    verdict: data.verdict,
    verdictNote: data.verdictNote,
    notes: data.notes,
    source: data.source,
  };
}
