import prisma from "../prismaClient.js";

export const validateExit = async (req, res) => {
    const { id } = req.params;

  const checkpoint = await prisma.checkpoint.findUnique({
    where: { id: id },
  });
  if (!checkpoint) throw new ExpressError("Checkpoint not found", 404);

  const participants = await prisma.visit.findMany({
    where: { checkpointId: checkpoint.id },
  });

  if (!participants) throw new ExpressError("Participants not found", 404);
  const participantIds = participants.map((p) => p.participantId);

  await prisma.visit.updateMany({
    where: {
      participantId: { in: participantIds },
      checkpointId:checkpoint.id,
    },
    data: {
      lastStatus: "EXITED",
    },
  });
};
