import { Router } from "express";
import { createOrder, verifyPayment, createTopUpOrder, verifyTopUp } from "../controllers/payment.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = Router();

// ==========================================
// 🔒 SECURE PAYMENT ROUTES (Lender Only)
// ==========================================

// Step 1: Lender clicks "Pay" -> Generates Razorpay Order ID
// 🌐 Route: POST /api/payment/create-order
router.post("/create-order", protect, authorize("lender"), createOrder);

// Step 2: Razorpay Success -> Verifies signature, takes Admin cut, pays Seller, creates Ledgers
// 🌐 Route: POST /api/payment/verify
router.post("/verify", protect, authorize("lender"), verifyPayment);

router.post("/topup/create-order", protect, authorize("lender"), createTopUpOrder);
router.post("/topup/verify", protect, authorize("lender"), verifyTopUp);

export default router;