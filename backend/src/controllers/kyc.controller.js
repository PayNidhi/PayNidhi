import Seller from "../models/Seller.model.js";
import Lender from "../models/Lender.model.js";
import MockIdentityModel from "../models/MockIdentity.model.js"
import { hashField } from "../utils/encryption.utils.js";

// ==========================================
// 1. SELLER KYC
// ==========================================
export const kycVerification = async (req, res) => {
    try {
        console.log("Seller KYC verification started...");

        const { name, panNumber, aadhaarNumber, bankAccount } = req.body;
        const sellerId = req.user?._id; 

        if (!sellerId) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        
        // OPTIMIZATION 1: Run duplicate checks FIRST, and run them in parallel for speed
        const hashedPan = hashField(panNumber);
        
        const [existingSeller, existingAadhaarSeller] = await Promise.all([
            Seller.findOne({ panHash: hashedPan }),
            Seller.findOne({ aadhaarNumber: Number(aadhaarNumber) })
        ]);
        
        if (existingSeller && existingSeller._id.toString() !== sellerId.toString()) {
            return res.status(400).json({ message: "This PAN is already registered with another account." });
        }

        if (existingAadhaarSeller && existingAadhaarSeller._id.toString() !== sellerId.toString()) {
            return res.status(400).json({ message: "This Aadhaar is already registered with another account." });
        }

        // 2. Now check the official Mock Identity Database
        const identityRecord = await MockIdentityModel.findOne({ 
            panNo: panNumber,
            aadhaarNo: Number(aadhaarNumber)
        });

        if (!identityRecord) {
            return res.status(400).json({ message: "Invalid PAN or Aadhaar details. Verification failed." });
        }
        
        // OPTIMIZATION 2 (THE FIX): Verify the Name matches the official record
        // (Assuming your MockIdentityModel schema has a 'fullName' or 'name' property)
        const providedName = name.trim().toLowerCase();
        const officialName = identityRecord.name.trim().toLowerCase(); // Update 'name' if your schema uses 'fullName'

        if (providedName !== officialName) {
            console.log(`KYC Failed: Name mismatch. Expected: ${officialName}, Got: ${providedName}`);
            return res.status(400).json({ 
                message: "Identity Mismatch: The provided name does not match the official government records." 
            });
        }

        // 3. Finalize Onboarding
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            return res.status(404).json({ message: "Seller not found." });
        }

        seller.panNumber = panNumber; 
        seller.panHash = hashedPan;  
        seller.aadhaarNumber = aadhaarNumber; 
        
        if (bankAccount) {
            seller.bankAccount = [{
                accountNumber: bankAccount.accountNumber,
                ifscCode: bankAccount.ifscCode,
                beneficiaryName: name, // We now safely know this name is verified!
                bankName: bankAccount.bankName
            }];
        }

        seller.isOnboarded = true; 
        seller.kycStatus = "verified"; 
        await seller.save();
        console.log(
            "Seller KYC Verified"
        );

        return res.status(200).json({
            success: true,
            message: "KYC Verified successfully",
            isOnboarded: true,
            kycStatus: "verified" 
        });

    } catch (error) {
        console.error("Seller KYC Error:", error);
        
        // Catch MongoDB duplicate key errors gracefully
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyValue)[0];
            return res.status(400).json({ message: `This ${duplicateField} is already registered to another account.` });
        }
        
        res.status(500).json({ message: "Internal Server Error during KYC." });
    }
};

// ==========================================
// 2. LENDER KYC
// ==========================================
export const lenderKycVerification = async (req, res) => {
    try {
        console.log("Lender KYC verification started...");

        const { name, panNumber, aadhaarNumber, bankAccount } = req.body;
        const lenderId = req.user?._id; 

        if (!lenderId) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        
        const hashedPan = hashField(panNumber);

        // OPTIMIZATION 1: Run duplicate checks AND fetch the lender in parallel for maximum speed
        const [lender, existingLender, existingAadhaarLender] = await Promise.all([
            Lender.findById(lenderId),
            Lender.findOne({ panHash: hashedPan }),
            Lender.findOne({ aadhaarNumber: Number(aadhaarNumber) })
        ]);

        if (!lender) {
            console.log("Lender not found.");
            return res.status(404).json({ message: "Lender not found." });
        }

        if (lender.kycStatus === "verified") {
            console.log("KYC is already verified.");
            return res.status(400).json({ message: "KYC is already verified." });
        }

        if (existingLender && existingLender._id.toString() !== lenderId.toString()) {
            console.log("This PAN is already registered with another Lender account.");
            return res.status(400).json({ message: "This PAN is already registered with another Lender account." });
        }

        if (existingAadhaarLender && existingAadhaarLender._id.toString() !== lenderId.toString()) {
            console.log("This Aadhaar is already registered with another Lender account.");
            return res.status(400).json({ message: "This Aadhaar is already registered with another Lender account." });
        }

        // 2. Check Mock Identity DB (Only hits this if duplicate checks pass!)
        const identityRecord = await MockIdentityModel.findOne({ 
            panNo: panNumber,
            aadhaarNo: Number(aadhaarNumber)
        });

        if (!identityRecord) {
            console.log("Invalid PAN or Aadhaar details. Verification failed.");
            return res.status(400).json({ message: "Invalid PAN or Aadhaar details. Verification failed." });
        }
        
        // OPTIMIZATION 2: Name Verification (The Fraud Prevention Fix)
        const providedName = name.trim().toLowerCase();
        const officialName = identityRecord.name.trim().toLowerCase(); // Update 'name' to 'fullName' if your schema requires

        if (providedName !== officialName) {
            console.log(`KYC Failed: Name mismatch. Expected: ${officialName}, Got: ${providedName}`);
            return res.status(400).json({ 
                message: "Identity Mismatch: The provided name does not match official government records." 
            });
        }

        // 3. Update the Lender Profile
        lender.panNumber = panNumber; 
        lender.panHash = hashedPan;  
        lender.aadhaarNumber = aadhaarNumber; 
        
        if (bankAccount) {
            lender.bankAccount = [{
                accountNumber: bankAccount.accountNumber,
                ifscCode: bankAccount.ifscCode,
                beneficiaryName: name, // We now safely know this name is verified!
                bankName: bankAccount.bankName
            }];
        }

        lender.isOnboarded = true; 
        lender.kycStatus = "verified"; 
        
        // 🏦 TREASURY INIT
        // lender.totalCreditLimit = 1000000; 

        await lender.save(); // Pre-save hook handles encryption

        return res.status(200).json({
            success: true,
            message: "Lender KYC Verified successfully! Wallet is active.",
            isOnboarded: true,
            kycStatus: "verified" 
        });

    } catch (error) {
        console.error("Lender KYC Error:", error);
        
        // Catch MongoDB duplicate key errors gracefully
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyValue)[0];
            return res.status(400).json({ message: `This ${duplicateField} is already registered to another account.` });
        }

        res.status(500).json({ message: "Internal Server Error during Lender KYC." });
    }
};