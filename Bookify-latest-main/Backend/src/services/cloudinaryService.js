const fs = require("fs");
const cloudinary = require("../config/cloudinary");

// Fail fast with a clear message if Cloudinary env vars aren't set,
// instead of letting cloudinary.uploader.upload throw a cryptic error
// that gets swallowed into a generic "Server error" response.
function assertCloudinaryConfigured() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    const err = new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Backend/.env"
    );
    err.isConfigError = true;
    throw err;
  }
}

// Uploads local temp files (from multer) to Cloudinary and always cleans
// up the local temp file afterwards, whether the upload succeeds or fails.
async function uploadFilesToCloudinary(files, folder = "bookify/books") {
  const imageUrls = [];
  for (const file of files) {
    try {
      const result = await cloudinary.uploader.upload(file.path, { folder });
      imageUrls.push(result.secure_url);
    } finally {
      fs.unlink(file.path, () => {});
    }
  }
  return imageUrls;
}

module.exports = { assertCloudinaryConfigured, uploadFilesToCloudinary };
