const Book = require("../models/Book");
const PickupRequest = require("../models/PickupRequest");
const User = require("../models/User");
const { assertCloudinaryConfigured, uploadFilesToCloudinary } = require("../services/cloudinaryService");
const { sendNotification, notifySafely } = require("../services/notificationService");

// SINGLE BOOK UPLOAD — creates Book + auto-creates a PickupRequest for admin to see
exports.uploadBook = async (req, res) => {
  try {
    const { bookName, class: className, board, subject, author, publication, condition, aiEstimatedPrice, confidenceScore, sellerProposedPrice, imageUrls: imageUrlsRaw } = req.body;

    let imageUrls;

    if (imageUrlsRaw) {
      // Photos were already analyzed by the AI model and uploaded to
      // Cloudinary during the /ai/estimate step — reuse those URLs instead
      // of asking the seller to upload the same 4 photos again.
      try {
        imageUrls = JSON.parse(imageUrlsRaw);
      } catch {
        return res.status(400).json({ success: false, message: "Invalid imageUrls format." });
      }
      if (!Array.isArray(imageUrls) || imageUrls.length !== 4) {
        return res.status(400).json({ success: false, message: "Exactly 4 image URLs are required." });
      }
    } else {
      // Fallback path: no pre-uploaded URLs, so exactly 4 fresh photos are
      // required (cover, back, spine, and any damage close-up).
      if (!req.files || req.files.length !== 4) {
        return res.status(400).json({
          success: false,
          message: "Please upload exactly 4 photos of the book (cover, back, spine, and any damage).",
        });
      }
      assertCloudinaryConfigured();
      imageUrls = await uploadFilesToCloudinary(req.files);
    }

    const book = await Book.create({
      seller: req.user.id,
      bookName,
      class: className,
      board,
      subject,
      author,
      publication,
      condition,
      images: imageUrls,
      aiEstimatedPrice: aiEstimatedPrice || undefined,
      confidenceScore: confidenceScore || undefined,
      sellerProposedPrice: sellerProposedPrice || undefined,
      status: "Requested",
    });

    const pickup = await PickupRequest.create({
      seller: req.user.id,
      books: [book._id],
      status: "Requested",
    });

    notifySafely(async () => {
      const seller = await User.findById(req.user.id).select("name");
      await sendNotification({
        receiver: "admin",
        receiverRole: "admin",
        sender: req.user.id,
        senderName: seller?.name || "A seller",
        title: "New Book Approval Request",
        message: `Seller ${seller?.name || ""} submitted "${book.bookName}" for approval.`,
        type: "BOOK_REQUEST",
        referenceId: book._id,
      });
    });

    return res.status(201).json({ success: true, message: "Book uploaded successfully", book, pickup });
  } catch (error) {
    // Log the FULL error (not just .message) so the real cause shows up in the server console.
    console.error("Upload Book Error:", error);
    const message = error.isConfigError
      ? error.message
      : "Server error while uploading book";
    return res.status(500).json({ success: false, message });
  }
};

// BULK UPLOAD — multiple books in one pickup request
// FormData shape: books = JSON string of [{bookName, class, board, subject, author, publication, condition}, ...]
// files sent with fieldnames images_0, images_1, images_2 ... (matching book index)
exports.bulkUploadBooks = async (req, res) => {
  try {
    if (!req.body.books) {
      return res.status(400).json({ success: false, message: "Books data is required" });
    }

    let booksData;
    try {
      booksData = JSON.parse(req.body.books);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid books data format" });
    }

    if (!Array.isArray(booksData) || booksData.length === 0) {
      return res.status(400).json({ success: false, message: "At least one book is required" });
    }

    const files = req.files || [];

    // Every book in the batch must have exactly 4 photos.
    for (let i = 0; i < booksData.length; i++) {
      const bookFiles = files.filter((f) => f.fieldname === `images_${i}`);
      if (bookFiles.length !== 4) {
        return res.status(400).json({
          success: false,
          message: `Book ${i + 1} ("${booksData[i].bookName || "untitled"}") needs exactly 4 photos.`,
        });
      }
    }

    const createdBooks = [];
    assertCloudinaryConfigured();

    for (let i = 0; i < booksData.length; i++) {
      const b = booksData[i];
      const bookFiles = files.filter((f) => f.fieldname === `images_${i}`);

      const imageUrls = await uploadFilesToCloudinary(bookFiles);

      const book = await Book.create({
        seller: req.user.id,
        bookName: b.bookName,
        class: b.class,
        board: b.board,
        subject: b.subject,
        author: b.author,
        publication: b.publication,
        condition: b.condition,
        images: imageUrls,
        status: "Requested",
      });

      createdBooks.push(book);
    }

    const pickup = await PickupRequest.create({
      seller: req.user.id,
      books: createdBooks.map((b) => b._id),
      status: "Requested",
    });

    notifySafely(async () => {
      const seller = await User.findById(req.user.id).select("name");
      const bookList = createdBooks.length === 1
        ? `"${createdBooks[0].bookName}"`
        : `${createdBooks.length} books (incl. "${createdBooks[0].bookName}")`;
      await sendNotification({
        receiver: "admin",
        receiverRole: "admin",
        sender: req.user.id,
        senderName: seller?.name || "A seller",
        title: "New Book Approval Request",
        message: `Seller ${seller?.name || ""} submitted ${bookList} for approval.`,
        type: "BOOK_REQUEST",
        referenceId: pickup._id,
      });
    });

    return res.status(201).json({
      success: true,
      message: `${createdBooks.length} books uploaded successfully`,
      books: createdBooks,
      pickup,
    });
  } catch (error) {
    console.error("Bulk Upload Error:", error);
    const message = error.isConfigError
      ? error.message
      : "Server error during bulk upload";
    return res.status(500).json({ success: false, message });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate("seller", "name email city");
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }
    return res.status(200).json({ success: true, book });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/books/all
// GET /api/books/all?marketplace=true — only books admin has approved & paid
// for, that haven't already been bought by a customer. This is the real
// data source for the public "Buy Books" marketplace page.
exports.getAllBooks = async (req, res) => {
  try {
    const { marketplace } = req.query;
    const filter = {};

    if (marketplace === "true") {
      filter.status = { $in: ["Paid", "Completed"] };
      filter.isSold = { $ne: true };
      filter.$or = [{ finalPrice: { $gt: 0 } }, { aiEstimatedPrice: { $gt: 0 } }];
    }

    const books = await Book.find(filter).populate("seller", "name city").sort({ createdAt: -1 });
    return res.status(200).json({ success: true, books });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};