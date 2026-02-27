// backend/src/routes/seller.routes.js
import express from "express";
import { kycVerification } from "../controllers/kyc.controller.js";
import { uploadNOADocument} from "../controllers/seller.controller.js"
import multer from 'multer'
// Seller Controllers - ALL functions now properly imported
import { 
  getMyInvoices, 
  respondToBid, 
  getInvoiceWithBids,
  dashboardSummary ,
  requestWithdrawal  // ✅ ADDED THIS
} from "../controllers/seller.controller.js";

// Middleware
import { protect, authorize } from "../middleware/auth.middleware.js";
const upload = multer({ dest: "uploads/" });
const router = express.Router();

// ==========================================
// SELLER ROUTES
// All routes protected & seller-only
// ==========================================
router.post("/kyc-verification", protect, authorize("seller"), kycVerification);

// 1. ✅ DASHBOARD SUMMARY (NEW - fixes your crash)
router.get("/dashboard-summary", protect, authorize("seller"), dashboardSummary);

// 2. Get all seller invoices
router.get("/invoices", protect, authorize("seller"), getMyInvoices);
export default router;
