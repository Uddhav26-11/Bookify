const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendNotification, notifySafely } = require("../services/notificationService");

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

exports.registerSeller = async (req, res) => {
  try {
    const { name, phone, email, password, address, city, pincode, class: className, schoolName } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const seller = await User.create({
      name, phone, email, password, address, city, pincode,
      class: className, schoolName, role: "seller",
    });

    notifySafely(() =>
      sendNotification({
        receiver: "admin",
        receiverRole: "admin",
        sender: seller._id,
        senderName: seller.name,
        title: "New Seller Registration",
        message: `${seller.name} registered as a new seller.`,
        type: "NEW_SELLER",
        referenceId: seller._id,
      })
    );

    return res.status(201).json({
      success: true,
      message: "Seller registered successfully. Please login.",
      userId: seller._id,
    });
  } catch (error) {
    console.error("Register Seller Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during seller registration" });
  }
};

exports.registerCustomer = async (req, res) => {
  try {
    const { name, phone, email, password, address, city, pincode } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const customer = await User.create({
      name, phone, email, password, address, city, pincode, role: "customer",
    });

    notifySafely(() =>
      sendNotification({
        receiver: "admin",
        receiverRole: "admin",
        sender: customer._id,
        senderName: customer.name,
        title: "New Customer Registration",
        message: `${customer.name} registered as a new customer.`,
        type: "NEW_CUSTOMER",
        referenceId: customer._id,
      })
    );

    return res.status(201).json({
      success: true,
      message: "Customer registered successfully. Please login.",
      userId: customer._id,
    });
  } catch (error) {
    console.error("Register Customer Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during customer registration" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Safe admin check — won't crash even if .env vars are missing
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && normalizedEmail === adminEmail && password === adminPassword) {
      const token = generateToken({ id: "admin", role: "admin", email: process.env.ADMIN_EMAIL });
      setTokenCookie(res, token);
      return res.status(200).json({
        success: true,
        message: "Admin login successful",
        token,
        user: { role: "admin", email: process.env.ADMIN_EMAIL, name: "Admin" },
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = generateToken({ id: user._id, role: user.role, email: user.email });
    setTokenCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during login" });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};

exports.getMe = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.status(200).json({
        success: true,
        user: { role: "admin", email: process.env.ADMIN_EMAIL, name: "Admin" },
      });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("GetMe Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};