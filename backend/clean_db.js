import mongoose from 'mongoose';
import Seller from './src/models/Seller.model.js';
import { decryptField, encryptField } from './src/utils/encryption.utils.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

async function clean() {
    await mongoose.connect(MONGO_URL);
    const sellers = await Seller.find({});
    for (const s of sellers) {
        let currentPan = s.panNumber;
        let iterations = 0;
        // Deep decrypt if it was multi-encrypted
        while (currentPan && currentPan.includes(":") && iterations < 10) {
            let decrypted = decryptField(currentPan);
            if (decrypted === currentPan) break; // Couldn't decrypt further or not encrypted
            currentPan = decrypted;
            iterations++;
        }

        if (iterations > 1) {
            console.log(`Seller ${s.email} had ${iterations} layers of encryption on PAN. Cleaning...`);
            // We bypass the hooks to force a clean save
            await Seller.updateOne({ _id: s._id }, { $set: { panNumber: encryptField(currentPan) } });
            console.log("Cleaned.");
        }
    }
    process.exit(0);
}

clean();
