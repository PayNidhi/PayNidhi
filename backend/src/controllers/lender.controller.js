import Invoice from "../models/Invoice.model.js";
import Bid from "../models/Bid.model.js";
import Transaction from "../models/Transaction.model.js"; // 👈 Added for Wallet History
import Lender from "../models/Lender.model.js";           // 👈 Added for Wallet Balance

// ==========================================
// @desc    Get Lender Dashboard Summary
// @route   GET /api/lender/dashboard-summary
// ==========================================
export const getDashboardSummary = async (req, res) => {
  try {
    const lenderId = req.user._id;

    // 1. Fetch the lender profile for wallet and limits
    const lender = await Lender.findById(lenderId);
    if (!lender) return res.status(404).json({ error: "Lender not found" });

    // 2. Count Active Bids (bids that aren't explicitly rejected)
    const activeBids = await Bid.countDocuments({ 
      lender: lenderId, 
      status: { $ne: "Rejected" } 
    });

    // 3. Count unique MSMEs (Sellers) this lender has interacted with
    const uniqueSellers = await Bid.distinct("seller", { lender: lenderId });
    const totalMSMEs = uniqueSellers.length;

    // 4. Portfolio Status Mock (You can replace with a real aggregation later)
    const portfolioStatusCounts = {
      "Active": 5,
      "Pending": activeBids,
      "Completed": 12
    };

    // 5. Historical Chart Data (Mocked growth for visual appeal until you have 12 months of live data)
    const deployedByMonth = [
      { name: 'Jan', value: 400000 }, { name: 'Feb', value: 700000 }, { name: 'Mar', value: 500000 },
      { name: 'Apr', value: 900000 }, { name: 'May', value: 1200000 }, { name: 'Jun', value: 800000 },
      { name: 'Jul', value: 1600000 }, { name: 'Aug', value: 1100000 }, { name: 'Sep', value: 1900000 },
      { name: 'Oct', value: 2100000 }, { name: 'Nov', value: 2400000 }, { name: 'Dec', value: Math.max(lender.utilizedLimit || 0, 2800000) }
    ];

    // 6. Send the response matching the frontend's exact expected structure
    res.json({
      totalInvested: lender.utilizedLimit || 0,
      availableCapital: lender.walletBalance || 0,
      activeBids: activeBids || 0,
      totalMSMEs: totalMSMEs || 0,
      trustScore: 850, // Hardcoded for lenders currently
      portfolioStatusCounts,
      deployedByMonth
    });

  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard summary." });
  }
};

// ==========================================
// @desc    Get Feed of Invoices + Bids
// @route   GET /api/lender/marketplace
// ==========================================
export const getMarketplace = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // 1. Get all Active Invoices
    const invoices = await Invoice.find({ 
      status: { $in: ["Verified"] },
      visibleForMarketplaceDate: { $gte: sevenDaysAgo } 
    })
      .populate("seller", "companyName businessType trustScore")
      .lean(); // .lean() converts Mongoose object to plain JSON so we can add 'bids' to it
    
    // 2. Attach Bids to each Invoice
    const feed = await Promise.all(
      invoices.map(async (invoice) => {
        // Get all bids for this invoice
        const bids = await Bid.find({ invoice: invoice._id })
          .populate("lender", "companyName") // Show who bid
          .sort({ interestRate: 1 }); // Sort by BEST rate (Lowest first)

        return {
          ...invoice,
          bids: bids, // List of all bids
          bidCount: bids.length,
          bestBid: bids.length > 0 ? bids[0].interestRate + "%" : "No Bids Yet"
        };
      })
    );

    res.json(feed);
  } catch (error) {
    console.error("Marketplace Error:", error);
    res.status(500).json({ error: "Could not load dashboard" });
  }
};

// ==========================================
// @desc    Place a Detailed Bid
// @route   POST /api/lender/bid/:invoiceId
// ==========================================
export const placeBid = async (req, res) => {
  try {
    // 1. Get Params & Body
    const { invoiceId } = req.params; 
    const { loanAmount, interestRate } = req.body;
    const lenderId = req.user._id;

    // 2. Fetch and Validate Invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ error: "Invoice not found." });
    
    // Ensure invoice is actually available for bidding
    if (invoice.status !== "Verified") {
      return res.status(400).json({ error: "Can only bid on Verified invoices." });
    }

    const minBid = invoice.totalAmount * 0.50;
    const maxBid = invoice.totalAmount * 0.80;

    if (loanAmount < minBid || loanAmount > maxBid) {
       return res.status(400).json({ 
      error: `Bid must be between 50% (₹${minBid}) and 80% (₹${maxBid}) of the invoice amount.` 
     });
    }   

    // 3. Calculate Tenure (Days until Due Date)
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const timeDiff = dueDate.getTime() - today.getTime();
    const calculatedTenure = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (calculatedTenure <= 0) {
      return res.status(400).json({ error: "Invoice is already due. Cannot finance." });
    }

    // 4. 🧮 FINANCIAL MATH
    // Interest = Principal * (MonthlyRate/100) * (Months) -> Treating 30 days as 1 month
    const interestAmount = Math.ceil(loanAmount * (interestRate / 100) * (calculatedTenure / 30));
    const repaymentAmount = loanAmount + interestAmount;

    // 5. Create the Bid (Strictly matching your schema)
    const newBid = await Bid.create({
      invoice: invoiceId,
      lender: lenderId,
      seller: invoice.seller, // Required by your schema
      loanAmount: loanAmount,
      interestRate: interestRate,
      repaymentAmount: repaymentAmount,
      tenureDays: calculatedTenure
    });

    res.status(201).json({
      success: true,
      message: "Bid Placed Successfully!",
      data: newBid,
      breakdown: {
        loanAmount: loanAmount,
        interest: interestAmount,
        repaymentAmount: repaymentAmount,
        tenureDays: calculatedTenure
      }
    });

  } catch (error) {
    console.error("Bidding Error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "You have already placed an active bid on this invoice." });
    }
    res.status(500).json({ error: "Failed to place bid." });
  }
};

// ==========================================
// @desc    Get All Active Invoices (Marketplace)
// @route   GET /api/lender/invoices
// ==========================================
export const getAllActiveInvoices = async (req, res) => {
    try {
      // Find invoices that are NOT yet financed
      const invoices = await Invoice.find({ 
          status: { $in: ["Verified", "Pending_Bids"] } 
      })
      .populate("seller", "companyName annualTurnover trustScore")
      .sort({ createdAt: -1 });
  
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
};

// ==========================================
// @desc    Get My Bids
// @route   GET /api/lender/my-bids
// ==========================================
export const getMyBids = async (req, res) => {
  try {
    // Assuming req.user._id is populated by 'protect' middleware
    const bids = await Bid.find({ lender: req.user._id })
      .populate("invoice")
      .sort({ createdAt: -1 });
    
    res.status(200).json(bids);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bids", error: error.message });
  }
};

// ==========================================
// 💳 NEW: GET WALLET DETAILS & TRANSACTIONS
// @route   GET /api/lender/wallet
// ==========================================
export const getWalletDetails = async (req, res) => {
  try {
    // 1. Get the current wallet balance
    const lender = await Lender.findById(req.user._id).select("walletBalance utilizedLimit");
    
    if (!lender) {
      return res.status(404).json({ error: "Lender profile not found" });
    }

    // 2. Fetch all transactions related to this lender
    const transactions = await Transaction.find({ lender: req.user._id })
      .populate("invoice", "invoiceNumber")
      .sort({ createdAt: -1 }); // Newest first

    res.json({
      success: true,
      balance: lender.walletBalance || 0,
      utilizedLimit: lender.utilizedLimit || 0,
      transactions
    });
  } catch (error) {
    console.error("Wallet Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch wallet details" });
  }
};

// ==========================================
// @desc    Lender requests a withdrawal
// @route   POST /api/lender/withdraw
// ==========================================
export const requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    const lenderId = req.user._id;

    // 1. Validate the Request
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Please enter a valid amount to withdraw." });
    }

    const lender = await Lender.findById(lenderId);
    if (!lender) return res.status(404).json({ error: "Lender not found." });

    if (amount > lender.walletBalance) {
      return res.status(400).json({
        error: "Insufficient wallet balance.",
        availableBalance: lender.walletBalance
      });
    }

    // 2. 🏦 FREEZE THE FUNDS (Deduct from virtual wallet)
    lender.walletBalance -= amount;
    await lender.save();

    // 3. 🧾 CREATE THE WITHDRAWAL LEDGER (Status: SUCCESS for instant demo)
    const withdrawalReceipt = await Transaction.create({
      lender: lenderId, // Attached to Lender
      amount: amount,
      fee: 0, 
      type: "WITHDRAWAL",
      status: "SUCCESS", 
      referenceId: `WD-${Date.now()}`,
      description: `Withdrawal to primary bank account`
    });

    res.status(200).json({
      success: true,
      message: "Withdrawal request submitted successfully. Funds will arrive in 1-2 business days.",
      receipt: withdrawalReceipt,
      remainingBalance: lender.walletBalance
    });

  } catch (error) {
    console.error("Withdrawal Error:", error);
    res.status(500).json({ error: "Failed to process withdrawal request." });
  }
};