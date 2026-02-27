import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    // 🔗 RELATIONS
    invoice: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Invoice", 
      required: true 
    },
    lender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Lender", 
      required: true 
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    // 💰 THE OFFER (Input by Lender)
    loanAmount: { 
      type: Number, 
      required: true 
    }, // e.g., ₹50,000

  interestRate: {
      type: Number,
      required: true,
      min: 0.1, // Minimum interest rate they can offer
      max: 36.0, // Maximum cap to prevent predatory lending
    }, // Monthly Interest % (e.g., 1.5%)

    repaymentAmount: { 
      type: Number, 
      required: true 
    }, // What Seller must pay back (Principal + Interest) => ₹51,200

    latePenaltyRate: { 
      type: Number, 
      default: 2 
    }, // Penalty % per day if late

    // 🚦 STATUS
   status: {
        type: String,
        enum: ["Pending", "Verified", "Rejected","Accepted", "Funded"], // 👈 Add "Funded" right here
        default: "Pending"
   },

  noaDocumentUrl: {
   type: String,
  default: null
   },

    expiryDate: { 
      type: Date,
      // Default: 7 Days from creation
      default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000) 
    },
    tenureDays: {
      type: Number,
      required: true
    },
  },
  { timestamps: true }
);

// Prevent same lender bidding twice on same invoice
bidSchema.index({ invoice: 1, lender: 1 }, { unique: true });

export default mongoose.model("Bid", bidSchema);