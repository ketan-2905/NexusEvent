import prisma from "../prismaClient.js";
import supabase from "../utils/supabase.js";
import { ExpressError } from "../utils/expressError.js";
import fs from "fs";
import Papa from "papaparse";
import QRCode from "qrcode";
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper to get generated CSV path
const getGeneratedCsvPath = (userId, eventName) => `participants/${userId}/${eventName}/generated/participants.csv`;

export const uploadParticipantSource = async (req, res) => {


    const { eventId } = req.params;
    const file = req.file;
    const userId = req.user.id;

    if (!file) {
        console.error("No file in request. Headers:", req.headers);
        console.error("Req Body keys:", Object.keys(req.body));
        throw new ExpressError("No file uploaded", 400);
    }

    // Validate event ownership
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event || event.ownerId !== userId) {
        throw new ExpressError("Event not found or unauthorized", 403);
    }

    const fileName = `participants/${userId}/${event.name}/raw/raw_${Date.now()}_${file.originalname}`;

    // Upload to Supabase Storage directly from Buffer
    const { data, error } = await supabase.storage
        .from("participants")
        .upload(fileName, file.buffer, {
            contentType: file.mimetype,
        });

    if (error) {
        console.error("Supabase Upload Error Detailed:", error);
        throw new ExpressError(`Supabase Upload Error: ${error.message}`, 500);
    }

    // Save to Database
    const publicUrl = supabase.storage.from("participants").getPublicUrl(fileName).data.publicUrl;

    const source = await prisma.participantSource.create({
        data: {
            eventId,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileUrl: publicUrl,
            status: "PENDING",
            type: "RAW"
        }
    });

    res.status(201).json({ message: "File uploaded successfully", source });
};

// ... (getEventSources, deleteParticipantSource, getStoragePath, getSourceHeaders unchanged) ...

// Process the source with mapping
export const processSource = async (req, res) => {
    const { sourceId } = req.params;
    const { mapping } = req.body;

    if (!mapping || !mapping.name || !mapping.email) {
        throw new ExpressError("Mapping must include at least Name and Email", 400);
    }

    const source = await prisma.participantSource.findUnique({
        where: { id: sourceId },
        include: { event: true } // Include event to get name for path
    });
    if (!source) throw new ExpressError("Source not found", 404);

    const storagePath = getStoragePath(source.fileUrl);
    if (!storagePath) throw new ExpressError("Invalid file URL structure", 500);

    const { data, error } = await supabase.storage
        .from("participants")
        .download(storagePath);

    if (error) {
        console.error("Supabase Download Error (Process):", error);
        throw new ExpressError("Failed to download file for processing", 500);
    }

    const text = await data.text();

    const results = Papa.parse(text, { header: true, skipEmptyLines: true });

    const rows = results.data;
    const newParticipants = [];
    let duplicateCount = 0;

    const existingParticipants = await prisma.participant.findMany({
        where: { eventId: source.eventId },
        select: { email: true }
    });
    const existingEmails = new Set(existingParticipants.map(p => p.email.toLowerCase()));

    // CSV Data Accumulator for Generared File
    const validRowsForCsv = [];

    for (const row of rows) {
        const email = row[mapping.email]?.trim();
        const name = row[mapping.name]?.trim();

        if (!email || !name) continue;

        if (existingEmails.has(email.toLowerCase())) {
            duplicateCount++;
            continue;
        }

        // Handle Food Preference Normalization
        let foodPref = "VEG"; // Default
        if (mapping.foodPreference && row[mapping.foodPreference]) {
            const val = row[mapping.foodPreference].toUpperCase().replace("-", "_"); // NON-VEG -> NON_VEG
            if (["VEG", "NON_VEG", "JAIN"].includes(val)) {
                foodPref = val;
            }
        }

        const participant = {
            eventId: source.eventId,
            name: name,
            email: email,
            phone: mapping.phone ? row[mapping.phone] : null,
            branch: mapping.branch ? row[mapping.branch] : null,
            year: mapping.year ? row[mapping.year] : null,
            teamName: mapping.teamName ? row[mapping.teamName] : null,
            teamId: mapping.teamId ? row[mapping.teamId] : null,
            foodPreference: foodPref,
            qrUrl: "pending_generation",
            token: `${source.eventId}-${email}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            data: {}
        };

        try {
            const qrDataUrl = await QRCode.toDataURL(participant.token, { width: 300 });
            const uploadResult = await cloudinary.uploader.upload(qrDataUrl, {
                folder: `event_qrs/${source.eventId}`,
                public_id: `qr_${participant.token}`,
                overwrite: true
            });
            participant.qrUrl = uploadResult.secure_url;
        } catch (err) {
            console.error(`Failed to generate/upload QR for ${participant.email}:`, err);
            // Keep as 'pending_generation' - the sendEmail function will auto-heal this if it's missing/invalid later.
        }

        // Map extra fields to data (exclude mapped header values)
        const mappedValues = Object.values(mapping);
        Object.keys(row).forEach(header => {
            if (!mappedValues.includes(header)) {
                participant.data[header] = row[header];
            }
        });

        newParticipants.push(participant);
        existingEmails.add(email.toLowerCase());

        // Prepare CSV Row (Flattened)
        validRowsForCsv.push({
            name: participant.name,
            email: participant.email,
            phone: participant.phone,
            branch: participant.branch,
            year: participant.year,
            teamName: participant.teamName,
            teamId: participant.teamId,
            foodPreference: participant.foodPreference,
            token: participant.token,
            ...participant.data // Spread extra data columns
        });
    }
    if (newParticipants.length > 0) {
        // 1. Save to DB
        await prisma.participant.createMany({
            data: newParticipants
        });

        // 2. Append to Generated CSV
        const generatedPath = getGeneratedCsvPath(source.event.ownerId, source.event.name);

        // Try to fetch existing
        let existingCsvData = [];
        const { data: existingData, error: existingError } = await supabase.storage
            .from("participants")
            .download(generatedPath);

        if (!existingError && existingData) {
            const exText = await existingData.text();
            const exParsed = Papa.parse(exText, { header: true });
            existingCsvData = exParsed.data;
        }

        // Merge
        const finalCsvData = [...existingCsvData, ...validRowsForCsv];
        const csvString = Papa.unparse(finalCsvData);

        // Upload Updated Generated CSV
        await supabase.storage
            .from("participants")
            .upload(generatedPath, csvString, { contentType: 'text/csv', upsert: true });

        // 3. Ensure "Registration Desk" Checkpoint Exists
        let regCheckpoint = await prisma.checkpoint.findFirst({
            where: {
                eventId: source.eventId,
                name: "Registration Desk"
            }
        });

        if (!regCheckpoint) {
            regCheckpoint = await prisma.checkpoint.create({
                data: {
                    eventId: source.eventId,
                    name: "Registration Desk",
                    type: "SINGLE"
                }
            });
        }

        // 4. Create Visit Records
        // // Fetch newly created participants to get their IDs
        // const createdParticipants = await prisma.participant.findMany({
        //     where: {
        //         eventId: source.eventId,
        //         email: { in: newParticipants.map(p => p.email) }
        //     },
        //     select: { id: true }
        // });

        // if (createdParticipants.length > 0) {
        //     const visitData = createdParticipants.map(p => ({
        //         participantId: p.id,
        //         checkpointId: regCheckpoint.id,
        //         lastStatus: "NOT_VISITED"
        //     }));

        //     await prisma.visit.createMany({
        //         data: visitData,
        //         skipDuplicates: true
        //     });
        // }
    }

    await prisma.participantSource.update({
        where: { id: sourceId },
        data: {
            status: "PROCESSED",
            mapping: mapping,
            headers: results.meta.fields
        }
    });

    res.json({
        message: "Processing complete",
        added: newParticipants.length,
        duplicates: duplicateCount
    });
};

export const getEventSources = async (req, res) => {
    const { eventId } = req.params;
    const sources = await prisma.participantSource.findMany({
        where: { eventId },
        orderBy: { createdAt: "desc" }
    });
    res.json(sources);
};

export const deleteParticipantSource = async (req, res) => {
    const { sourceId } = req.params;
    // Ideally verify ownership via eventId but for now assuming if they can hit this route they are authorized contextually 
    // (Middleware should ideally check event ownership if sourceId is global)
    // We will fetch source to get eventId and check ownership if strict.

    // For now simple delete.
    const source = await prisma.participantSource.findUnique({ where: { id: sourceId } });
    if (!source) throw new ExpressError("Source not found", 404);

    // Optional: Delete from Supabase? 
    // Not strictly necessary for this prototype, but good practice.
    // const path = source.fileUrl.split("/").pop(); ...

    await prisma.participantSource.delete({ where: { id: sourceId } });

    res.json({ message: "Source deleted" });
};

// Helper to extract storage path from public URL
// URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
const getStoragePath = (fullUrl) => {
    const parts = fullUrl.split("/object/public/participants/");
    if (parts.length < 2) return null;
    return decodeURIComponent(parts[1]);
};

// Fetch headers from CSV for mapping
export const getSourceHeaders = async (req, res) => {
    const { sourceId } = req.params;

    const source = await prisma.participantSource.findUnique({ where: { id: sourceId } });
    if (!source) throw new ExpressError("Source not found", 404);

    const storagePath = getStoragePath(source.fileUrl);
    if (!storagePath) throw new ExpressError("Invalid file URL structure", 500);

    const { data, error } = await supabase.storage
        .from("participants")
        .download(storagePath);

    if (error) {
        console.error("Supabase Download Error:", error);
        throw new ExpressError("Failed to download file from storage", 500);
    }

    const text = await data.text();

    const results = Papa.parse(text, {
        header: true,
        preview: 5,
        skipEmptyLines: true
    });

    res.json({
        headers: results.meta.fields || [],
        preview: results.data
    });
};

// End of file
