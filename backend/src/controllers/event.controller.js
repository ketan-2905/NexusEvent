import prisma from "../prismaClient.js";
import { ExpressError } from "../utils/expressError.js";

// Create Event
export const createEvent = async (req, res) => {
  const { name, status } = req.body;
  const ownerId = req.user.id; // From auth middleware

  if (!name) {
    throw new ExpressError("Missing required fields", 400);
  }

  const event = await prisma.event.create({
    data: {
      name,
      status: status || "DRAFT",
      ownerId,
    },
  });

  res.status(201).json(event);
};

// Get All Events for Owner
export const getMyEvents = async (req, res) => {
  const ownerId = req.user.id;
  const events = await prisma.event.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { participants: true, staff: true }
      }
    }
  });
  res.json(events);
};

// Get Single Event
export const getEventById = async (req, res) => {
  const { id } = req.params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      staff: true,
      checkpoints: true,
      activeTemplate: true
    }
  });
  if (!event) throw new ExpressError("Event not found", 404);
  // Check authorization (Owner OR Admin Staff)
  if (req.user.type === "staff") {
    if (req.user.eventId !== id || req.user.role !== "ADMIN") {
      throw new ExpressError("Unauthorized: Staff access restricted", 403);
    }
  } else if (event.ownerId !== req.user.id) {
    throw new ExpressError("Unauthorized", 403);
  }
  res.json(event);
};

// Update Event
export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { name, status, activeTemplateId } = req.body;

  // Check ownership
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) throw new ExpressError("Event not found", 404);
  if (existing.ownerId !== req.user.id) throw new ExpressError("Unauthorized", 403);

  const event = await prisma.event.update({
    where: { id },
    data: {
      name,
      status,
      activeTemplateId
    }
  });

  res.json(event);
};
