import mongoose from 'mongoose';
import Seller from './src/models/Seller.model.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/paynidhi";

async function check() {
    try {
        console.log("Connecting to:", MONGO_URL);
        await mongoose.connect(MONGO_URL);
        console.log("Connected.");
        const sellers = await Seller.find({});
        console.log(`Found ${sellers.length} sellers.`);
        for (const s of sellers) {
            const obj = s.toObject();
            const size = Buffer.byteLength(JSON.stringify(obj));
            console.log(`Seller ${s.email}: size = ${size} bytes`);
            if (size > 100000) {
                for (const key of Object.keys(obj)) {
                    const fieldSize = Buffer.byteLength(JSON.stringify(obj[key]));
                    if (fieldSize > 10000) {
                        console.log(` - Field ${key}: ${fieldSize} bytes`);
                    }
                }
            }
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

check();
