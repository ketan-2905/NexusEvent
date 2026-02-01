import prisma from "../prismaClient.js";

export const getParticipantsByCheckpoint = async (req, res) => {
  const checkpoints = await prisma.checkpoint.findMany({
    include: {
      visits: {
        include: {
          participant: true,
        },
        orderBy: { lastScanTime: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  res.json(checkpoints);
};
