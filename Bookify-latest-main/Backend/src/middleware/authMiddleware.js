const jwt = require("jsonwebtoken");

exports.protect = (req, res, next) => {
  try {
    // Accept the JWT either from an Authorization: Bearer <token> header
    // (the frontend sends this, sourced from sessionStorage — scoped to
    // one browser tab) or from the httpOnly cookie set on login (kept as a
    // fallback for any non-browser/legacy clients).
    //
    // The header is checked FIRST and the cookie only as a fallback. This
    // matters because the cookie is shared across every tab on the
    // domain — if a user logs in as admin in one tab and as seller in
    // another, the cookie gets overwritten by whichever login happened
    // most recently. Trusting the cookie first meant the admin tab would
    // silently start acting as the seller the moment the seller logged in
    // elsewhere. The header doesn't have that problem since each tab
    // sends its own sessionStorage token.
    let token = null;
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      token = req.cookies?.token;
    }
    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized, no token" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
};