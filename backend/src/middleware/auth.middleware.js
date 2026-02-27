// backend/src/middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import Seller from "../models/Seller.model.js";
import Lender from "../models/Lender.model.js";
import Admin from "../models/Admin.model.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("------------------------------------------------");
    console.log("1. Decoded Token:", decoded);

    if (decoded.role === "seller") {
      console.log("2. Searching in SELLER collection...");
      req.user = await Seller.findById(decoded.id).select("-password");
    } else if (decoded.role === "lender") {
      console.log("2. Searching in LENDER collection...");
      req.user = await Lender.findById(decoded.id).select("-password");
    } else if (decoded.role === "superadmin" || decoded.role === "admin") {
      console.log("2. Searching in ADMIN collection...");
      req.user = await Admin.findById(decoded.id).select("-password"); // 👈 FIX: Assigned to req.user
    } else {
      console.log("❌ Error: Token has no valid role:", decoded.role);
    }

    if (!req.user) {
      console.log("❌ User NOT found in DB. ID was:", decoded.id);
      return res.status(401).json({ error: "Not authorized, user not found" });
    }
   
    //Checking whether user is active or not
    if (req.user.isActive === false) {
      return res.status(403).json({ error: "Account Suspended: Your access has been revoked by an Administrator." });
    }
    // 👈 FIX: Explicitly attach the exact token role to the request
    // This makes the authorize middleware 100% accurate
    req.user.role = decoded.role;

    console.log("✅ User Found:", req.user.email);
    console.log("------------------------------------------------");

    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ error: "Not authorized, token failed" });
  }
};

// 👮 AUTHORIZE: Checks if user has the correct Role
// 👮 AUTHORIZE: Checks if user has the correct Role
export const authorize = (...roles) => {
  return (req, res, next) => {
    // 1. Primary: Use the exact role decoded from the secure JWT token (The new, safe way)
    // 2. Fallback: Use the database fields (Your old way, just in case)
    const userRole = req.user.role || (req.user.businessType ? "seller" : "lender");

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: `Access Denied: User role '${userRole}' is not authorized to access this route`,
      });
    }
    next();
  };
};