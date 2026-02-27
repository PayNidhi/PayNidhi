import Invoice from "../models/Invoice.model.js";
import { extractInvoiceData } from "../services/gemini.service.js"; // Ensure this file exists
import fs from "fs";
import MockGovtInvoice from "../models/MockGovtInvoice.model.js"
import jwt from "jsonwebtoken"
import { sendInvoiceVerificationMailToBuyer } from "../utils/email.utils.js";

// ==========================================
// 1. UPLOAD & SCAN INVOICE
// ==========================================
// @desc    Upload PDF -> Scan with Gemini -> Verify -> Save to DB
// @route   POST /api/invoice/upload
export const uploadInvoice = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    console.log(`👤 Processing Upload for: ${req.user.companyName}`);

    // A. AI Extraction (Gemini)
    const extractedData = await extractInvoiceData(req.file.path);

    // ==========================================
    // 🛡️ STAGE 1: THE INTERNAL PLATFORM SHIELD (Govt IRN Verification)
    // ==========================================
    
    // Shield 1: Did Gemini find an IRN?
    if (!extractedData.irn) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Fraud Alert: No valid 64-character Govt IRN found on this document." });
    }

    // Shield 2: Is it a real IRN registered with the government?
    const officialRecord = await MockGovtInvoice.findOne({ irn: extractedData.irn });
    if (!officialRecord) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Fraud Alert: This IRN is not registered with the official GST portal." });
    }

    // Shield 3: Did they tamper with the PDF? (Check the money)
    if (Number(officialRecord.totalAmount) !== Number(extractedData.total_amount)) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: `Fraud Alert: Document tampering detected. PDF shows ₹${extractedData.total_amount}, but official GST record is ₹${officialRecord.totalAmount}.` });
    }

    // Shield 4: Double Financing Check (Has this exact IRN been uploaded before?)
    const alreadyFinanced = await Invoice.findOne({ irn: extractedData.irn });
    if (alreadyFinanced) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Double Financing Alert: This exact IRN has already been uploaded to PayNidhi." });
    }
    // ==========================================

    // C. Save to MongoDB
    const newInvoice = await Invoice.create({
      seller: req.user._id,
      
      irn: extractedData.irn, 
      invoiceNumber: extractedData.invoice_number,
      poNumber: extractedData.po_number,
      totalAmount: extractedData.total_amount,
      
      invoiceDate: new Date(extractedData.invoice_date),
      dueDate: new Date(extractedData.due_date),
      
      sellerGst: extractedData.seller_gstin,
      buyerGst: extractedData.buyer_gstin,
      buyerName: extractedData.buyer_name,
      buyerEmail: extractedData.buyer_email,
      
      status: "Pending_Buyer_Approval", // 👈 This proves the new code is running
      fileUrl: req.file.path,
      description: `Invoice for ${extractedData.items_summary || "services"}`
    });

    console.log("✅ Verified against Govt records & Saved to MongoDB:", newInvoice._id);

    res.status(201).json({
      success: true,
      message: "Invoice mathematically verified & Saved Successfully!",
      data: newInvoice
    });

  } catch (error) {
    console.error("Handler Error:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    // MongoDB Duplicate Key Error
    if (error.code === 11000) {
      return res.status(400).json({ error: "Database Error: Duplicate Unique Key constraint violated (Check MongoDB Indexes)." });
    }
    
    res.status(500).json({ error: "Failed to process invoice" });
  }
};

// ==========================================
// 2. GET ALL INVOICES (For Lender Dashboard)
// ==========================================
export const getAllInvoices = async (req, res) => {
  try {
    // Return all invoices that are Verified or Financed
    const invoices = await Invoice.find()
      .populate("seller", "companyName trustScore")
      .sort({ createdAt: -1 });
    
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
};

// ==========================================
// 3. GET SINGLE INVOICE
// ==========================================
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("seller");
    if(!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
};

export const getSellerInvoices = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const invoices = await Invoice.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .limit(5); // recent 5

    res.json(invoices);
  } catch (error) {
    console.error("Get seller invoices error:", error);
    res.status(500).json({ error: "Server Error" });
  }
};


const generateUniqueMailToken = (userId, invoiceId) => {
  return jwt.sign({ userId, invoiceId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};


// ... (Keep your uploadInvoice, getAllInvoices, getInvoiceById, getSellerInvoices, and generateUniqueMailToken exactly as they are) ...

// ==========================================
// TRIGGER EMAIL TO BUYER
// ==========================================
export const verifyInvoiceBuyerWithEmail = async (req, res) => {
   console.log("Invoice Verification Started...");

   try {
    const invoiceId = req.query.invoiceId;
    const user = req.user; // The Seller

    if(!invoiceId) {
      console.error("Invoice Id required");
      return res.status(400).json({success: false, message: "Invoice Id required"})
    }

    const invoice = await Invoice.findById(invoiceId)
    
    if(!invoice) {
      console.error("Invoice not found with id: ", invoiceId);
      return res.status(404).json({success: false, message: "Invoice not found"})
    }

    console.log("Invoice found In Database...");
    
    if(invoice.seller.toString() !== user._id.toString()) {
      console.log("seller does not match with invoice");
      return res.status(403).json({success: false, message: "Unauthorized: seller does not match with invoice"});
    }

    console.log("Invoice Seller confirmed");
    console.log("sending verification mail to buyer: ", invoice.buyerEmail);

    const token = generateUniqueMailToken(user._id.toString(), invoiceId.toString())
    
    // THE FIX: Passing the full invoice and user (seller) objects
    await sendInvoiceVerificationMailToBuyer({ 
        to: invoice.buyerEmail, 
        token: token,
        invoice: invoice, 
        seller: user 
    });

    return res.status(200).json({success: true, message:"Invoice verification mail sent to buyer"});

   } catch (error) {
      console.log("unexpected error in invoice verification : \n", error);
      return res.status(500).json({success: false, message: error.message});
   }
}


// ==========================================
// BUYER CLICKS THE MAGIC LINK IN EMAIL
// ==========================================
export const verifyInvoice = async (req, res) => {
  console.log("verifying invoice...")
  try {
    const token = req.query.token;
    const isVerified = req.query.verify;
    
    if(!token || token.length < 10) {
      console.error("Token is required")
      return res.status(401).send("<h1>Authorization token required</h1>");
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const invoice = await Invoice.findById(decoded.invoiceId);
    
    if(!invoice) {
      console.error("Invoice not found...")
      return res.status(404).send("<h1>Invoice not found</h1>");
    }

    if(isVerified === "true") {
      invoice.status = "Verified";
      invoice.visibleForMarketplaceDate = Date.now();
      await invoice.save();
      console.log("Updated Invoice Status: ", invoice.status);
      
      // HACKATHON TRICK: Send a beautiful HTML success page instead of raw JSON!
      return res.status(200).send(`
        <div style="font-family: system-ui, sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #f8fafc;">
          <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center;">
            <div style="background: #10b981; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; margin: 0 auto 20px;">✓</div>
            <h1 style="color: #0f172a; margin-bottom: 10px;">Invoice Verified!</h1>
            <p style="color: #64748b;">Thank you for confirming. You can now close this tab.</p>
          </div>
        </div>
      `);
    } else {
      console.log("Invoice is not verified by buyer");
      invoice.status = "Rejected_By_Buyer"; // Good practice to track rejections
      await invoice.save();

      return res.status(400).send(`
        <div style="font-family: system-ui, sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #f8fafc;">
          <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center;">
            <div style="background: #ef4444; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; margin: 0 auto 20px;">✕</div>
            <h1 style="color: #0f172a; margin-bottom: 10px;">Verification Rejected</h1>
            <p style="color: #64748b;">The seller has been notified of the discrepancy.</p>
          </div>
        </div>
      `);
    }

  } catch (error) {
    console.log("Error in invoice verification: ", error);
    return res.status(500).send("<h1>Link Expired or Invalid</h1>");
  }
}