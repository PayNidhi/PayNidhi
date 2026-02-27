import mongoose from "mongoose";

const financeSchema = new mongoose.Schema({
    invoice: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'Invoice',
          // Made optional because a generic wallet top-up might not link to an invoice immediately
          required: false 
        },
        bid: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Bid'
        },
        lender: { type: mongoose.Schema.Types.ObjectId, ref: 'Lender' },
        seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
    
        // 💰 MONEY DETAILS
        amount: { 
          type: Number, 
          required: true 
        },
        currency: { 
          type: String, 
          default: "INR",
          required: true
        },
        fee: {
          type: Number,
          required: true,
          default: 0
        },
    
        transactionDate: {
          type: Date,
          required: true
        },

        dueDate: {
            type: Date,
            required: true
        },

        isSettled: {
            type: Boolean,
            required: true,
            default: false
        }

        // status: { 
        //     type: String, 
        //     enum: ['PENDING', 'SUCCESS', 'FAILED'], 
        //     default: 'PENDING' 
        // },




}, {
    timestamps: true
});

export default mongoose.model("Finance", financeSchema);