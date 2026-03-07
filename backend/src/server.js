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

app.use(helmet({ crossOriginResourcePolicy: false }));

// Fixed CORS to be compatible with Vercel Production
app.use(
  cors({
    origin: ["http://localhost:5173", "https://pay-nidhi.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/uploads", express.static(path.join(process.cwd(), "uploads")));

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