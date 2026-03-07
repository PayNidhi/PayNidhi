import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet"; 
import { startCronJobs } from "./utils/settlementEngine.js";
import connectDB from "./lib/db.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import lenderRoutes from "./routes/lender.routes.js";
import sellerRoutes from "./routes/seller.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import sellerDashboardRoutes from "./routes/sellerDashboard.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🛡️ Security Headers
app.use(helmet({ crossOriginResourcePolicy: false }));

// 🌐 Bulletproof CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://pay-nidhi.vercel.app" // Hardcoded safety net
];

// Add environment variable safely if it exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // !origin allows server-to-server requests (like Postman or mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`❌ CORS blocked request from origin: ${origin}`);
        callback(new Error("CORS policy blocked this request"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());
app.use(cookieParser());

// Serve uploaded files
app.use("/api/uploads", express.static(path.join(process.cwd(), "uploads")));

// API routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/lender", lenderRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api", sellerDashboardRoutes);

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    startCronJobs();
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();