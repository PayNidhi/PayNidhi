import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    // 🔗 ENTITIES INVOLVED
    invoice: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Invoice',
      required: false // Optional: Top-ups/Withdrawals don't need an invoice
    },
    lender: { type: mongoose.Schema.Types.ObjectId, ref: 'Lender' },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },

    // 💰 MONEY DETAILS
    amount: { 
      type: Number, 
      required: true 
    },
    fee: {
      type: Number,
      required: true,
      default: 0
    },

    transactionDate: {
      type: Date,
      default: Date.now,
      required: true
    },

    // 🏦 MATURE TRANSACTION TYPES (Uncommented and Cleaned!)
    type: { 
      type: String, 
      enum: [
    "DEPOSIT", 
    "WITHDRAWAL", 
    "FUNDED", 
    // 👇 Add these three new settlement types 👇
    "REPAYMENT_IN", 
    "REMAINING_BALANCE_IN", 
    "PLATFORM_FEE",
    "DISBURSEMENT"   // Money returns to Lender (Principal + Interest)
      ], 
      required: true 
    },

    // 🚦 STATE
    status: { 
      type: String, 
      enum: ['PENDING', 'SUCCESS', 'FAILED'], 
      default: 'PENDING' 
    },
    
    // 🧾 BANK RECONCILIATION & GATEWAY DATA
    referenceId: { type: String, required: true, unique: true }, // e.g., "TXN-123456"
    
    razorpay_payment_id: { type: String }, 
    razorpay_va_id: { type: String },      
    utr_number: { type: String },          

    description: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);