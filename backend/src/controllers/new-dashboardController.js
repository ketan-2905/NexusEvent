// // controllers/dashboardController.js
// import prisma from "../prismaClient.js";
// import { getSocketIO } from "../utils/socket.js";

// // ---------------------
// // 📊 Fetch Dashboard Stats
// // ---------------------
// export const getNewDashboardStats = async (req, res) => {
//   try {
//     const totalParticipants = await prisma.participant.count();
//     const totalCheckpoints = await prisma.checkpoint.count();

//     const visits = await prisma.visit.findMany({
//       select: { participantId: true, checkpointId: true, lastStatus: true },
//     });

//     const inside = visits.filter((v) => v.lastStatus === "INSIDE");
//     const checkedIn = new Set(inside.map((v) => v.participantId)).size;
//     const exited = totalParticipants - checkedIn;

//     const liveByCheckpoint = await prisma.visit.groupBy({
//       by: ["checkpointId"],
//       where: { lastStatus: "INSIDE" },
//       _count: { checkpointId: true },
//     });

//     const checkpointData = await Promise.all(
//       liveByCheckpoint.map(async (c) => {
//         const checkpoint = await prisma.checkpoint.findUnique({
//           where: { id: c.checkpointId },
//         });
//         return { name: checkpoint.name, count: c._count.checkpointId };
//       })
//     );

//     const totalVisits = visits.length;
//     const avgVisits =
//       totalParticipants > 0 ? (totalVisits / totalParticipants).toFixed(2) : 0;

//     const stats = {
//       totalParticipants,
//       totalCheckpoints,
//       checkedIn,
//       exited,
//       checkpointData,
//       avgVisits,
//       activeCheckpoints: checkpointData.length,
//     };

//     console.log(stats);
    

//     res.json(stats);
//   } catch (err) {
//     console.error("Error fetching dashboard stats:", err);
//     res.status(500).json({ error: "Failed to fetch dashboard stats" });
//   }
// };

// // ---------------------
// // 🕒 Fetch Recent Scans
// // ---------------------
// export const getRecentScans = async (req, res) => {
//   try {
//     const recent = await prisma.visit.findMany({
//       where: { lastScanTime: { not: null } },
//       orderBy: { lastScanTime: "desc" },
//       take: 10,
//       include: { participant: true, checkpoint: true },
//     });

//     const data = recent.map((r) => ({
//       id: r.id,
//       name: r.participant.name,
//       checkpoint: r.checkpoint.name,
//       status: r.lastStatus,
//       time: r.lastScanTime,
//     }));

//     console.log(data);
    

//     res.json(data);
//   } catch (err) {
//     console.error("Error fetching recent scans:", err);
//     res.status(500).json({ error: "Failed to fetch recent scans" });
//   }
// };

// // ---------------------
// // 🚀 Emit Updates (for use in other controllers)
// // ---------------------
// export const emitDashboardUpdates = async () => {
//   const io = getSocketIO();

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

//   const payload = {
//     totalParticipants,
//     checkedIn,
//     exited,
//     checkpointData,
//   };

//   io.emit("dashboard-stats:updated", payload);
// };

// // ---------------------
// // 🧾 Example: handleScan (called from your scan controller)
// // ---------------------
// export const handleScanUpdate = async (scan) => {
//   const io = getSocketIO();
//   io.emit("scan:updated", scan);
//   await emitDashboardUpdates(); // refresh dashboard in real time
// };

// // ---------------------
// // 🧑‍💻 Example: handleParticipantRegistered
// // ---------------------
// export const handleParticipantRegistered = async (participant) => {
//   const io = getSocketIO();
//   io.emit("participant:registered", participant);
//   await emitDashboardUpdates();
// };


// controllers/dashboardController.js
import prisma from "../prismaClient.js";
import { getSocketIO } from "../utils/socket.js";

// 📊 Fetch Dashboard Stats (Existing + Initial Emit)
export const getRegistrationDeskStats = async (req, res) => {
  try {
    const totalParticipants = await prisma.participant.count();

    const registrationDesk = await prisma.checkpoint.findFirst({
      where: { name: "Registration Desk" },
    });

    if (!registrationDesk) {
      return res.status(404).json({ error: "Registration Desk not found" });
    }

    const visits = await prisma.visit.findMany({
      where: { checkpointId: registrationDesk.id },
      select: { participantId: true, lastStatus: true },
    });

    const checkedIn = visits.filter((v) => v.lastStatus === "INSIDE").length;
    const exited = visits.filter((v) => v.lastStatus === "EXITED").length;

    const totalCheckpoints = await prisma.checkpoint.count();

    const stats = {
      totalRegistered: totalParticipants,
      checkedIn,
      exited,
      activeCheckpoints: totalCheckpoints,
    };

    const io = getSocketIO();
    io.emit("dashboard-stats:updated", stats);

    res.json(stats);
  } catch (err) {
    console.error("Error fetching Registration Desk stats:", err);
    res.status(500).json({ error: "Failed to fetch Registration Desk stats" });
  }
};


// 🕒 Fetch Recent Scans (Fixed Invalid Date)
export const getRecentScans = async (req, res) => {
  try {
    const recent = await prisma.visit.findMany({
      where: { lastScanTime: { not: null } },
      orderBy: { lastScanTime: "desc" },
      take: 10,
      include: { participant: true, checkpoint: true },
    });

    const data = recent.map((r) => ({
      id: r.id,
      participantName: r.participant?.name || "Unknown",
      checkpointName: r.checkpoint?.name || "Unknown",
      status: r.lastStatus,
      time: r.lastScanTime ? new Date(r.lastScanTime).toISOString() : null,
    }));

    res.json(data);
  } catch (err) {
    console.error("Error fetching recent scans:", err);
    res.status(500).json({ error: "Failed to fetch recent scans" });
  }
};

