import prisma from "../prismaClient.js";
import { getSocketIO } from "../utils/socket.js";

// Create Checkpoint
export const createCheckpoint = async (req, res) => {
  const { eventId } = req.params; // Expecting /:eventId/checkpoints
  const { name, type, isFoodCheckpoint } = req.body;

  // Validate user ownership of event
  const event = await prisma.event.findUnique({
      where: { id: eventId }
  });
  if (!event || event.ownerId !== req.user.id) {
     throw new ExpressError("Unauthorized", 403);
  }

  const checkpoint = await prisma.checkpoint.create({
    data: { 
        eventId,
        name, 
        type,
        isFoodCheckpoint: !!isFoodCheckpoint 
    },
  });
  
  const io = getSocketIO();
  io.emit(`event:${eventId}:checkpoint:created`, checkpoint);
  res.json(checkpoint);
};

// Get All Checkpoints for Event
export const getAllCheckpoints = async (req, res) => {
  const { eventId } = req.params;
  const checkpoints = await prisma.checkpoint.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    include: {
        _count: {
            select: { visits: true }
        }
    }
  });
  res.json(checkpoints);
};

// Update Checkpoint
export const updateCheckpoint = async (req, res) => {
  const { id } = req.params; // Checkpoint ID
  const { name, type, isFoodCheckpoint } = req.body;

  const existing = await prisma.checkpoint.findUnique({ where: { id }, include: { event: true } });
  if(!existing) throw new ExpressError("Checkpoint not found", 404);
  if(existing.event.ownerId !== req.user.id) throw new ExpressError("Unauthorized", 403);

  // Prevent renaming Registration Desk if needed, but allowing is fine if carefully managed.
  // User said "it cannot be deleted".

  const updated = await prisma.checkpoint.update({
    where: { id },
    data: { name, type, isFoodCheckpoint: !!isFoodCheckpoint },
  });
  
  const io = getSocketIO();
  io.emit(`event:${existing.eventId}:checkpoint:updated`, updated);
  
  res.json(updated);
};

// Delete Checkpoint
export const deleteCheckpoint = async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.checkpoint.findUnique({ where: { id }, include: { event: true } });
  if(!existing) throw new ExpressError("Checkpoint not found", 404);
  if(existing.event.ownerId !== req.user.id) throw new ExpressError("Unauthorized", 403);

  if (existing.name === "Registration Desk") {
      throw new ExpressError("Cannot delete the Registration Desk.", 400);
  }

  await prisma.checkpoint.delete({ where: { id } });
  
  const io = getSocketIO();
  io.emit(`event:${existing.eventId}:checkpoint:deleted`, { id });
  
  res.json({ message: "Checkpoint deleted successfully" });
};

// Send Emails to Participants in Checkpoint
import { createTransporter } from "../utils/emailService.js";

export const sendCheckpointEmails = async (req, res) => {
    const { id } = req.params; // Checkpoint ID
    const { subject, message, statusFilter } = req.body; // statusFilter: 'NOT_VISITED', 'INSIDE', 'EXITED' or null for all

    const checkpoint = await prisma.checkpoint.findUnique({ 
        where: { id }, 
        include: { event: { include: { owner: true } } } 
    });
    if(!checkpoint) throw new ExpressError("Checkpoint not found", 404);
    if(checkpoint.event.ownerId !== req.user.id) throw new ExpressError("Unauthorized", 403);

    // Fetch visits/participants
    const whereClause = { checkpointId: id };
    if (statusFilter) {
        whereClause.lastStatus = statusFilter;
    }

    const visits = await prisma.visit.findMany({
        where: whereClause,
        include: { participant: true }
    });

    if (visits.length === 0) return res.json({ message: "No participants found for criteria", count: 0 });

    // Send in background (fire & forget response)
    const transporter = await createTransporter(checkpoint.event.ownerId).catch(() => createTransporter(null));

    // Async processing without awaiting
    (async () => {
        for (const visit of visits) {
            try {
                const p = visit.participant;
                await transporter.sendMail({
                    from: checkpoint.event.owner.email,
                    to: p.email,
                    subject: subject || `Update regarding ${checkpoint.name}`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px;">
                            <h2>Hello ${p.name},</h2>
                            <p>${message.replace(/\n/g, "<br/>")}</p>
                            <p>Event: ${checkpoint.event.name}</p>
                        </div>
                    `
                });
            } catch (err) {
                console.error(`Failed to send checkpoint email to ${visit.participant.email}`, err);
            }
        }
    })();

    res.json({ message: "Email sending started", count: visits.length });
};

