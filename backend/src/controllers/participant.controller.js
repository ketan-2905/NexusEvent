import prisma from "../prismaClient.js";
import { createTransporter } from "../utils/emailService.js";
import QRCode from "qrcode";
import { ExpressError } from "../utils/expressError.js";
import { getSocketIO } from "../utils/socket.js";

export const getAllParticipants = async (req, res) => {
    const participants = await prisma.participant.findMany({
        select: { id: true, name: true, year: true, branch: true, token: true, qrUrl: true },
        orderBy: { registrationTime: "desc" },
    });

    res.json(participants);
};

export const getEventParticipants = async (req, res) => {
    const { eventId } = req.params;
    const participants = await prisma.participant.findMany({
        where: { eventId },
        include: { emailLogs: { orderBy: { sentAt: 'desc' }, take: 1 } },
        orderBy: { registrationTime: "desc" }
    });
    res.json(participants);
};

// ...

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const sendEventEmails = async (req, res) => {
    const { eventId } = req.params;
    const { template, subject } = req.body;

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { owner: true, activeTemplate: true }
    });

    if (!event) throw new ExpressError("Event not found", 404);

    // Use passed template OR active template from relation
    let emailTemplate = template || (event.activeTemplate ? event.activeTemplate.template : null);

    if (!emailTemplate) {
        // Fallback
        emailTemplate = `
            <div style="font-family: sans-serif; padding: 20px; text-align: center;">
                <h1>Hello {{name}},</h1>
                <p>You are registered for <strong>{{eventName}}</strong>.</p>
                <img src="{{qrCode}}" alt="Ticket QR" style="width: 200px; height: 200px;" />
                <p>Team: {{teamName}}</p>
                <p>Show this code at the entrance.</p>
            </div>
        `;
    }

    const participants = await prisma.participant.findMany({
        where: { eventId }
    });

    if (participants.length === 0) {
        return res.json({ message: "No participants to email", count: 0 });
    }

    // Create persistent job
    const job = await prisma.emailJob.create({
        data: {
            eventId,
            status: "PROCESSING",
            totalCount: participants.length
        }
    });

    // Respond immediately with job ID
    res.json({ message: "Email sending started", jobId: job.id, total: participants.length });

    // Background Process
    (async () => {
        const io = getSocketIO();
        const transporter = await createTransporter(event.ownerId).catch(() => createTransporter(null));
        let sentCount = 0;
        let failedCount = 0;

        // Chunking
        const CHUNK_SIZE = 5;
        for (let i = 0; i < participants.length; i += CHUNK_SIZE) {
            const chunk = participants.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map(async (p) => {
                try {
                    // Check if QR URL is valid and hosted on Cloudinary
                    let qrUrl = p.qrUrl;

                    // If missing, empty, or NOT from Cloudinary (e.g. legacy qrserver link), regenerate it
                    if (!qrUrl || qrUrl.trim() === "" || !qrUrl.includes("cloudinary.com")) {
                        // Generate QR locally to a buffer/dataURL then upload
                        const qrDataUrl = await QRCode.toDataURL(p.token, { width: 300 });

                        // Upload to Cloudinary
                        const uploadResult = await cloudinary.uploader.upload(qrDataUrl, {
                            folder: `event_qrs/${eventId}`,
                            public_id: `qr_${p.token}`,
                            overwrite: true
                        });

                        qrUrl = uploadResult.secure_url;

                        // Save PERSISTENTLY in database
                        await prisma.participant.update({
                            where: { id: p.id },
                            data: { qrUrl: qrUrl }
                        });
                    }

                    let html = emailTemplate
                        .replace(/{{name}}/g, p.name)
                        .replace(/{{eventName}}/g, event.name)
                        .replace(/{{qrCode}}/g, qrUrl)
                        .replace(/{{teamName}}/g, p.teamName || "Individual")
                        .replace(/{{token}}/g, p.token);

                    if (p.data && typeof p.data === 'object') {
                        Object.keys(p.data).forEach(key => {
                            const regex = new RegExp(`{{${key}}}`, 'g');
                            html = html.replace(regex, p.data[key] || "");
                        });
                    }

                    await transporter.sendMail({
                        from: event.owner.email,
                        to: p.email,
                        subject: subject || `Your Ticket for ${event.name}`,
                        html: html
                    });

                    sentCount++;

                    // Create Success Log linked to Job
                    await prisma.emailLog.create({
                        data: {
                            eventId,
                            participantId: p.id,
                            status: "SENT",
                            jobId: job.id
                        }
                    });

                } catch (err) {
                    console.error(`Failed to send to ${p.email}`, err);
                    failedCount++;

                    // Create Failed Log linked to Job
                    await prisma.emailLog.create({
                        data: {
                            eventId,
                            participantId: p.id,
                            status: "FAILED",
                            error: err.message,
                            jobId: job.id
                        }
                    });
                }
            }));

            // Update Job Status per chunk
            await prisma.emailJob.update({
                where: { id: job.id },
                data: { sentCount, failedCount }
            });

            // Emit Progress
            io.emit(`event:${eventId}:email:progress`, {
                jobId: job.id,
                total: participants.length,
                sent: sentCount,
                errors: failedCount,
                completed: false
            });
        }

        // Final Update
        await prisma.emailJob.update({
            where: { id: job.id },
            data: {
                status: "COMPLETED",
                sentCount,
                failedCount
            }
        });

        io.emit(`event:${eventId}:email:progress`, {
            jobId: job.id,
            total: participants.length,
            sent: sentCount,
            errors: failedCount,
            completed: true
        });
    })();
};

export const updateParticipant = async (req, res) => {
    const { id } = req.params;
    const updates = req.body; // Full object including dynamic data keys

    // 1. Separate standard fields from custom JSON fields
    const standardFields = [
        "name", "email", "phone", "branch", "year",
        "teamName", "teamId", "foodPreference"
    ];

    const prismaData = {};
    const jsonData = {};

    console.log("updates", updates);


    Object.keys(updates).forEach(key => {
        // console.log("Outer", key);
        // if (standardFields.includes(key)) {
        //     prismaData[key] = updates[key];
        // } else {
        //     // It's a custom field, put it in data
        //     jsonData[key] = updates[key];
        //     console.log("Inner", key);

        // }
        Object.keys(updates.data).forEach(key => {
            jsonData[key] = updates[key];
        });

    });

    // 2. We need to merge existing data with new jsonData
    const currentParticipant = await prisma.participant.findUnique({ where: { id } });
    if (!currentParticipant) throw new ExpressError("Participant not found", 404);

    const mergedData = {
        ...(currentParticipant.data || {}),
        ...jsonData
    };

    // 3. Update
    const participant = await prisma.participant.update({
        where: { id },
        data: {
            name: prismaData.name,
            email: prismaData.email,
            phone: prismaData.phone,
            branch: prismaData.branch,
            year: prismaData.year,
            teamName: prismaData.teamName,
            teamId: prismaData.teamId,
            foodPreference: prismaData.foodPreference,
            data: mergedData
        }
    });

    res.json(participant);
};

export const deleteParticipant = async (req, res) => {
    const { id, eventId } = req.params;

    const participant = await prisma.participant.findUnique({ where: { id } });
    if (!participant) throw new ExpressError("Participant not found", 404);

    // Ensure it belongs to the event (extra safety, though not strictly required if ID is unique)
    if (participant.eventId !== eventId) throw new ExpressError("Participant does not belong to this event", 400);

    // Cascade delete visits is automatic via relation if configured, but let's be explicit if needed.
    // Prisma `onDelete: Cascade` in schema handles relations.
    // However, if we didn't set that up for visits in schema, we might error.
    // Let's assume schema handles it or clean up visits manually if paranoid.
    // For now, simple delete.

    await prisma.participant.delete({ where: { id } });

    res.json({ message: "Participant deleted successfully" });
};

export const sendParticipantEmail = async (req, res) => {
    const { eventId, id } = req.params;
    const { template, subject } = req.body;

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { owner: true, activeTemplate: true }
    });
    if (!event) throw new ExpressError("Event not found", 404);

    const participant = await prisma.participant.findUnique({ where: { id } });
    if (!participant) throw new ExpressError("Participant not found", 404);

    let emailTemplate = template || (event.activeTemplate ? event.activeTemplate.template : null);
    if (!emailTemplate) {
        // Simple fallback
        emailTemplate = `<p>Hello {{name}}, <br> This is your ticket for {{eventName}}. <br> <img src="{{qrCode}}" width="200"/> <br> Code: {{token}}</p>`;
    };

    // Check QR
    let qrUrl = participant.qrUrl;
    if (!qrUrl || qrUrl.trim() === "" || !qrUrl.includes("cloudinary.com")) {
        const qrDataUrl = await QRCode.toDataURL(participant.token, { width: 300 });
        const uploadResult = await cloudinary.uploader.upload(qrDataUrl, {
            folder: `event_qrs/${eventId}`,
            public_id: `qr_${participant.token}`,
            overwrite: true
        });
        qrUrl = uploadResult.secure_url;
        await prisma.participant.update({ where: { id }, data: { qrUrl } });
    }

    let html = emailTemplate
        .replace(/{{name}}/g, participant.name)
        .replace(/{{eventName}}/g, event.name)
        .replace(/{{qrCode}}/g, qrUrl)
        .replace(/{{teamName}}/g, participant.teamName || "Individual")
        .replace(/{{token}}/g, participant.token)
        .replace(/{{teamId}}/g, participant.teamId || "N/A")
        .replace(/{{phone}}/g, participant.phone || "N/A")
        .replace(/{{branch}}/g, participant.branch || "N/A")
        .replace(/{{year}}/g, participant.year || "N/A")
        .replace(/{{qrUrl}}/g, participant.qrUrl || "N/A");

    if (participant.data && typeof participant.data === 'object') {
        Object.keys(participant.data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, participant.data[key] || "");
        });
    }

    const transporter = await createTransporter(event.ownerId).catch(() => createTransporter(null));

    try {
        await transporter.sendMail({
            from: event.owner.email,
            to: participant.email,
            subject: subject || `Your Ticket for ${event.name}`,
            html: html
        });

        await prisma.emailLog.create({
            data: { eventId, participantId: id, status: "SENT" }
        });

        res.json({ message: "Email sent successfully" });
    } catch (err) {
        await prisma.emailLog.create({
            data: { eventId, participantId: id, status: "FAILED", error: err.message }
        });
        throw new ExpressError(`Failed to send email: ${err.message}`, 500);
    }
};

export const getEmailLogs = async (req, res) => {
    const { eventId } = req.params;
    const logs = await prisma.emailLog.findMany({
        where: { eventId },
        include: { participant: true },
        orderBy: { sentAt: 'desc' }
    });
    // Let's filter slightly in backend or return all. Returning all gives better context.
    res.json(logs);
};

export const getActiveEmailJob = async (req, res) => {
    const { eventId } = req.params;

    // Find the latest job that is either PROCESSING or COMPLETED (to show last status)
    // We prioritize PROCESSING.
    const job = await prisma.emailJob.findFirst({
        where: { eventId },
        orderBy: { createdAt: "desc" },
    });

    if (!job) return res.json(null);

    return res.json(job);
};
