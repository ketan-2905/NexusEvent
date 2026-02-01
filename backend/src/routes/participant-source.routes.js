import express from "express";
import multer from "multer";
import { uploadParticipantSource, getEventSources, getSourceHeaders, processSource, deleteParticipantSource } from "../controllers/participant-source.controller.js";
import { wrapAsync } from "../utils/expressError.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // In-memory storage

const sourceRouter = express.Router({ mergeParams: true });

sourceRouter.post(
  "/",
  upload.single("file"),
  wrapAsync(uploadParticipantSource)
);

sourceRouter.get(
    "/",
    wrapAsync(getEventSources)
);

sourceRouter.get(
    "/:sourceId/headers",
    wrapAsync(getSourceHeaders)
);

sourceRouter.post(
    "/:sourceId/process",
    wrapAsync(processSource)
);

sourceRouter.delete(
    "/:sourceId",
    wrapAsync(deleteParticipantSource)
);

export default sourceRouter;
