import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    // Link to Seller (User who uploaded it)
    seller: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Seller", 
      required: true 
    },
    
    // Link to Lender (Filled only when financed)
    lender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Lender" 
    },

    // 📄 Invoice Data (Extracted from PDF)
    invoiceNumber: { type: String, required: true },
    poNumber: { type: String },
    totalAmount: { type: Number, required: true },
    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    
    irn: { type: String, unique: true },
  buyerEmail: { type: String },

    // 🏢 Parties Involved
    sellerGst: { type: String },
    buyerGst: { type: String },
    buyerName: { type: String },

    // 📂 File & Metadata
    fileUrl: { type: String, required: true }, // Path to PDF
    description: { type: String },
    
    // 🚦 Status Workflow
    status: {
      type: String,
      enum: [
        "Pending_Buyer_Approval","Verified", "Rejected", "Pending_NOA", "Pending Admin Approval", "NOA_Verified", "Funded", "Repaid", "Cancelled","Overdue"],
      default: "Pending_Buyer_Approval"
    },
    repaymentAmount: { type: Number }, // What the buyer actually owes
    penaltyAmount: { type: Number, default: 0 },
    noaDocumentUrl: {
     type: String,
     default: null
    },

    visibleForMarketplaceDate: {
      type: Date,
    },

    // 💰 Financing Details (Populated later)
    fundedAt: { type: Date },
    repaymentDate: { type: Date }
  },
  { timestamps: true }
);
invoiceSchema.pre('save', function(next) {
  if (this.isNew && this.totalAmount) {
    this.repaymentAmount = this.totalAmount;
  }
});

// ⚠️ THIS IS CRITICAL: It must export the Model, NOT a Router
export default mongoose.model("Invoice", invoiceSchema);