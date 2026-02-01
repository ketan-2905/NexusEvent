import prisma from "../prismaClient.js";
import bcrypt from "bcrypt";
import { ExpressError } from "../utils/expressError.js";
import { sendVerificationEmail, sendCredentialsEmail } from "../utils/email.js"; // Reuse or create new email template
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Email sender function specifically for staff credentials
// const sendStaffCredentials = async (email, password, eventName) => {
// ... removed inline definition logic in favor of imported util
// };

export const addStaff = async (req, res) => {
  const { eventId } = req.params;
  const { name, email, role } = req.body; // role: ADMIN or SHOWADMIN
  const ownerId = req.user.id;

  // Verify event ownership
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.ownerId !== ownerId) {
    throw new ExpressError("Event not found or unauthorized", 404);
  }

  // Check if staff already exists for this event
  const existingStaff = await prisma.eventStaff.findUnique({
    where: { eventId_email: { eventId, email } },
  });

  if (existingStaff) {
    throw new ExpressError("Staff already assigned to this event", 400);
  }

  // Generate random password
  const rawPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const staff = await prisma.eventStaff.create({
    data: {
      eventId,
      name,
      email,
      password: hashedPassword,
      role,
    },
  });

  // Send email with credentials
  await sendCredentialsEmail(email, rawPassword, event.name);

  res.status(201).json({ message: "Staff added", staff, rawPassword }); // returning rawPassword for dev convenience, but should be via email in prod
};

export const getEventStaff = async (req, res) => {
  const { eventId } = req.params;
  const ownerId = req.user.id;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.ownerId !== ownerId) {
    throw new ExpressError("Event not found or unauthorized", 404);
  }

  const staff = await prisma.eventStaff.findMany({
    where: { eventId }
  });
  res.json(staff);
};

// Staff Login used by Scanner App
export const staffLogin = async (req, res) => {
  const { email, password } = req.body;

  // Find all staff entries with this email (email + eventId is unique, but login is just email)
  // We iterate to find the matching password.
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

// Get Current Staff Info
export const getStaffMe = async (req, res) => {
  // req.user is set by verifyToken middleware if token is valid
  if (!req.user || req.user.type !== "staff") {
    return res.status(401).json({ error: "Access Denied or Invalid Staff Token" });
  }

  const staff = await prisma.eventStaff.findUnique({
    where: { id: req.user.id },
    include: { event: { select: { name: true } } }
  });

  if (!staff) throw new ExpressError("Staff account not found", 404);
  if (!staff.isActive) throw new ExpressError("Account is inactive", 403);

  res.json({
    id: staff.id,
    name: staff.name,
    email: staff.email,
    eventId: staff.eventId,
    role: staff.role,
    eventName: staff.event.name,
    eventName: staff.event.name,
    type: "staff"
  });
};

export const getStaffEvent = async (req, res) => {
  // Check if staff
  if (req.user.type !== "staff") {
    return res.status(403).json({ error: "Access Denied" });
  }
  const { eventId } = req.params;

  // Ensure staff is accessing THEIR assigned event
  if (req.user.eventId !== eventId) {
    return res.status(403).json({ error: "Unauthorized access to this event" });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event) throw new ExpressError("Event not found", 404);

  res.json(event);
};


export const getStaffCheckpoints = async (req, res) => {
  // Check if staff
  if (req.user.type !== "staff") {
    return res.status(403).json({ error: "Access Denied" });
  }

  // For staff, we usually rely on their token's eventId, but if route is /staff/events/:eventId/checkpoints
  // we should validate content.
  const { eventId } = req.params;

  if (req.user.eventId !== eventId) {
    return res.status(403).json({ error: "Unauthorized access to this event" });
  }

  const checkpoints = await prisma.checkpoint.findMany({
    where: { eventId }
  });

  res.json(checkpoints);
};

// Validate QR without committing
export const validateQR = async (req, res) => {
  const { token, checkpointId } = req.body;

  // 1. Participant Check
  const participant = await prisma.participant.findUnique({ where: { token } });
  if (!participant) throw new ExpressError("Participant not found", 404);

  // 2. Checkpoint Details
  const checkpoint = await prisma.checkpoint.findUnique({ where: { id: checkpointId } });
  if (!checkpoint) throw new ExpressError("Checkpoint not found", 404);

  // 3. Staff Auth check
  // (Ideally we check staff.eventId === checkpoint.eventId, but verifyToken + usage already implies some trust, 
  // but explicit check is better).
  if (req.user.type === "staff" && req.user.eventId !== checkpoint.eventId) {
    throw new ExpressError("Unauthorized checkpoint", 403);
  }

  // 4. Determine Current Status
  const visit = await prisma.visit.findFirst({
    where: { participantId: participant.id, checkpointId },
  });

  // Logic for next action:
  // If no visit record -> Never visited -> Next Action: ENTRY
  // If lastStatus == 'INSIDE' -> Next Action: EXIT
  // If lastStatus == 'EXITED' or 'NOT_VISITED' -> Next Action: ENTRY

  let currentStatus = visit ? visit.lastStatus : "NOT_VISITED";
  let nextAction = "entry"; // Default
  let canEnter = true;
  let message = "Ready for Entry";

  if (currentStatus === "INSIDE") {
    nextAction = "exit";
    message = "Ready for Exit";
  } else if (checkpoint.type === "SINGLE" && (currentStatus === "EXITED" || (visit && visit.visitCount > 0))) {
    // Single visit logic
    nextAction = "none";
    canEnter = false;
    message = "Already Visited (Single Access Only)";
  }

  res.json({
    participant: {
      name: participant.name,
      email: participant.email,
      token: participant.token,
      // Add other fields if schema has them (photo, etc.)
    },
    currentStatus,
    nextAction,
    canEnter,
    message
  });
};
