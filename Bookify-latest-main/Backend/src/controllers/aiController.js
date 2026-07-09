const AIPricePrediction = require("../models/AIPricePrediction");
const { uploadFilesToCloudinary, assertCloudinaryConfigured } = require("../services/cloudinaryService");
const { estimateBookPrice } = require("../services/aiService");

// Seller uploads 4 photos + book details BEFORE actually listing the book.
// We run the AI condition/price model on the raw photos, then upload those
// same photos to Cloudinary so the URLs can be reused (no re-upload) if the
// seller accepts the offer in the next step.
exports.estimatePrice = async (req, res) => {
  try {
    const { bookName, condition, subject, board, class: className, publication, sellerPrice } = req.body;

    if (!req.files || req.files.length !== 4) {
      return res.status(400).json({
        success: false,
        message: "Please upload exactly 4 photos of the book (cover, back, spine, and any damage).",
      });
    }

    const filePaths = req.files.map((f) => f.path);

    // Analyze the raw local files first — they get deleted during the
    // Cloudinary upload step right after this.
    const result = await estimateBookPrice({
      filePaths,
      bookMeta: { bookName, condition, subject, board, class: className, publication },
      sellerPrice,
    });

    assertCloudinaryConfigured();
    const imageUrls = await uploadFilesToCloudinary(req.files);

    // Fire-and-forget audit log — never blocks the response to the seller.
    AIPricePrediction.create({
      bookName,
      condition,
      images: imageUrls,
      estimatedPrice: result.estimatedPrice,
      confidenceScore: result.confidenceScore,
      conditionScore: result.conditionScore,
      source: result.source,
      sellerProposedPrice: sellerPrice || undefined,
    }).catch((err) => console.error("Failed to log AI prediction:", err.message));

    return res.status(200).json({
      success: true,
      imageUrls,
      estimatedPrice: result.estimatedPrice,
      confidenceScore: result.confidenceScore,
      conditionScore: result.conditionScore,
      source: result.source,
      notes: result.notes,
      verdict: result.verdict,
      verdictNote: result.verdictNote,
      disclaimer: "This is an AI-generated estimate. Final price may increase or decrease after physical inspection.",
    });
  } catch (error) {
    console.error("Estimate Price Error:", error);
    const message = error.isConfigError ? error.message : "Server error while estimating price";
    return res.status(500).json({ success: false, message });
  }
};
