import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";
import dotenv from "dotenv";
import { ExpressError } from "../utils/expressError.js";
import redis from "../utils/redis.js";
import { sendVerificationEmail } from "../utils/email.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await prisma.accountUser.findUnique({ where: { email } });
  if (existingUser) {
    throw new ExpressError("User already exists", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.accountUser.create({
    data: {
      name,
      email,
      password: hashedPassword,
      isEmailVerified: false,
    },
  });

  const code = generateCode();
  await redis.set(`verify:${email}`, code, "EX", 600); // Expires in 10 mins
  await sendVerificationEmail(email, code);

  res.status(201).json({ message: "User registered. Please verify your email.", email });
};

export const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  const cachedCode = await redis.get(`verify:${email}`);
  if (!cachedCode || cachedCode !== code) {
    throw new ExpressError("Invalid or expired verification code", 400);
  }

  const user = await prisma.accountUser.update({
    where: { email },
    data: { isEmailVerified: true },
  });

  await redis.del(`verify:${email}`);

  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ message: "Email verified successfully", token, user });
};

export const resendCode = async (req, res) => {
  const { email } = req.body;

  const user = await prisma.accountUser.findUnique({ where: { email } });
  if (!user) {
    throw new ExpressError("User not found", 404);
  }

  if (user.isEmailVerified) {
    throw new ExpressError("Email already verified", 400);
  }

  const code = generateCode();
  await redis.set(`verify:${email}`, code, "EX", 600);
  await sendVerificationEmail(email, code);

  res.json({ message: "Verification code resent." });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.accountUser.findUnique({ where: { email } });

  if (!user) {
    throw new ExpressError("Invalid credentials", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ExpressError("Invalid credentials", 401);
  }

  if (!user.isEmailVerified) {
    // Send a new code if they try to login but aren't verified? 
    // Or just tell them to verify. 
    // User logic: "If the email isn't a verified then you should be redirecting to the is verified page"
    // We'll return a specific code so frontend knows to redirect.
    return res.status(403).json({
      message: "Email not verified",
      errorCode: "EMAIL_NOT_VERIFIED",
      email: user.email
    });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, user: { id: user.id, name: user.name, email: user.email, type: "admin" } });
};

export const staffLogin = async (req, res) => {
  const { email, password } = req.body;

  const staff = await prisma.eventStaff.findFirst({
    where: { email }, // Emails are unique per event, but might be duplicated across events? Schema says @@unique([eventId, email]), so same email can be in multiple events. Login ambiguity!
    // Wait, the user usually logs in with email/pass. If email is reused across events, which one?
    // User might need to provide Event Code or just password?
    // Schema: @@unique([eventId, email]). So email ALONE is not unique globally. 
    // However, usually staff emails are unique or they use a username.
    // Let's assume for now the user provides email/password. VALIDATION: Check if multiple accounts exist.
  });

  // Actually, finding ALL staff with this email.
  const staffMembers = await prisma.eventStaff.findMany({ where: { email } });

  if (staffMembers.length === 0) {
    throw new ExpressError("Invalid credentials", 401);
  }

  // Iterate to find matching password
  let validStaff = null;
  for (const s of staffMembers) {
    const isMatch = await bcrypt.compare(password, s.password);
    if (isMatch) {
      validStaff = s;
      break;
    }
  }

  if (!validStaff) {
    throw new ExpressError("Invalid credentials", 401);
  }

  if (!validStaff.isActive) {
    throw new ExpressError("Account is inactive", 403);
  }

  const token = jwt.sign(
    { id: validStaff.id, email: validStaff.email, eventId: validStaff.eventId, role: validStaff.role, type: "staff" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      id: validStaff.id,
      name: validStaff.name,
      email: validStaff.email,
      eventId: validStaff.eventId,
      role: validStaff.role,
      type: "staff"
    }
  });
};

export const getMe = async (req, res) => {
  if (req.user.type === "staff") {
    const staff = await prisma.eventStaff.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, eventId: true, isActive: true }
    });
    if (!staff) throw new ExpressError("User not found", 404);
    return res.json({ ...staff, type: "staff" });
  }

  // req.user contains { id, email } from token
  const user = await prisma.accountUser.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, isEmailVerified: true }
  });

  if (!user) {
    throw new ExpressError("User not found", 404);
  }

  res.json({ ...user, type: "admin" });
};

export const updateProfile = async (req, res) => {
  const { emailUser, emailPass } = req.body;

  // Basic validation
  // Could add encryption here if needed in future

  const user = await prisma.accountUser.update({
    where: { id: req.user.id },
    data: {
      emailUser: emailUser || null,
      emailPass: emailPass || null
    },
    select: { id: true, name: true, email: true, emailUser: true, isEmailVerified: true } // Don't return pass
  });

  res.json({ message: "Profile updated", user });
};


