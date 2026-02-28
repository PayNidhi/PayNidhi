import express from "express";
import Admin from "../models/Admin.model.js";

// Import your admin controllers
import {
  loginAdmin,
  verifyAdminLogin,
  getPlatformStats,
  getAllSellers,
  getAllLenders,
  getPendingNOAInvoices,
  verifyNOA,
  toggleUserStatus,
  getAllTransactionsAdmin,
  getAllFinancesAdmin,
  getAllInvoicesAdmin,
  processBuyerRepayment,
  triggerManualSettlement
} from "../controllers/admin.controller.js";

const router = express.Router();

// ==========================================
// TEMPORARY SETUP: CREATE MASTER ADMIN
// ==========================================
// Hit this route ONCE from your browser to save the admin to MongoDB
router.get("/create-master-admin", async (req, res) => {
  try {
    const adminExists = await Admin.findOne({
      email: "ingleprathamesh34@gmail.com",
    });
    if (adminExists) {
      return res.json({
        message: "Admin already exists in the database! You can go log in.",
      });
    }

    // This creates the admin and triggers the password hash in your model
    await Admin.create({
      name: "Master Admin",
      email: "ingleprathamesh34@gmail.com",
      password: "Admin@123",
      role: "superadmin",
    });

    res.json({
      success: true,
      message:
        "Master Admin created successfully! Go to your frontend and log in.",
    });
  } catch (error) {
    console.error("Setup Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ACTUAL ADMIN AUTH ROUTES
// ==========================================
// We map these to the functions you already wrote in your controller
router.post("/login", loginAdmin);
router.post("/verify", verifyAdminLogin);

// ==========================================
// DASHBOARD & MANAGEMENT ROUTES
// ==========================================
router.get("/stats", getPlatformStats);
router.get("/sellers", getAllSellers);
router.get("/lenders", getAllLenders);
router.get("/invoices/pending-noa", getPendingNOAInvoices);
router.patch("/invoice/:id/verify-noa", verifyNOA);
// router.post("/invoice/:id/settle", processBuyerRepayment);
router.patch("/user/:role/:id/toggle", toggleUserStatus);
router.get("/transactions", getAllTransactionsAdmin);
router.get("/finances", getAllFinancesAdmin);
router.get("/ledger", getAllInvoicesAdmin);
router.post("/:id/process-repayment", processBuyerRepayment);
router.post("/trigger-settlement",triggerManualSettlement);

export default router;
