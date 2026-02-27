import Admin from "../models/Admin.model.js";
import jwt from "jsonwebtoken";
import Seller from "../models/Seller.model.js";
import Lender from "../models/Lender.model.js";
import Invoice from "../models/Invoice.model.js";
import Otp from "../models/Otp.model.js";
import { sendOtpEmail } from "../utils/email.utils.js";
import Transaction from "../models/Transaction.model.js";
import Finance from "../models/Finance.model.js";
import Bid from "../models/Bid.model.js";

// 🛡️ Admin tokens expire in 1 day (Strict Security)
const generateAdminToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

const sendAdminCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000, // 1 Day in milliseconds
  });
};

// ==========================================
// 🔓 ADMIN LOGIN (Hidden Endpoint)
// ==========================================
const generateOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// ==========================================
// 🔓 STEP 1: ADMIN LOGIN
// ==========================================
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const admin = await Admin.findOne({ email });

    // 1. Check Password
    if (admin && (await admin.matchPassword(password))) {

      // 2. Generate and Send OTP
      const code = generateOtpCode();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

      console.log(`🚨 THE REAL ADMIN OTP IS: ${code}`);

      await Otp.deleteMany({ email, purpose: "admin_login", verified: false });
      await Otp.create({ email, code, purpose: "admin_login", expiresAt });
      await sendOtpEmail({ to: email, code });

      console.log(`🔐 Admin password verified for ${email}. OTP Sent.`);

      return res.status(200).json({
        message: "Password verified. OTP sent to admin email.",
        email: admin.email
      });

    } else {
      console.log("⚠️ Failed Admin login attempt detected.");
      return res.status(401).json({ error: "Invalid Admin Credentials." });
    }
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ error: "Internal Server Error." });
  }
};

// ==========================================
// 🔓 STEP 2: VERIFY ADMIN OTP & ISSUE TOKEN
// ==========================================
export const verifyAdminLogin = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Email and OTP code are required." });
    }

    // 1. Verify OTP
    const otpDoc = await Otp.findOne({ email, code, purpose: "admin_login", verified: false });

    if (!otpDoc) return res.status(400).json({ error: "Invalid or expired OTP." });
    if (otpDoc.expiresAt < new Date()) return res.status(400).json({ error: "OTP has expired." });

    otpDoc.verified = true;
    await otpDoc.save();

    // 2. Issue God-Mode Token
    const admin = await Admin.findOne({ email });
    const token = generateAdminToken(admin._id, admin.role);
    sendAdminCookie(res, token);

    console.log(`🚨 GOD-MODE ACTIVATED: ${admin.email} passed 2FA.`);

    res.status(200).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      message: "God-Mode Activated. Welcome to PayNidhi Command Center.",
    });

  } catch (error) {
    console.error("Admin OTP Verification Error:", error);
    res.status(500).json({ error: "Internal Server Error." });
  }
};

// ==========================================
// PAGE 1: GET ALL SELLERS
// ==========================================
export const getAllSellers = async (req, res) => {
  try {
    const sellers = await Seller.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      totalSellers: sellers.length,
      sellers
    });
  } catch (error) {
    console.error("Fetch Sellers Error:", error);
    res.status(500).json({ error: "Failed to fetch sellers." });
  }
};

// ==========================================
// PAGE 2: GET ALL LENDERS
// ==========================================
export const getAllLenders = async (req, res) => {
  try {
    const lenders = await Lender.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      totalLenders: lenders.length,
      lenders
    });
  } catch (error) {
    console.error("Fetch Lenders Error:", error);
    res.status(500).json({ error: "Failed to fetch lenders." });
  }
};

// ==========================================
// 2. GET THE GLOBAL LEDGER (All Invoices)
// ==========================================
export const getAllInvoicesAdmin = async (req, res) => {
  try {
    const invoices = await Invoice.find({})
      .populate("seller", "companyName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      totalInvoices: invoices.length,
      invoices
    });
  } catch (error) {
    console.error("Fetch Invoices Error:", error);
    res.status(500).json({ error: "Failed to fetch global ledger." });
  }
};

// ==========================================
// 3. PLATFORM ANALYTICS
// ==========================================
export const getPlatformStats = async (req, res) => {
  try {
    const [
      sellerCount,
      lenderCount,
      activeLoansCount,
      revenueResult,
      gmvResult,
      pendingKyc,
      pendingWithdrawals,
      recentLedger
    ] = await Promise.all([
      Seller.countDocuments({ isActive: true }),
      Lender.countDocuments({ isActive: true }),
      Finance.countDocuments({ isSettled: false }),
      Transaction.aggregate([
        { $match: { type: "PLATFORM_FEE", status: "SUCCESS" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Finance.aggregate([
        { $group: { _id: null, total: { $sum: "$loanAmount" } } }
      ]),
      Seller.find({ kycStatus: "Pending" })
        .select("companyName email createdAt")
        .sort({ createdAt: 1 })
        .limit(5),
      Transaction.find({ type: "WITHDRAWAL", status: "PENDING" })
        .populate("seller", "companyName email")
        .select("amount referenceId createdAt seller")
        .sort({ createdAt: 1 })
        .limit(5),
      Transaction.find()
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    const totalGMV = gmvResult.length > 0 ? gmvResult[0].total : 0;

    res.status(200).json({
      success: true,
      kpis: {
        totalRevenue,
        totalGMV,
        activeUsers: { sellers: sellerCount, lenders: lenderCount },
        activeLoans: activeLoansCount
      },
      actionRequired: { pendingKyc, pendingWithdrawals },
      recentLedger
    });
  } catch (error) {
    console.error("Admin Dashboard Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch platform statistics." });
  }
};

// ==========================================
// PAGE 4: GET ALL TRANSACTIONS
// ==========================================
export const getAllTransactionsAdmin = async (req, res) => {
  try {
    const transactions = await Transaction.find({})
      .populate("lender", "companyName email")
      .populate("seller", "companyName email")
      .populate("invoice", "invoiceNumber amount")
      .sort({ createdAt: -1 });

    res.status(200).json({
      totalTransactions: transactions.length,
      transactions
    });
  } catch (error) {
    console.error("Fetch Transactions Error:", error);
    res.status(500).json({ error: "Failed to fetch transaction ledger." });
  }
};

// ==========================================
// PAGE 5: GET ALL FINANCED LOANS
// ==========================================
export const getAllFinancesAdmin = async (req, res) => {
  try {
    const finances = await Finance.find({})
      .populate("lender", "companyName email")
      .populate("seller", "companyName email")
      .populate("invoice", "invoiceNumber amount status")
      .populate("bid", "interestRate repaymentAmount")
      .sort({ createdAt: -1 });

    res.status(200).json({
      totalFinancedLoans: finances.length,
      activeLoans: finances.filter(f => !f.isSettled).length,
      settledLoans: finances.filter(f => f.isSettled).length,
      finances
    });
  } catch (error) {
    console.error("Fetch Finances Error:", error);
    res.status(500).json({ error: "Failed to fetch the loan book." });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { role, id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive must be a boolean value." });
    }

    let user;
    if (role === "seller") user = await Seller.findById(id);
    else if (role === "lender") user = await Lender.findById(id);
    else return res.status(400).json({ error: "Invalid role." });

    if (!user) return res.status(404).json({ error: "User not found." });

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `${role.toUpperCase()} account has been ${isActive ? "Re-activated" : "Suspended"}.`,
      user: { id: user._id, email: user.email, isActive: user.isActive }
    });
  } catch (error) {
    console.error("Toggle User Status Error:", error);
    res.status(500).json({ error: "Failed to update user status." });
  }
};

// ==========================================
// ACTION 2: THE KILL SWITCH
// ==========================================
export const cancelInvoiceAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found." });

    if (invoice.status === "Funded" || invoice.status === "Repaid") {
      return res.status(400).json({ error: "Cannot cancel an invoice that is already funded or repaid." });
    }

    invoice.status = "Cancelled";
    await invoice.save();

    await Bid.updateMany(
      { invoice: invoice._id, status: "Pending" },
      { $set: { status: "Rejected" } }
    );

    res.status(200).json({
      success: true,
      message: "Invoice cancelled and removed from the marketplace.",
      reasonProvided: reason || "Admin Intervention"
    });
  } catch (error) {
    console.error("Cancel Invoice Error:", error);
    res.status(500).json({ error: "Failed to cancel the invoice." });
  }
};

// ==========================================
// @desc    Admin verifies the uploaded NOA
// @route   PATCH /api/admin/invoice/:id/verify-noa
// ==========================================
export const verifyNOA = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved, reason } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found." });

    // ✅ FIX: The Admin must look for "Pending Admin Approval" to verify it
    if (invoice.status !== "Pending Admin Approval") {
      return res.status(400).json({ error: "Invoice is not pending NOA review." });
    }

    if (isApproved) {
      invoice.status = "NOA_Verified"; // 🟢 Green light for Lender to pay
    } else {
      invoice.status = "Pending_NOA"; // 🔴 Sent back to seller to re-upload
    }

    await invoice.save();

    res.status(200).json({
      success: true,
      message: isApproved ? "NOA Verified. Lender can now fund." : "NOA Rejected. Seller must re-upload.",
      status: invoice.status
    });
  } catch (error) {
    console.error("Verify NOA Error:", error);
    res.status(500).json({ error: "Failed to verify NOA." });
  }
};

// ==========================================
// @desc    Get all invoices waiting for NOA Review
// @route   GET /api/admin/invoices/pending-noa
// ==========================================
export const getPendingNOAInvoices = async (req, res) => {
  try {
    // ✅ FIX: The Admin must search the DB for "Pending Admin Approval"
    const invoices = await Invoice.find({ status: "Pending Admin Approval" })
      .populate("seller", "companyName email")
      .select("invoiceNumber totalAmount noaDocumentUrl createdAt status")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    console.error("Fetch Pending NOA Error:", error);
    res.status(500).json({ error: "Failed to fetch NOA queue." });
  }
};

export const processBuyerRepayment = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found." });

    console.log("invoice found")
    if (invoice.status !== "Funded") {
      return res.status(400).json({ error: "Only 'Funded' invoices can be settled." });
    }

    const winningBid = await Bid.findOne({ invoice: id, status: "Funded" });
    if (!winningBid) return res.status(404).json({ error: "Winning bid not found." });
    console.log("winning bid found")
    const buyerPayment = invoice.totalAmount;
    const lenderPrincipal = winningBid.loanAmount;
    const platformFee = Math.ceil(lenderPrincipal * 0.02);
    const lenderTotalReturn = lenderPrincipal - platformFee;
    const sellerRemainingBalance = buyerPayment - lenderTotalReturn - platformFee;
    console.log(sellerRemainingBalance)
    await Lender.findByIdAndUpdate(winningBid.lender, {
      $inc: { walletBalance: lenderTotalReturn }
    });

    await Seller.findByIdAndUpdate(invoice.seller, {
      $inc: { walletBalance: sellerRemainingBalance }
    });

    await Transaction.insertMany([
      {
        userType: "Lender",
        lender: winningBid.lender,
        type: "REPAYMENT_IN",
        amount: lenderTotalReturn,
        status: "SUCCESS",
        referenceId: `SETTLE_${invoice.invoiceNumber}_LENDER`
      },
      {
        userType: "Seller",
        seller: invoice.seller,
        type: "REMAINING_BALANCE_IN",
        amount: sellerRemainingBalance,
        status: "SUCCESS",
        referenceId: `SETTLE_${invoice.invoiceNumber}_SELLER`
      },
      {
        userType: "Admin",
        type: "PLATFORM_FEE",
        amount: platformFee,
        status: "SUCCESS",
        referenceId: `SETTLE_${invoice.invoiceNumber}_FEE`
      }
    ]);

    invoice.status = "Repaid";
    await invoice.save();

    winningBid.status = "Repaid";
    await winningBid.save();

    res.status(200).json({
      success: true,
      message: "Buyer payment simulated and funds settled successfully.",
      splitBreakdown: {
        buyerPaid: buyerPayment,
        lenderReceived: lenderTotalReturn,
        platformFee,
        sellerReceived: sellerRemainingBalance
      }
    });

  } catch (error) {
    console.error("Settlement Engine Error:", error);
    res.status(500).json({ error: "Failed to process settlement." });
  }
};