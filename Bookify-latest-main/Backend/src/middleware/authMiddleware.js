const jwt = require("jsonwebtoken");

exports.protect = (req, res, next) => {
  try {
    // Accept the JWT either from the httpOnly cookie (set on login) or from
    // an Authorization: Bearer <token> header (used by the frontend, which
    // persists the token in localStorage so a page refresh never logs the
    // user out). Cookie is checked first to preserve any existing flows.
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
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