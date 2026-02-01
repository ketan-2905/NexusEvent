import prisma from "../prismaClient.js";
import { getSocketIO } from "../utils/socket.js";
import { ExpressError } from "../utils/expressError.js";

// export const scanQR = async (req, res) => {
//   const { token, checkpointId, action } = req.body;

//   const participant = await prisma.participant.findUnique({ where: { token } });
//   if (!participant) {
//     throw new ExpressError("Participant not found", 404);
//   }

//   // new code to retrieve checkpoint
//   const checkpoint = await prisma.checkpoint.findUnique({
//     where: { id: checkpointId },
//   });
//   if (!checkpoint) throw new ExpressError("Checkpoint not found", 404);

//   let visit = await prisma.visit.findFirst({
//     where: { participantId: participant.id, checkpointId },
//   });

//   if (!visit) {
//     visit = await prisma.visit.create({
//       data: {
//         participantId: participant.id,
//         checkpointId,
//         lastStatus: "NOT_VISITED",
//       },
//     });
//   }

//   // new code to handle SINGLE type checkpoint
//   if (
//     checkpoint.type === "SINGLE" &&
//     visit.visitCount > 0 && // already visited once
//     action === "entry"
//   ) {
//     throw new ExpressError(
//       "Re-entry not allowed for single-visit checkpoint",
//       400
//     );
//   }

//   let updatedVisit;
//   if (action === "entry") {
//     updatedVisit = await prisma.visit.update({
//       where: { id: visit.id },
//       data: {
//         lastStatus: "INSIDE",
//         visitCount: { increment: 1 },
//         lastScanTime: new Date(),
//       },
//     });
//   } else if (action === "exit") {
//     updatedVisit = await prisma.visit.update({
//       where: { id: visit.id },
//       data: {
//         lastStatus: "EXITED",
//         lastScanTime: new Date(),
//       },
//     });
//   } else {
//     throw new ExpressError("Invalid action", 400);
//   }

//   const activeCount = await prisma.visit.count({
//     where: { checkpointId, lastStatus: "INSIDE" },
//   });

//   // Get live status for all checkpoints to emit
//   const checkpoints = await prisma.checkpoint.findMany({
//     include: {
//       visits: {
//         where: { lastStatus: "INSIDE" },
//       },
//     },
//     orderBy: { createdAt: "asc" },
//   });

//   const formattedLiveStatus = checkpoints.map((cp) => ({
//     id: cp.id,
//     name: cp.name,
//     count: cp.visits.length,
//   }));

//   // Get dashboard stats to emit
//   const totalParticipants = await prisma.participant.count();
//   const insideVisits = await prisma.visit.findMany({
//     where: { lastStatus: "INSIDE" },
//     select: { participantId: true, checkpointId: true },
//   });
//   const checkedIn = new Set(insideVisits.map((v) => v.participantId)).size;
//   const exited = totalParticipants - checkedIn;

//   const liveByCheckpoint = await prisma.visit.groupBy({
//     by: ["checkpointId"],
//     where: { lastStatus: "INSIDE" },
//     _count: { checkpointId: true },
//   });

//   const checkpointData = await Promise.all(
//     liveByCheckpoint.map(async (c) => {
//       const checkpoint = await prisma.checkpoint.findUnique({
//         where: { id: c.checkpointId },
//       });
//       return { name: checkpoint.name, count: c._count.checkpointId };
//     })
//   );

//    const recent = await prisma.visit.findMany({
//       where: { lastScanTime: { not: null } },
//       orderBy: { lastScanTime: "desc" },
//       include: { participant: true, checkpoint: true },
//     });

//     const data = recent.map((r) => ({
//       id: r.id,
//       participantName: r.participant?.name || "Unknown",
//       checkpointName: r.checkpoint?.name || "Unknown",
//       status: r.lastStatus,
//       time: r.lastScanTime ? new Date(r.lastScanTime).toISOString() : null,
//     }));

//   const io = getSocketIO();

//   if (checkpoint.name === "Registration Desk") {
//     const io = getSocketIO();

//     try {
//       // 1️⃣ Total participants registered
//       const totalParticipants = await prisma.participant.count();

//       // 2️⃣ Find Registration Desk checkpoint ID
//       const registrationDesk = await prisma.checkpoint.findFirst({
//         where: { name: "Registration Desk" },
//       });

//       if (!registrationDesk) {
//         console.error("Registration Desk checkpoint not found.");
//         return;
//       }

//       // 3️⃣ Fetch visits only for Registration Desk
//       const visits = await prisma.visit.findMany({
//         where: { checkpointId: registrationDesk.id },
//         select: { participantId: true, lastStatus: true },
//       });

//       // 4️⃣ Count IN and OUT
//       const checkedIn = visits.filter((v) => v.lastStatus === "INSIDE").length;
//       const exited = visits.filter((v) => v.lastStatus === "EXITED").length;

//       // 5️⃣ Total checkpoints for active count
//       const totalCheckpoints = await prisma.checkpoint.count();

//       const stats = {
//         totalRegistered: totalParticipants,
//         checkedIn,
//         exited,
//         activeCheckpoints: totalCheckpoints,
//       };

//       io.emit("dashboard-stats:updated", stats);
//       console.log("Dashboard stats (Registration Desk only) emitted:", stats);
//     } catch (err) {
//       console.error("Error updating Registration Desk dashboard stats:", err);
//     }
//   }

//   // Emit socket events for scan
//   io.emit("scan:updated", {
//     participant,
//     visit: updatedVisit,
//     checkpointId,
//     action,
//     activeCount,
//     checkpointName: checkpoint.name,
//   });

//   // Emit live status update
//   io.emit("live-status:updated", formattedLiveStatus);
//   io.emit("live-count:updated", data);

//   // Emit dashboard stats update
//   // io.emit("dashboard-stats:updated", {
//   //   totalParticipants,
//   //   checkedIn,
//   //   exited,
//   //   checkpointData,
//   // });

//   res.json({
//     participant,
//     visit: updatedVisit,
//     activeCount,
//     message: action === "entry" ? "Entry validated" : "Exit validated",
//   });
// };

// export const scanQR = async (req, res) => {
//   const { token, checkpointId, action } = req.body;
//   const io = getSocketIO();

//   const participant = await prisma.participant.findUnique({ where: { token } });
//   if (!participant) throw new ExpressError("Participant not found", 404);

//   const checkpoint = await prisma.checkpoint.findUnique({
//     where: { id: checkpointId },
//   });
//   if (!checkpoint) throw new ExpressError("Checkpoint not found", 404);

//   let visit = await prisma.visit.findFirst({
//     where: { participantId: participant.id, checkpointId },
//   });

//   if (!visit) {
//     visit = await prisma.visit.create({
//       data: {
//         participantId: participant.id,
//         checkpointId,
//         lastStatus: "NOT_VISITED",
//       },
//     });
//   }

//   if (
//     checkpoint.type === "SINGLE" &&
//     visit.visitCount > 0 &&
//     action === "entry"
//   ) {
//     throw new ExpressError(
//       "Re-entry not allowed for single-visit checkpoint",
//       400
//     );
//   }

//   // Update visit record
//   const updatedVisit = await prisma.visit.update({
//     where: { id: visit.id },
//     data: {
//       lastStatus: action === "entry" ? "INSIDE" : "EXITED",
//       visitCount: action === "entry" ? { increment: 1 } : undefined,
//       lastScanTime: new Date(),
//     },
//   });

//   const activeCount = await prisma.visit.count({
//     where: { checkpointId, lastStatus: "INSIDE" },
//   });

//   // ✅ Respond immediately
//   res.json({
//     participant,
//     visit: updatedVisit,
//     activeCount,
//     message: action === "entry" ? "Entry validated" : "Exit validated",
//   });

//   console.log("Hi there");

//   // ⚙️ Trigger async live updates (don’t await them)
//   updateLiveStats({ checkpoint, action, io }).catch(console.error);
// };

// async function updateLiveStats({ checkpoint, action, io }) {
//   try {
//     // Lightweight counts
//     const activeCount = await prisma.visit.count({
//       where: { checkpointId: checkpoint.id, lastStatus: "INSIDE" },
//     });

//     io.emit("scan:updated", {
//       checkpointId: checkpoint.id,
//       checkpointName: checkpoint.name,
//       action,
//       activeCount,
//     });

//     // Batch queries in parallel
//     const [
//       checkpoints,
//       totalParticipants,
//       insideVisits,
//       liveByCheckpoint,
//       recent,
//     ] = await Promise.all([
//       prisma.checkpoint.findMany({
//         include: { visits: { where: { lastStatus: "INSIDE" } } },
//         orderBy: { createdAt: "asc" },
//       }),
//       prisma.participant.count(),
//       prisma.visit.findMany({
//         where: { lastStatus: "INSIDE" },
//         select: { participantId: true, checkpointId: true },
//       }),
//       prisma.visit.groupBy({
//         by: ["checkpointId"],
//         where: { lastStatus: "INSIDE" },
//         _count: { checkpointId: true },
//       }),
//       prisma.visit.findMany({
//         where: { lastScanTime: { not: null } },
//         orderBy: { lastScanTime: "desc" },
//         include: { participant: true, checkpoint: true },
//         take: 20, // limit to latest 20
//       }),
//     ]);

//     // Format
//     const formattedLiveStatus = checkpoints.map((cp) => ({
//       id: cp.id,
//       name: cp.name,
//       count: cp.visits.length,
//     }));

//     const checkedIn = new Set(insideVisits.map((v) => v.participantId)).size;
//     const exited = totalParticipants - checkedIn;

//     const checkpointData = await Promise.all(
//       liveByCheckpoint.map(async (c) => {
//         const cp = await prisma.checkpoint.findUnique({
//           where: { id: c.checkpointId },
//         });
//         return { name: cp.name, count: c._count.checkpointId };
//       })
//     );

//     const data = recent.map((r) => ({
//       id: r.id,
//       participantName: r.participant?.name || "Unknown",
//       checkpointName: r.checkpoint?.name || "Unknown",
//       status: r.lastStatus,
//       time: r.lastScanTime ? new Date(r.lastScanTime).toISOString() : null,
//     }));

//     // Emit live stats
//     io.emit("live-status:updated", formattedLiveStatus);
//     io.emit("live-count:updated", data);

//     // Registration Desk special handling
//     if (checkpoint.name === "Registration Desk") {
//       const registrationDesk = await prisma.checkpoint.findFirst({
//         where: { name: "Registration Desk" },
//       });

//       const visits = await prisma.visit.findMany({
//         where: { checkpointId: registrationDesk.id },
//         select: { lastStatus: true },
//       });

//       const checkedIn = visits.filter((v) => v.lastStatus === "INSIDE").length;
//       const exited = visits.filter((v) => v.lastStatus === "EXITED").length;

//       io.emit("dashboard-stats:updated", {
//         totalRegistered: totalParticipants,
//         checkedIn,
//         exited,
//         activeCheckpoints: checkpoints.length,
//       });
//     } else {
//       io.emit("dashboard-stats:updated", {
//         totalParticipants,
//         checkedIn,
//         exited,
//         checkpointData,
//       });
//     }
//   } catch (err) {
//     console.error("Error in async live update:", err);
//   }
// }

//2nd

// export const scanQR = async (req, res) => {
//   const { token, checkpointId, action } = req.body;
//   const io = getSocketIO();

//   const participant = await prisma.participant.findUnique({ where: { token } });
//   if (!participant) throw new ExpressError("Participant not found", 404);

//   const checkpoint = await prisma.checkpoint.findUnique({
//     where: { id: checkpointId },
//   });
//   if (!checkpoint) throw new ExpressError("Checkpoint not found", 404);

//   let visit = await prisma.visit.findFirst({
//     where: { participantId: participant.id, checkpointId },
//   });

//   if (!visit) {
//     visit = await prisma.visit.create({
//       data: {
//         participantId: participant.id,
//         checkpointId,
//         lastStatus: "NOT_VISITED",
//       },
//     });
//   }

//   if (
//     checkpoint.type === "SINGLE" &&
//     visit.visitCount > 0 &&
//     action === "entry"
//   ) {
//     throw new ExpressError(
//       "Re-entry not allowed for single-visit checkpoint",
//       400
//     );
//   }

//   // Update visit record (same semantics)
//   const updatedVisit = await prisma.visit.update({
//     where: { id: visit.id },
//     data: {
//       lastStatus: action === "entry" ? "INSIDE" : "EXITED",
//       visitCount: action === "entry" ? { increment: 1 } : undefined,
//       lastScanTime: new Date(),
//     },
//   });

//   const activeCount = await prisma.visit.count({
//     where: { checkpointId, lastStatus: "INSIDE" },
//   });

//   // Respond immediately
//   res.json({
//     participant,
//     visit: updatedVisit,
//     activeCount,
//     message: action === "entry" ? "Entry validated" : "Exit validated",
//   });

//   // Trigger async live updates — pass participant + updatedVisit for parity with original
//   updateLiveStats({ checkpoint, action, io, participant, updatedVisit }).catch(
//     console.error
//   );
// };

// async function updateLiveStats({
//   checkpoint,
//   action,
//   io,
//   participant,     // ADDED
//   updatedVisit,    // ADDED
// }) {
//   try {
//     // Lightweight counts
//     const activeCount = await prisma.visit.count({
//       where: { checkpointId: checkpoint.id, lastStatus: "INSIDE" },
//     });

//     // Emit scan:updated with full payload to match original implementation
//     io.emit("scan:updated", {
//       participant,
//       visit: updatedVisit,
//       checkpointId: checkpoint.id,
//       action,
//       activeCount,
//       checkpointName: checkpoint.name,
//     });

//     // Batch heavy queries
//     const [
//       checkpoints,
//       totalParticipants,
//       insideVisits,
//       liveByCheckpoint,
//       recent,
//     ] = await Promise.all([
//       prisma.checkpoint.findMany({
//         include: { visits: { where: { lastStatus: "INSIDE" } } },
//         orderBy: { createdAt: "asc" },
//       }),
//       prisma.participant.count(),
//       prisma.visit.findMany({
//         where: { lastStatus: "INSIDE" },
//         select: { participantId: true, checkpointId: true },
//       }),
//       prisma.visit.groupBy({
//         by: ["checkpointId"],
//         where: { lastStatus: "INSIDE" },
//         _count: { checkpointId: true },
//       }),
//       // If you want exact parity with original (no limit), remove the `take`.
//       prisma.visit.findMany({
//         where: { lastScanTime: { not: null } },
//         orderBy: { lastScanTime: "desc" },
//         include: { participant: true, checkpoint: true },
//         // take: 20, // <-- keep or remove depending on whether you want a limit
//       }),
//     ]);

//     const formattedLiveStatus = checkpoints.map((cp) => ({
//       id: cp.id,
//       name: cp.name,
//       count: cp.visits.length,
//     }));

//     const checkedIn = new Set(insideVisits.map((v) => v.participantId)).size;
//     const exited = totalParticipants - checkedIn;

//     const checkpointData = await Promise.all(
//       liveByCheckpoint.map(async (c) => {
//         const cp = await prisma.checkpoint.findUnique({
//           where: { id: c.checkpointId },
//         });
//         return { name: cp.name, count: c._count.checkpointId };
//       })
//     );

//     const data = recent.map((r) => ({
//       id: r.id,
//       participantName: r.participant?.name || "Unknown",
//       checkpointName: r.checkpoint?.name || "Unknown",
//       status: r.lastStatus,
//       time: r.lastScanTime ? new Date(r.lastScanTime).toISOString() : null,
//     }));

//     // Emit live stats
//     io.emit("live-status:updated", formattedLiveStatus);
//     io.emit("live-count:updated", data);

//     // Registration Desk special handling: use same semantics as original
//     if (checkpoint.name === "Registration Desk") {
//       const registrationDesk = await prisma.checkpoint.findFirst({
//         where: { name: "Registration Desk" },
//       });

//       if (registrationDesk) {
//         const visits = await prisma.visit.findMany({
//           where: { checkpointId: registrationDesk.id },
//           select: { lastStatus: true },
//         });

//         const regCheckedIn = visits.filter((v) => v.lastStatus === "INSIDE")
//           .length;
//         const regExited = visits.filter((v) => v.lastStatus === "EXITED")
//           .length;

//         const totalCheckpoints = await prisma.checkpoint.count();

//         io.emit("dashboard-stats:updated", {
//           totalRegistered: totalParticipants,
//           checkedIn: regCheckedIn,
//           exited: regExited,
//           activeCheckpoints: totalCheckpoints,
//         });
//       } else {
//         // fallback - emit general dashboard if registration checkpoint missing
//         io.emit("dashboard-stats:updated", {
//           totalParticipants,
//           checkedIn,
//           exited,
//           checkpointData,
//         });
//       }
//     } else {
//       // general dashboard
//       io.emit("dashboard-stats:updated", {
//         totalParticipants,
//         checkedIn,
//         exited,
//         checkpointData,
//       });
//     }
//   } catch (err) {
//     console.error("Error in async live update:", err);
//   }
// }

export const scanQR = async (req, res) => {
  const { token, checkpointId, action } = req.body;
  const io = getSocketIO();

  const participant = await prisma.participant.findUnique({ where: { token } });
  if (!participant) throw new ExpressError("Participant not found", 404);

  const checkpoint = await prisma.checkpoint.findUnique({
    where: { id: checkpointId },
    include: { event: true } // Include event for ownership check
  });
  if (!checkpoint) throw new ExpressError("Checkpoint not found", 404);

  // Security Check: Ensure scanner is authorized for this event
  const user = req.user;
  if (!user) throw new ExpressError("Unauthorized", 401);

  if (user.type === "staff") {
    if (user.eventId !== checkpoint.eventId) {
      throw new ExpressError("You are not authorized to scan for this event.", 403);
    }
    // Optional: Check if staff has specific permission for this checkpoint?
    // User requirement: "whatever the rout after the home URL slash scan then login for login of a admin and it will be like checking into the add event staff if it is has then it will provide"
    // seems to imply basic event check is good.
  } else {
    // Admin (AccountUser) check
    if (checkpoint.event.ownerId !== user.id) {
      throw new ExpressError("You are not the owner of this event.", 403);
    }
  }

  let visit = await prisma.visit.findFirst({
    where: { participantId: participant.id, checkpointId },
  });

  if (!visit) {
    visit = await prisma.visit.create({
      data: {
        participantId: participant.id,
        checkpointId,
        lastStatus: "NOT_VISITED",
      },
    });
  }

  if (
    checkpoint.type === "SINGLE" &&
    visit.visitCount > 0 &&
    action === "entry"
  ) {
    throw new ExpressError(
      "Re-entry not allowed for single-visit checkpoint",
      400
    );
  }

  const updatedVisit = await prisma.visit.update({
    where: { id: visit.id },
    data: {
      lastStatus: action === "entry" ? "INSIDE" : "EXITED",
      visitCount: action === "entry" ? { increment: 1 } : undefined,
      lastScanTime: new Date(),
    },
  });

  const activeCount = await prisma.visit.count({
    where: { checkpointId, lastStatus: "INSIDE" },
  });

  // Respond immediately to the client
  res.json({
    participant,
    visit: updatedVisit,
    activeCount,
    message: action === "entry" ? "Entry validated" : "Exit validated",
  });

  // Fire-and-forget live updates (include participant + updatedVisit so emits match original)
  updateLiveStats({ checkpoint, action, io, participant, updatedVisit }).catch(
    console.error
  );
};

async function updateLiveStats({
  checkpoint,
  action,
  io,
  participant, // passed from scanQR
  updatedVisit, // passed from scanQR
}) {
  try {
    // quick active count for this checkpoint
    const activeCount = await prisma.visit.count({
      where: { checkpointId: checkpoint.id, lastStatus: "INSIDE" },
    });

    // Emit scan:updated WITH full payload (participant + visit + meta)
    io.emit("scan:updated", {
      participant,
      visit: updatedVisit,
      checkpointId: checkpoint.id,
      action,
      activeCount,
      checkpointName: checkpoint.name,
    });

    // If participant has an image/URL, emit separate image event
    // Assumes `participant.photoUrl` exists (string URL or base64). Adapt field name as needed.
    // if (participant?.photoUrl) {
    //   io.emit("scan:image:updated", {
    //     participantId: participant.id,
    //     photoUrl: participant.photoUrl,
    //   });
    // }

    // Heavy queries in parallel
    const [
      checkpoints,
      totalParticipants,
      insideVisits,
      liveByCheckpoint,
      recent,
    ] = await Promise.all([
      prisma.checkpoint.findMany({
        include: { visits: { where: { lastStatus: "INSIDE" } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.participant.count(),
      prisma.visit.findMany({
        where: { lastStatus: "INSIDE" },
        select: { participantId: true, checkpointId: true },
      }),
      prisma.visit.groupBy({
        by: ["checkpointId"],
        where: { lastStatus: "INSIDE" },
        _count: { checkpointId: true },
      }),
      prisma.visit.findMany({
        where: { lastScanTime: { not: null } },
        orderBy: { lastScanTime: "desc" },
        include: { participant: true, checkpoint: true },
        // take: 20, // uncomment if you want to limit recent items
      }),
    ]);

    // Format live status
    const formattedLiveStatus = checkpoints.map((cp) => ({
      id: cp.id,
      name: cp.name,
      count: cp.visits.length,
    }));

    // format recent scans to include image if participant has it
    const data = recent.map((r) => ({
      id: r.id,
      participantId: r.participant?.id,
      participantName: r.participant?.name || "Unknown",
      participantPhoto: r.participant?.photoUrl || null,
      checkpointName: r.checkpoint?.name || "Unknown",
      status: r.lastStatus,
      time: r.lastScanTime ? new Date(r.lastScanTime).toISOString() : null,
    }));

    // Emit live updates
    io.emit("live-status:updated", formattedLiveStatus);
    io.emit("live-count:updated", data);

    // Registration Desk special handling
    if (checkpoint.name === "Registration Desk") {
      const registrationDesk = await prisma.checkpoint.findFirst({
        where: { name: "Registration Desk" },
      });

      if (registrationDesk) {
        const visits = await prisma.visit.findMany({
          where: { checkpointId: registrationDesk.id },
          select: { lastStatus: true },
        });

        const regCheckedIn = visits.filter(
          (v) => v.lastStatus === "INSIDE"
        ).length;
        const regExited = visits.filter(
          (v) => v.lastStatus === "EXITED"
        ).length;

        const totalCheckpoints = await prisma.checkpoint.count();

        io.emit("dashboard-stats:updated", {
          totalRegistered: totalParticipants,
          checkedIn: regCheckedIn,
          exited: regExited,
          activeCheckpoints: totalCheckpoints,
        });
      } else {
        io.emit("dashboard-stats:updated", {
          totalParticipants,
          checkedIn: new Set(insideVisits.map((v) => v.participantId)).size,
          exited:
            totalParticipants -
            new Set(insideVisits.map((v) => v.participantId)).size,
          checkpointData: await Promise.all(
            liveByCheckpoint.map(async (c) => {
              const cp = await prisma.checkpoint.findUnique({
                where: { id: c.checkpointId },
              });
              return { name: cp.name, count: c._count.checkpointId };
            })
          ),
        });
      }
    } else {
      // general dashboard
      const checkedIn = new Set(insideVisits.map((v) => v.participantId)).size;
      const exited = totalParticipants - checkedIn;

      const checkpointData = await Promise.all(
        liveByCheckpoint.map(async (c) => {
          const cp = await prisma.checkpoint.findUnique({
            where: { id: c.checkpointId },
          });
          return { name: cp.name, count: c._count.checkpointId };
        })
      );

      io.emit("dashboard-stats:updated", {
        totalParticipants,
        checkedIn,
        exited,
        checkpointData,
      });
    }

    const checkpointsByparticipant = await prisma.checkpoint.findMany({
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

    io.emit("participant:updated", checkpointsByparticipant)
  } catch (err) {
    console.error("Error in async live update:", err);
  }
}
