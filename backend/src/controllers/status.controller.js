import prisma from "../prismaClient.js";
import { ExpressError } from "../utils/expressError.js";

export const getParticipantStatus = async (req, res) => {
  const { token, checkpointId } = req.params;

  const participant = await prisma.participant.findUnique({ where: { token } });
  if (!participant) {
    throw new ExpressError("Participant not found", 404);
  }

  const visit = await prisma.visit.findFirst({
    where: { participantId: participant.id, checkpointId },
  });

  if (!visit) {
    return res.json({ status: "NOT_VISITED" });
  }

  res.json({ status: visit.lastStatus });
};

export const getLiveStatus = async (req, res) => {
  const checkpoints = await prisma.checkpoint.findMany({
    include: {
      visits: {
        where: { lastStatus: "INSIDE" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const formatted = checkpoints.map((cp) => ({
    id: cp.id,
    name: cp.name,
    count: cp.visits.length,
  }));

  res.json(formatted);
};

