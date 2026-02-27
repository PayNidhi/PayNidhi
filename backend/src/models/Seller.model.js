import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  encryptField,
  decryptField,
  hashField,
} from "../utils/encryption.utils.js";

const bankAccountSchema = new mongoose.Schema({
  accountNumber: { type: String, required: true, sparse: true, unique: true },
  accountNumberHash: {
    type: String,
    required: false,
    sparse: true,
    unique: true,
  },
  ifscCode: { type: String, required: true, sparse: true, uppercase: true },
  beneficiaryName: { type: String, sparse: true, required: true },
  bankName: { type: String, sparse: true, required: true },
  // verified: { type: Boolean, default: false }
});

const sellerSchema = new mongoose.Schema(
  {
    // 1. CORE IDENTITY
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // 2. BUSINESS PROFILE (Registration fields)
    companyName: { type: String, required: true, trim: true },
    businessType: {
      type: String,
      enum: ["Trading", "Manufacturing", "Services"],
      default: "Services",
    },
    industry: {
      type: String,
      enum: ["Textiles", "IT", "Pharma", "Auto", "FMCG", "Retail", "Finance"],
      default: "IT",
    },
    annualTurnover: { type: Number, default: 0 },
    beneficiaryName: { type: String, trim: true }, // Registration field

    // 3. SENSITIVE KYC DATA (Encrypted + Blind Index)
    panNumber: { type: String, unique: true, sparse: true, required: false },
    gstNumber: {
      type: String,
      unique: true,
      sparse: true,
      required: true,
      index: true,
    },
    panHash: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      index: true,
    },
    gstHash: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      index: true,
    },
    aadhaarNumber: {
      type: Number,
      unique: true,
      sparse: true,
      required: false,
      index: true,
    },

    // 4. BANK DETAILS (Completed during KYC - partial at registration)
    bankAccount: {
      type: [bankAccountSchema],
    },

    // 5. SYSTEM & FINANCIALS
    isOnboarded: { type: Boolean, default: false }, // false until KYC complete
    kycStatus: {
      type: String,
      enum: ["pending", "partial", "verified", "rejected"],
      default: "partial", // partial after registration
    },
    trustScore: { type: Number, default: 300 },
    totalInvoicesFunded: { type: Number, default: 0 },
    totalInvoicesRepaid: { type: Number, default: 0 },
    defaultedInvoices: { type: Number, default: 0 },

    walletBalance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    // virtualAccount: {
    //   va_id: String,
    //   accountNumber: String,
    //   ifscCode: String,
    //   bankName: String
    // },

    // 6. PROFILE
    avatarUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

// HASH + ENCRYPT (Universal Hook)
sellerSchema.pre("save", async function () {
  const seller = this;

  // 1. Password
  if (seller.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    seller.password = await bcrypt.hash(seller.password, salt);
  }

  // 2. GST (Protect against recursive encryption)
  if (seller.isModified("gstNumber") && seller.gstNumber && !seller.gstNumber.includes(":")) {
    seller.gstHash = hashField(seller.gstNumber);
    seller.gstNumber = encryptField(seller.gstNumber);
  }

  // 3. PAN (Protect against recursive encryption)
  if (seller.isModified("panNumber") && seller.panNumber && !seller.panNumber.includes(":")) {
    seller.panHash = hashField(seller.panNumber);
    seller.panNumber = encryptField(seller.panNumber);
  }

  // 4. Bank Details (Protect against recursive encryption in array)
  if (seller.isModified("bankAccount")) {
    seller.bankAccount = seller.bankAccount.map(acc => {
      // accountNumber
      if (acc.accountNumber && !acc.accountNumber.includes(":")) {
        acc.accountNumberHash = hashField(acc.accountNumber);
        acc.accountNumber = encryptField(acc.accountNumber);
      }
      // ifscCode
      if (acc.ifscCode && !acc.ifscCode.includes(":")) {
        acc.ifscCode = encryptField(acc.ifscCode);
      }
      return acc;
    });
  }
});

// DECRYPT AFTER LOAD (Handles Arrays Correctly)
sellerSchema.post("init", function (doc) {
  if (doc.gstNumber && doc.gstNumber.includes(":")) {
    doc.gstNumber = decryptField(doc.gstNumber);
  }

  if (doc.panNumber && doc.panNumber.includes(":")) {
    doc.panNumber = decryptField(doc.panNumber);
  }

  if (Array.isArray(doc.bankAccount)) {
    doc.bankAccount = doc.bankAccount.map(acc => ({
      ...acc,
      accountNumber: (acc.accountNumber && acc.accountNumber.includes(":")) ? decryptField(acc.accountNumber) : acc.accountNumber,
      ifscCode: (acc.ifscCode && acc.ifscCode.includes(":")) ? decryptField(acc.ifscCode) : acc.ifscCode
    }));
  }
});

sellerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Seller", sellerSchema);