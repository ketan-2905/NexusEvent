import express from "express";
import { createEvent, getMyEvents, getEventById, updateEvent } from "../controllers/event.controller.js";
import { addStaff, getEventStaff, updateStaff } from "../controllers/staff.controller.js";
import { verifyToken } from "../middleware/auth.js";
import { wrapAsync } from "../utils/expressError.js";
import participantSourceRoutes from "./participant-source.routes.js";
import { getEventParticipants, sendEventEmails, updateParticipant, deleteParticipant, sendParticipantEmail, getEmailLogs, getActiveEmailJob } from "../controllers/participant.controller.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", wrapAsync(createEvent));
router.get("/", wrapAsync(getMyEvents));
router.get("/:id", wrapAsync(getEventById));
router.put("/:id", wrapAsync(updateEvent));

router.post("/:eventId/staff", wrapAsync(addStaff));
router.get("/:eventId/staff", wrapAsync(getEventStaff));
router.put("/:eventId/staff/:staffId", wrapAsync(updateStaff));

// Participants
router.get("/:eventId/participants", wrapAsync(getEventParticipants));
router.post("/:eventId/send-emails", wrapAsync(sendEventEmails));
router.put("/:eventId/participants/:id", wrapAsync(updateParticipant));
router.delete("/:eventId/participants/:id", wrapAsync(deleteParticipant));
router.post("/:eventId/participants/:id/send-email", wrapAsync(sendParticipantEmail));
router.get("/:eventId/email-logs", wrapAsync(getEmailLogs));
router.get("/:eventId/email-job/active", wrapAsync(getActiveEmailJob));

// Email Design & AI
import { generateEmailTemplate, saveEmailDraft, updateEmailDraft, getEmailDrafts, deleteEmailDraft } from "../controllers/email-design.controller.js";
router.post("/:eventId/generate-email", wrapAsync(generateEmailTemplate));
router.post("/:eventId/email-drafts", wrapAsync(saveEmailDraft));
router.put("/:eventId/email-drafts/:draftId", wrapAsync(updateEmailDraft));
router.get("/:eventId/email-drafts", wrapAsync(getEmailDrafts));
router.delete("/:eventId/email-drafts/:draftId", wrapAsync(deleteEmailDraft));

// Mount source routes
router.use("/:eventId/sources", participantSourceRoutes);

// Mount checkpoint routes
import checkpointRoutes from "./checkpoint.routes.js";
router.use("/:eventId/checkpoints", checkpointRoutes);

export default router;
