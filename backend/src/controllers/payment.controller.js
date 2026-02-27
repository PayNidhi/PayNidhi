import Razorpay from "razorpay";
import crypto from "crypto";
import Bid from "../models/Bid.model.js";
import Invoice from "../models/Invoice.model.js";
import Seller from "../models/Seller.model.js";
import Admin from "../models/Admin.model.js";         // 👈 Added
import Finance from "../models/Finance.model.js";     // 👈 Added
import Transaction from "../models/Transaction.model.js"; // 👈 Added

// ==========================================
// 1. Create Order (Lender clicks "Pay")
// ==========================================
export const createOrder = async (req, res) => {
  console.log("creating order....")
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { bidId } = req.body;

    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ error: "Bid not found" });

    // Convert amount to paise for Razorpay
    const amountInPaise = Math.round(bid.loanAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${bidId}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
};

// ==========================================
// 2. Verify Payment & Route the Money
// ==========================================
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bidId } = req.body;

    // 1. Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: "Invalid payment signature" });
    }

    // 2. 🚀 PAYMENT SUCCESSFUL! Let's process the financial logic.
    const bid = await Bid.findById(bidId).populate("invoice");
    if (!bid) return res.status(404).json({ error: "Bid not found" });
    
    if (bid.invoice.status !== "NOA_Verified") {
    return res.status(403).json({ 
    error: "Cannot fund yet. Waiting for Notice of Assignment to be legally verified." 
    });
    }
    // 🧮 A. Calculate Fees
    const PLATFORM_FEE_PERCENTAGE = 2.0; // PayNidhi takes a 2% cut
    const platformFeeAmount = (bid.loanAmount * PLATFORM_FEE_PERCENTAGE) / 100;
    const netDisbursement = bid.loanAmount - platformFeeAmount; // Seller gets 98%

    // 🏦 B. Money Movement (Wallets)
    // Pay the Admin
    const superAdmin = await Admin.findOne({ role: "superadmin" });
    if (superAdmin) {
      superAdmin.wallet = (superAdmin.wallet || 0) + platformFeeAmount;
      await superAdmin.save();
    }

    // Pay the Seller
    const seller = await Seller.findById(bid.invoice.seller);
    if (seller) {
      seller.walletBalance = (seller.walletBalance || 0) + netDisbursement;
      await seller.save();
      console.log(`✅ Credited ₹${netDisbursement} to Seller: ${seller.companyName || seller.name}`);
    }

    // 📖 C. Create the Loan Book Record (Finance)
    await Finance.create({
      invoice: bid.invoice._id,
      bid: bid._id,
      lender: bid.lender,
      seller: bid.seller,
      amount: bid.loanAmount,
      fee: platformFeeAmount,
      transactionDate: new Date(),
      dueDate: bid.invoice.dueDate,
      isSettled: false
    });

    // 🧾 D. Create the Master Ledger Receipts (Transactions)
    // Receipt 1: PayNidhi Fee
    await Transaction.create({
      invoice: bid.invoice._id,
      lender: bid.lender,
      seller: bid.seller,
      amount: platformFeeAmount,
      type: "PLATFORM_FEE",
      status: "SUCCESS",
      referenceId: `FEE-${razorpay_order_id}`,
      razorpay_payment_id: razorpay_payment_id,
      description: `PayNidhi 2% Platform Fee`
    });

    // Receipt 2: Seller Disbursement
    await Transaction.create({
      invoice: bid.invoice._id,
      lender: bid.lender,
      seller: bid.seller,
      amount: netDisbursement,
      type: "DISBURSEMENT",
      status: "SUCCESS",
      referenceId: `DISB-${razorpay_order_id}`,
      razorpay_payment_id: razorpay_payment_id,
      description: `Loan Disbursement to Seller (Net of fees)`
    });

    // 🚦 E. Update Deal Statuses
    // Mark the winning bid
    bid.status = "Funded";
    await bid.save();

    // Mark the invoice as Funded
    bid.invoice.status = "Funded";
    await bid.invoice.save();

    // Reject all OTHER pending bids on this invoice
    await Bid.updateMany(
      { invoice: bid.invoice._id, _id: { $ne: bid._id } },
      { $set: { status: "Rejected" } }
    );

    // 🎉 DONE!
    return res.json({ 
      success: true, 
      message: "Payment verified, ledgers updated, and Seller wallet credited!",
      breakdown: {
        totalFunded: bid.loanAmount,
        paynidhiCut: platformFeeAmount,
        sellerReceived: netDisbursement
      }
    });

  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ error: "Failed to verify payment and process ledgers" });
  }
};

// ==========================================
// 3. Create Order (Wallet Top-Up)
// ==========================================
export const createTopUpOrder = async (req, res) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { amount } = req.body; // Amount in INR
    if (!amount || amount < 100) return res.status(400).json({ error: "Minimum top-up is ₹100" });

    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `topup_${req.user._id}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("TopUp Order Error:", error);
    res.status(500).json({ error: "Failed to create top-up order" });
  }
};

// ==========================================
// 4. Verify Wallet Top-Up
// ==========================================
export const verifyTopUp = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: "Invalid payment signature" });
    }

    // 1. Update Lender Wallet
    const lender = await Lender.findByIdAndUpdate(
      req.user._id,
      { $inc: { walletBalance: amount } }, // Add money!
      { new: true }
    );

    // 2. Record Transaction in Ledger
    await Transaction.create({
      lender: req.user._id,
      amount: amount,
      type: "DEPOSIT",
      status: "SUCCESS",
      referenceId: `DEP-${razorpay_payment_id}`,
      razorpay_payment_id: razorpay_payment_id,
      description: "Wallet Top-Up via Razorpay"
    });

    res.json({ 
      success: true, 
      message: "Wallet topped up successfully!",
      newBalance: lender.walletBalance
    });

  } catch (error) {
    console.error("TopUp Verify Error:", error);
    res.status(500).json({ error: "Failed to verify top-up" });
  }
};