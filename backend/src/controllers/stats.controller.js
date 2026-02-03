import prisma from "../prismaClient.js";
import { ExpressError } from "../utils/expressError.js";

// Helper to safely access nested JSON keys
const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const getCheckpointStats = async (req, res) => {
    const { eventId, checkpointId } = req.params;
    const {
        compareMode = "NONE", // NONE, CHECKPOINT, TOTAL
        compareTargetIds
    } = req.query;

    // 1. Fetch Event & All Checkpoints (for Main Graph)
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new ExpressError("Event not found", 404);

    const allCheckpoints = await prisma.checkpoint.findMany({
        where: { eventId },
        orderBy: { createdAt: "asc" },
        include: {
            visits: true // We need counts for graph
        }
    });

    // Build Overview Graph Data (Static, All Checkpoints)
    const overviewGraph = allCheckpoints.map(cp => {
        const visited = cp.visits.filter(v => v.lastStatus === "INSIDE").length;
        const exited = cp.visits.filter(v => v.lastStatus === "EXITED").length;
        return {
            id: cp.id,
            name: cp.name,
            visited,
            exited
        };
    });

    // 2. Identify Dynamic Keys (from a sample of participants)
    const sampleParticipants = await prisma.participant.findMany({
        where: { eventId },
        take: 10
    });

    const currentCheckpoint = allCheckpoints.find(c => c.id === checkpointId);

    const availableKeys = new Set(["branch", "year", "teamId", "foodPreference"]); // Default extra fields
    sampleParticipants.forEach(p => {
        // Standard fields check
        if (p.branch) availableKeys.add("branch");
        if (p.year) availableKeys.add("year");
        if (p.teamId) availableKeys.add("teamId");
        if (currentCheckpoint.isFoodCheckpoint) {
            if (p.foodPreference) availableKeys.add("foodPreference");
        }

        if (p.data && typeof p.data === 'object') {
            Object.keys(p.data).forEach(k => availableKeys.add(k));
        }
    });

    // 3. Get Data for CURRENT/SELECTED Checkpoint
    // We need two lists: 
    // List A: Visited (INSIDE or EXITED)
    // List B: comparisonGap (Missing)


    if (!currentCheckpoint) throw new ExpressError("Checkpoint not found", 404);

    const currentVisits = currentCheckpoint.visits.filter(v =>
        v.lastStatus === "INSIDE" || v.lastStatus === "EXITED"
    );
    const visitedParticipantIds = new Set(currentVisits.map(v => v.participantId));

    // Fetch full participant objects for Visited List
    const visitedParticipants = await prisma.participant.findMany({
        where: { id: { in: Array.from(visitedParticipantIds) } },
        include: { emailLogs: { orderBy: { sentAt: "desc" }, take: 1 } } // For status if needed
    });

    // Map status to them
    const visitedList = visitedParticipants.map(p => {
        const v = currentVisits.find(cv => cv.participantId === p.id);
        return { ...p, status: v ? v.lastStatus : "UNKNOWN" };
    });


    // 4. Comparison Logic (The "Gap" List)
    let comparisonGapList = [];

    // All registered need to be fetched if comparing vs TOTAL or CHECKPOINT gap
    if (compareMode === "TOTAL") {
        // Gap = All Registered who are NOT in visitedList
        comparisonGapList = await prisma.participant.findMany({
            where: {
                eventId,
                id: { notIn: Array.from(visitedParticipantIds) }
            }
        });
    } else if (compareMode === "CHECKPOINT" && compareTargetIds) {
        // Gap = Visited Target Checkpoint BUT NOT Current Checkpoint
        const targetVisits = await prisma.visit.findMany({
            where: {
                checkpointId: compareTargetIds,
                lastStatus: { in: ["INSIDE", "EXITED"] }
            }
        });

        const targetIds = targetVisits.map(v => v.participantId);

        // Find those in targetIds but NOT in visitedParticipantIds
        // i.e. They visited target but NOT current
        const gapIds = targetIds.filter(id => !visitedParticipantIds.has(id));

        comparisonGapList = await prisma.participant.findMany({
            where: { id: { in: gapIds } }
        });
    }

    const totalparticipant = await prisma.participant.count({ where: { eventId: eventId } });


    res.json({
        checkpointName: currentCheckpoint.name,
        overviewGraph,
        availableKeys: Array.from(availableKeys),
        lists: {
            visited: visitedList,
            gap: comparisonGapList
        },
        summary: {
            totalVisits: visitedList.length,
            totalparticipant: totalparticipant,
            totalGap: comparisonGapList.length
        }
    });
};
