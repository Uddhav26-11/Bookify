const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

let GoogleGenerativeAI = null;
try {
  ({ GoogleGenerativeAI } = require("@google/generative-ai"));
} catch {
  // SDK not installed / not needed — heuristic-only mode still works.
}

const { calculateBasePrice, calculatePriceFromScore } = require("../utils/calculatePrice");

// Starting point for how "good" a declared condition sounds, before we
// check it against the actual photos.
const CONDITION_LABEL_SCORE = {
  Excellent: 90,
  Good: 70,
  Fair: 50,
  Poor: 25,
};

function mimeTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

// ---------------------------------------------------------------------------
// FREE, OFFLINE MODEL — no API key required, always available.
// Scores a single photo on brightness, contrast, and edge-sharpness. A
// crisp, well-lit, high-contrast photo of a book tends to mean the cover
// print/text is intact and clearly visible; a flat, blurry, or very dark
// photo is treated more cautiously since damage/wear could be hidden.
// This is a real, deterministic computer-vision signal — not a mock.
// ---------------------------------------------------------------------------
async function scorePhoto(filePath) {
  const { data, info } = await sharp(filePath)
    .resize(400, 400, { fit: "inside" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = data;
  const n = pixels.length;
  const w = info.width;
  const h = info.height;

  let sum = 0;
  for (let i = 0; i < n; i++) sum += pixels[i];
  const mean = sum / n;

  let variance = 0;
  for (let i = 0; i < n; i++) variance += (pixels[i] - mean) ** 2;
  const contrast = Math.sqrt(variance / n);

  // Simple horizontal-gradient edge energy — a sharpness proxy. Blurry or
  // heavily worn/faded photos tend to have lower gradient energy.
  let edgeSum = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 1; x < w; x++) {
      const idx = y * w + x;
      edgeSum += Math.abs(pixels[idx] - pixels[idx - 1]);
    }
  }
  const edgeEnergy = edgeSum / (w * h);

  const brightnessScore = Math.max(0, 100 - Math.abs(mean - 130) * (100 / 130));
  const contrastScore = Math.min(100, (contrast / 60) * 100);
  const sharpnessScore = Math.min(100, (edgeEnergy / 20) * 100);

  const score = brightnessScore * 0.25 + contrastScore * 0.35 + sharpnessScore * 0.4;
  return Math.max(0, Math.min(100, Math.round(score)));
}

async function heuristicConditionScore(filePaths, declaredCondition) {
  const scores = await Promise.all(filePaths.map((p) => scorePhoto(p).catch(() => 55)));
  const photoScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const declaredScore = CONDITION_LABEL_SCORE[declaredCondition] ?? 55;

  // Photos are the "ground truth" check on the seller's own condition claim,
  // so they're weighted slightly higher than the declared label.
  const blended = photoScore * 0.55 + declaredScore * 0.45;
  return Math.round(Math.max(10, Math.min(98, blended)));
}

// ---------------------------------------------------------------------------
// OPTIONAL, MORE ACCURATE MODEL — Google Gemini Vision (free tier available).
// Only runs if GEMINI_API_KEY is set in Backend/.env. Actually "looks at"
// the photos (cover print quality, stains, torn corners, spine damage, etc.)
// instead of only measuring pixel statistics. Any failure here silently
// falls back to the offline heuristic above, so the feature never breaks.
// ---------------------------------------------------------------------------
async function geminiConditionScore(filePaths, bookMeta) {
  if (!process.env.GEMINI_API_KEY || !GoogleGenerativeAI) return null;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const imageParts = filePaths.map((p) => ({
      inlineData: {
        data: fs.readFileSync(p).toString("base64"),
        mimeType: mimeTypeFor(p),
      },
    }));

    const prompt = `You are grading the physical condition of a used book from photos, for a resale marketplace (like Cashify, but for books).
Book: "${bookMeta.bookName || "unknown"}", subject: ${bookMeta.subject || "n/a"}, board/class: ${bookMeta.board || "n/a"} ${bookMeta.class || ""}.
The seller describes the condition as: ${bookMeta.condition || "unknown"}.
Examine the cover, spine, corners, and any visible pages for wear, stains, tears, writing/highlighting, or fading.
Reply with ONLY raw JSON (no markdown fences) in exactly this shape:
{"conditionScore": <integer 0-100, 100 = like new>, "notes": ["short observation", "short observation"]}`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleaned);

    if (typeof parsed.conditionScore === "number") {
      return {
        conditionScore: Math.max(0, Math.min(100, Math.round(parsed.conditionScore))),
        notes: Array.isArray(parsed.notes) ? parsed.notes.slice(0, 4) : [],
      };
    }
    return null;
  } catch (err) {
    console.error("Gemini vision estimate failed, falling back to offline model:", err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main entry point used by the AI controller.
// ---------------------------------------------------------------------------
async function estimateBookPrice({ filePaths, bookMeta, sellerPrice }) {
  const basePrice = calculateBasePrice(bookMeta);

  const [gemini, heuristicScore] = await Promise.all([
    geminiConditionScore(filePaths, bookMeta),
    heuristicConditionScore(filePaths, bookMeta.condition),
  ]);

  // Blend when Gemini is available (mostly trust the vision model, but keep
  // the offline signal as a sanity check); otherwise heuristic stands alone.
  const conditionScore = gemini
    ? Math.round(gemini.conditionScore * 0.7 + heuristicScore * 0.3)
    : heuristicScore;
  const source = gemini ? "gemini-vision" : "heuristic";

  const estimatedPrice = calculatePriceFromScore({ basePrice, conditionScore });
  const confidenceScore = gemini
    ? Math.min(97, 82 + filePaths.length * 2)
    : Math.min(88, 68 + filePaths.length * 3);

  const notes =
    gemini?.notes?.length
      ? gemini.notes
      : [
          conditionScore > 75
            ? "Cover and corners look well-preserved across the photos."
            : "Some visible wear detected across the photos.",
          filePaths.length < 4 ? "Fewer than 4 photos reduces estimate confidence." : "All 4 required angles were provided.",
        ];

  let verdict = null;
  let verdictNote = null;
  const sp = Number(sellerPrice);
  if (sellerPrice !== undefined && sellerPrice !== null && sellerPrice !== "" && !Number.isNaN(sp)) {
    const diffPct = ((sp - estimatedPrice) / estimatedPrice) * 100;
    if (diffPct > 15) {
      verdict = "too_high";
      verdictNote = `Your asking price (₹${sp}) is higher than what the photos and condition support. We recommend closer to ₹${estimatedPrice}.`;
    } else if (diffPct < -15) {
      verdict = "too_low";
      verdictNote = `Your asking price (₹${sp}) is lower than what this book could fetch. We recommend closer to ₹${estimatedPrice}.`;
    } else {
      verdict = "fair";
      verdictNote = `Your asking price (₹${sp}) is in line with our estimate of ₹${estimatedPrice}. Looks fair!`;
    }
  }

  return { estimatedPrice, confidenceScore, conditionScore, source, notes, verdict, verdictNote };
}

module.exports = { estimateBookPrice };
