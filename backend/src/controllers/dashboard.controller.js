import prisma from "../prismaClient.js";

export const getDashboardStats = async (req, res) => {
  const totalParticipants = await prisma.participant.count();

  const insideVisits = await prisma.visit.findMany({
    where: { lastStatus: "INSIDE" },
    select: { participantId: true, checkpointId: true },
  });

  const checkedIn = new Set(insideVisits.map((v) => v.participantId)).size;
  const exited = totalParticipants - checkedIn;

  const liveByCheckpoint = await prisma.visit.groupBy({
    by: ["checkpointId"],
    where: { lastStatus: "INSIDE" },
    _count: { checkpointId: true },
  });

  const checkpointData = await Promise.all(
    liveByCheckpoint.map(async (c) => {
      const checkpoint = await prisma.checkpoint.findUnique({
        where: { id: c.checkpointId },
      });
      return { name: checkpoint.name, count: c._count.checkpointId };
    })
  );

  res.json({
    totalParticipants,
    checkedIn,
    exited,
    checkpointData,
  });
};

