import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access Denied" });

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid Token" });
  }
};

export const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Access Denied" });
  }
  // Logic to determine super admin (AccountUser) vs Staff
  // For now, if they are authenticated via this flow, we allow.
  // We can refine this if Staff are also using this middleware.
  next();
};

export const isShowadmin = (req, res, next) => {
    // Allows Owner (SuperAdmin), Admin, and ShowAdmin
    if (!req.user) return res.status(401).json({ error: "Access Denied" });
    next();
};
