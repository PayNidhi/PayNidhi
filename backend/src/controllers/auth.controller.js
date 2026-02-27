// backend/src/controllers/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Seller from "../models/Seller.model.js";
import Lender from "../models/Lender.model.js";
import MockCompany from "../models/MockCompany.model.js";
import MockRBIDatabase from "../models/MockRBIDatabase.model.js"; // 👈 Our RBI Shield
import Otp from "../models/Otp.model.js";
import { hashField } from "../utils/encryption.utils.js";
import { sendOtpEmail } from "../utils/email.utils.js";
import { getRandomAvatarUrl } from "../utils/avatar.utils.js";

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const sendAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production", // 👈 Friend's improved cookie logic
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

// ==========================================
// SELLER AUTHENTICATION
// ==========================================

export const registerSeller = async (req, res) => {
  console.log("Seller registration started!!!");
  try {
    const {
      email,
      password,
      companyName,
      gstNumber,
      businessType,
      industry,
      annualTurnover,
    } = req.body;

    console.log("Verifying company gstin...");
    const verifiedCompany = await MockCompany.findOne({ gstin: gstNumber });

    if (!verifiedCompany) {
      return res
        .status(400)
        .json({
          error:
            "Registration Failed: GSTIN not found in official Govt records.",
        });
    }
    if (
      verifiedCompany.companyName.toLowerCase() !== companyName.toLowerCase()
    ) {
      return res
        .status(400)
        .json({
          error: `Registration Failed: GSTIN belongs to '${verifiedCompany.companyName}', not '${companyName}'.`,
        });
    }

    console.log("GST company verification done!");
    const gstHash = hashField(gstNumber);

    const sellerExists = await Seller.findOne({ email });
    if (sellerExists) {
      console.log("Duplicate seller found (email)");
      return res.status(400).json({ error: "Email already registered" });
    }

    const isGstNumDuplicate = await Seller.findOne({ gstHash: gstHash });
    if (isGstNumDuplicate) {
      console.log("GST number is duplicate");
      return res.status(400).json({ error: "GST Number already registered" });
    }

    const seller = await Seller.create({
      email,
      password,
      companyName,
      gstNumber,
      gstHash,
      businessType,
      industry,
      annualTurnover: Number(annualTurnover) || 0,
      isOnboarded: false, // 👈 Ensures they still need KYC
      kycStatus: "partial",
    });

    if (seller) {
      const token = generateToken(seller._id, "seller");
      sendAuthCookie(res, token);

      console.log("Seller created successfully...", seller._id);
      return res.status(201).json({
        _id: seller._id,
        email: seller.email,
        companyName: seller.companyName,
        role: "seller",
        avatarUrl: seller.avatarUrl || "",
        isOnboarded: seller.isOnboarded,
        kycStatus: seller.kycStatus,
        message: "Seller registered successfully. Complete KYC to get started.",
      });
    }
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const loginSeller = async (req, res) => {
  try {
    const { email, password } = req.body;
    const seller = await Seller.findOne({ email });

    if (seller && (await seller.matchPassword(password))) {
      const token = generateToken(seller._id, "seller");
      sendAuthCookie(res, token);

      res.json({
        _id: seller._id,
        email: seller.email,
        companyName: seller.companyName,
        role: "seller",
        avatarUrl: seller.avatarUrl || "",
        isOnboarded: seller.isOnboarded,
        kycStatus: seller.kycStatus,
        message: "Login successful",
      });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// ==========================================
// LENDER AUTHENTICATION (Our RBI Shield)
// ==========================================

export const registerLender = async (req, res) => {
  try {
    const {
      email,
      password,
      companyName,
      gstNumber,
      lenderType,
      lenderLicense,
    } = req.body;

    if (!email || !password || !companyName || !lenderType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 🛡️ WALL 3: RBI REGULATORY SHIELD
    if (["Bank", "NBFC", "Institutional"].includes(lenderType)) {
      if (!lenderLicense || !gstNumber) {
        return res
          .status(400)
          .json({
            error:
              "Corporate lenders must provide a GSTIN and an RBI License Number.",
          });
      }

      console.log(`🔍 Verifying RBI License for: ${lenderLicense}`);
      const rbiRecord = await MockRBIDatabase.findOne({
        licenseNumber: lenderLicense,
      });

      if (!rbiRecord)
        return res
          .status(400)
          .json({
            error: "Verification Failed: RBI License Number not found.",
          });
      if (rbiRecord.status !== "Active")
        return res
          .status(403)
          .json({
            error: `Regulatory Alert: License '${rbiRecord.status}'. Blocked.`,
          });
      if (rbiRecord.gstin.toLowerCase() !== gstNumber.toLowerCase())
        return res
          .status(400)
          .json({ error: "Verification Failed: GSTIN mismatch." });

      console.log("✅ RBI Verification Passed!");
    }

    const lenderExists = await Lender.findOne({ email });
    if (lenderExists)
      return res
        .status(400)
        .json({ error: "Email already registered as Lender" });

    let gstHash = null;
    if (gstNumber) {
      gstHash = hashField(gstNumber);
      const isGstNumDuplicate = await Lender.findOne({ gstHash });
      if (isGstNumDuplicate)
        return res
          .status(400)
          .json({ error: "GST Number already registered to another Lender" });
    }

    const lender = await Lender.create({
      email,
      password,
      companyName,
      gstNumber,
      gstHash,
      lenderType,
      lenderLicense,
      isOnboarded: false,
      kycStatus: "partial",
      totalCreditLimit: 0,
      utilizedLimit: 0,
      walletBalance: 0,
    });

    if (lender) {
      const token = generateToken(lender._id, "lender");
      sendAuthCookie(res, token);

      res.status(201).json({
        _id: lender._id,
        email: lender.email,
        companyName: lender.companyName,
        role: "lender",
        avatarUrl: lender.avatarUrl || "",
        isOnboarded: lender.isOnboarded,
        kycStatus: lender.kycStatus,
        message:
          "Lender registered successfully. Complete KYC to start investing.",
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginLender = async (req, res) => {
  try {
    const { email, password } = req.body;
    const lender = await Lender.findOne({ email });

    if (lender && (await lender.comparePassword(password))) {
      const token = generateToken(lender._id, "lender");
      sendAuthCookie(res, token);

      res.json({
        _id: lender._id,
        email: lender.email,
        companyName: lender.companyName,
        role: "lender",
        avatarUrl: lender.avatarUrl || "",
        isOnboarded: lender.isOnboarded,
        kycStatus: lender.kycStatus,
        message: "Login successful",
      });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// ==========================================
// USER UTILITIES & SETTINGS (Friend's Additions)
// ==========================================

export const getMe = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });

  res.json({
    _id: req.user._id,
    email: req.user.email,
    companyName: req.user.companyName,
    role: req.user.businessType ? "seller" : "lender",
    avatarUrl: req.user.avatarUrl || "",
    isOnboarded: req.user.isOnboarded,
    kycStatus: req.user.kycStatus,
    trustScore: user.trustScore || 300,
  });
};

export const updateProfile = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });

    const { companyName, email, annualTurnover, password } = req.body;

    let updateData = {
      companyName,
      email,
      annualTurnover: Number(annualTurnover) || 0,
    };

    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    let updatedUser;

    // 👈 FIX: Strictly check businessType to avoid confusing corporate Lenders with Sellers
    if (req.user.businessType) {
      updatedUser = await Seller.findByIdAndUpdate(req.user._id, updateData, {
        new: true,
      }).select("-password");
    } else {
      updatedUser = await Lender.findByIdAndUpdate(req.user._id, updateData, {
        new: true,
      }).select("-password");
    }

    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    res.json({
      _id: updatedUser._id,
      email: updatedUser.email,
      companyName: updatedUser.companyName,
      role: req.user.businessType ? "seller" : "lender",
      avatarUrl: updatedUser.avatarUrl || "",
      isOnboarded: updatedUser.isOnboarded,
      kycStatus: updatedUser.kycStatus,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ error: "Failed to update profile details" });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });

    const avatarFile = req.file;

    if (!avatarFile)
      return res.status(400).json({ error: "No image file provided" });

    const newAvatarUrl = `/uploads/avatars/${avatarFile.filename}`;
    let updatedUser;

    if (req.user.businessType) {
      updatedUser = await Seller.findByIdAndUpdate(
        req.user._id,
        { avatarUrl: newAvatarUrl },
        { new: true },
      ).select("-password");
    } else {
      updatedUser = await Lender.findByIdAndUpdate(
        req.user._id,
        { avatarUrl: newAvatarUrl },
        { new: true },
      ).select("-password");
    }

    res.json({
      _id: updatedUser._id,
      email: updatedUser.email,
      companyName: updatedUser.companyName,
      avatarUrl: updatedUser.avatarUrl,
      message: "Avatar updated successfully",
    });
  } catch (error) {
    console.error("Update Avatar Error:", error);
    res.status(500).json({ error: "Failed to update avatar" });
  }
};

// ==========================================
// OTP LOGIC
// ==========================================

const generateOtpCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const requestOtp = async (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose)
      return res.status(400).json({ error: "Email and purpose are required" });

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ email, purpose, verified: false });
    await Otp.create({ email, code, purpose, expiresAt });
    await sendOtpEmail({ to: email, code });

    res.json({ message: "OTP sent to email", email, purpose });
  } catch (error) {
    console.error("OTP request error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

// Add this inside backend/src/controllers/auth.controller.js
export const verifyOtp = async (req, res) => {
  try {
    const { email, code, purpose, mode } = req.body;

    // Parse the payload if it exists
    let payload = null;
    if (req.body.payload) {
      try {
        payload = JSON.parse(req.body.payload);
      } catch (e) {
        console.error("Failed to parse JSON payload:", req.body.payload);
        return res.status(400).json({ error: "Invalid payload format" });
      }
    }

    const avatarFile = req.file;

    if (!email || !code || !purpose || !mode) {
      return res
        .status(400)
        .json({ error: "Missing required verification fields" });
    }

    const otpDoc = await Otp.findOne({ email, code, purpose, verified: false });
    if (!otpDoc) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
    if (otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    otpDoc.verified = true;
    await otpDoc.save();

    let user;
    let role = mode;
    let avatarUrl = "";

    if (purpose === "register") {
      avatarUrl = avatarFile
        ? `/uploads/avatars/${avatarFile.filename}`
        : getRandomAvatarUrl();

      if (mode === "seller") {
        const {
          email: payloadEmail,
          password,
          companyName,
          gstNumber,
          businessType,
          industry,
          annualTurnover,
        } = payload || {};
        const finalEmail = payloadEmail || email;

        if (!finalEmail || !password || !companyName || !gstNumber) {
          return res
            .status(400)
            .json({ error: "Missing registration fields for seller" });
        }

        const gstHash = hashField(gstNumber);
        const sellerExists = await Seller.findOne({ email: finalEmail });
        if (sellerExists)
          return res
            .status(400)
            .json({ error: "Email already registered as seller" });

        const isGstNumDuplicate = await Seller.findOne({ gstHash });
        if (isGstNumDuplicate)
          return res
            .status(400)
            .json({ error: "GST Number already registered" });

        user = await Seller.create({
          email: finalEmail,
          password,
          companyName,
          gstNumber,
          gstHash,
          businessType: businessType || "Services",
          industry: industry || "IT",
          annualTurnover: Number(annualTurnover) || 0,
          isOnboarded: false,
          kycStatus: "partial",
          avatarUrl,
        });
      } else if (mode === "lender") {
        // LENDER REGISTRATION
        const {
          email: payloadEmail,
          password,
          companyName,
          lenderType,
          lenderLicense,
          gstNumber,
        } = payload || {};
        const finalEmail = payloadEmail || email;

        console.log("Lender Registration Payload received:", payload);

        if (!finalEmail || !password || !companyName || !lenderType) {
          return res
            .status(400)
            .json({
              error: "Missing required fields for Lender registration.",
            });
        }

        // Bypassing strict RBI check for local development
        if (["Bank", "NBFC", "Institutional"].includes(lenderType)) {
          if (!lenderLicense || !gstNumber) {
            return res
              .status(400)
              .json({
                error:
                  "Corporate lenders must provide a GSTIN and an RBI License Number.",
              });
          }
          console.log(
            `✅ [DEV MODE]: Bypassing strict MockDB check for RBI License: ${lenderLicense}`,
          );
        }

        const lenderExists = await Lender.findOne({ email: finalEmail });
        if (lenderExists)
          return res
            .status(400)
            .json({ error: "Email already registered as lender" });

        let gstHash = null;
        if (gstNumber) {
          gstHash = hashField(gstNumber);
          const isGstNumDuplicate = await Lender.findOne({ gstHash });
          if (isGstNumDuplicate)
            return res
              .status(400)
              .json({
                error: "GST Number already registered to another Lender",
              });
        }

        try {
          user = await Lender.create({
            email: finalEmail,
            password,
            companyName,
            gstNumber: gstNumber || undefined,
            gstHash: gstHash || undefined,
            lenderType,
            lenderLicense: lenderLicense || undefined,
            isOnboarded: false,
            kycStatus: "partial",
            totalCreditLimit: 0,
            utilizedLimit: 0,
            walletBalance: 0,
            avatarUrl,
          });
        } catch (dbError) {
          console.error("Database Error during Lender creation:", dbError);
          // Handle specific mongoose validation errors
          return res
            .status(400)
            .json({
              error: "Database validation failed. Please check your inputs.",
            });
        }
      }
    } else if (purpose === "login") {
      if (mode === "seller") {
        user = await Seller.findOne({ email });
        if (!user)
          return res.status(400).json({ error: "Seller account not found" });
      } else {
        user = await Lender.findOne({ email });
        if (!user)
          return res.status(400).json({ error: "Lender account not found" });
      }

      if (!user.avatarUrl) {
        user.avatarUrl = getRandomAvatarUrl();
        await user.save();
      }
    }

    const token = generateToken(user._id, role);
    sendAuthCookie(res, token);

    return res.json({
      _id: user._id,
      email: user.email,
      companyName: user.companyName,
      role,
      avatarUrl: user.avatarUrl || "",
      isOnboarded: user.isOnboarded,
      kycStatus: user.kycStatus,
      message:
        purpose === "register" ? "Registration complete." : "Login verified",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res
      .status(500)
      .json({ error: "An unexpected error occurred during OTP verification." });
  }
};
