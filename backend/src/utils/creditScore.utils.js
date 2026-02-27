// utils/creditScore.utils.js
import Seller from "../models/Seller.model.js";
import Invoice from "../models/Invoice.model.js";

export const updateSellerTrustScore = async (sellerId) => {
  try {
    const seller = await Seller.findById(sellerId);
    if (!seller) return null;

    let score = 300; // Base baseline score

    // 1. KYC Verification Boost (+150)
    if (seller.kycStatus === "verified") {
      score += 150;
    }

    // 2. Fetch all historical invoices to judge behavior
    const invoices = await Invoice.find({ seller: sellerId });

    let repaidCount = 0;
    let fundedCount = 0;
    let rejectedCount = 0;

    invoices.forEach((inv) => {
      if (inv.status === "Repaid") repaidCount++;
      if (inv.status === "Funded") fundedCount++;
      if (inv.status === "Rejected_By_Buyer" || inv.status === "Admin_Rejected")
        rejectedCount++;
    });

    // 3. Apply Behavioral Math
    score += repaidCount * 50; // Massive boost for paying back on time
    score += fundedCount * 20; // Small boost for active, healthy borrowing
    score -= rejectedCount * 50; // Heavy penalty for fraudulent/rejected invoices

    // 4. Enforce standard credit score bounds (300 to 900)
    score = Math.max(300, Math.min(900, score));

    // 5. Save the new metrics back to the Seller profile
    seller.trustScore = score;
    seller.totalInvoicesRepaid = repaidCount;
    seller.totalInvoicesFunded = fundedCount;
    seller.defaultedInvoices = rejectedCount;

    await seller.save();
    console.log(
      `[PayNidhi Engine] Trust Score updated for ${seller.companyName}: ${score}`,
    );

    return score;
  } catch (error) {
    console.error("Error calculating trust score:", error);
    return null;
  }
};
