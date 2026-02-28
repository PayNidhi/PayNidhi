import cron from "node-cron";
import Invoice from "../models/Invoice.model.js";
import Bid from "../models/Bid.model.js"; 
import { updateSellerTrustScore } from "./creditScore.utils.js";

export const runSettlementCheck = async () => {
    console.log("⚙️ [Settlement Engine] Running overdue payment check...");
    try {
        const today = new Date();

        const overdueInvoices = await Invoice.find({
            status: "Funded",
            dueDate: { $lt: today }
        });

        if (overdueInvoices.length === 0) return { message: "No overdue invoices found." };

        for (let invoice of overdueInvoices) {
            invoice.status = "Overdue";
            
            // 1. Fetch winning bid to get the exact Loan Amount
            const winningBid = await Bid.findOne({ 
                invoice: invoice._id, 
                status: "Funded" // Ensure this matches your active bid status string
            });

            const actualLoanAmount = winningBid ? winningBid.loanAmount : (invoice.totalAmount * 0.80);
            
            // 2. Calculate the 2% penalty strictly on the Loan Amount
            const penalty = actualLoanAmount * 0.02; 
            
            // 3. Update the tracking fields
            invoice.penaltyAmount = (invoice.penaltyAmount || 0) + penalty;
            invoice.repaymentAmount = invoice.totalAmount + invoice.penaltyAmount;
            
            await invoice.save();
            await updateSellerTrustScore(invoice.seller);
            
            console.log(`🚨 Invoice ${invoice.invoiceNumber} OVERDUE. Penalty: ₹${penalty}.`);
        }
        return { message: `Processed ${overdueInvoices.length} overdue invoices.` };
    } catch (error) {
        console.error("❌ [Settlement Engine] Error:", error);
    }
};

// Start the automated Cron Job
export const startCronJobs = () => {
    cron.schedule("0 0 * * *", () => {
        runSettlementCheck();
    });
    console.log("🕒 Background Cron Jobs Initialized");
};