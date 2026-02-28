import { Router } from "express";
import { 
  getDashboardSummary, // 👈 ADDED HERE
  getMarketplace, 
  placeBid, 
  getMyBids,
  getWalletDetails,
  requestWithdrawal 
} from "../controllers/lender.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { lenderKycVerification } from "../controllers/kyc.controller.js";

const router = Router();

// 1. Dashboard (Summary)  👈 ADDED THIS ROUTE HERE
router.get("/dashboard-summary", protect, authorize("lender"), getDashboardSummary);

// 2. Dashboard (Feed)
router.get("/marketplace", protect, authorize("lender"), getMarketplace);

// 3. KYC
router.post("/kyc-verification", protect, authorize("lender"), lenderKycVerification);

// 4. Place a Bid
router.post("/bid/:invoiceId", protect, authorize("lender"), placeBid);

// 5. Get My Bids (For LenderBidsPage)
router.get("/my-bids", protect, authorize("lender"), getMyBids);

// 6. Wallet Endpoints
router.get("/wallet", protect, authorize("lender"), getWalletDetails);
router.post("/withdraw", protect, requestWithdrawal);

export default router;