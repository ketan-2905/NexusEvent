import nodemailer from "nodemailer";
import prisma from "../prismaClient.js";

// Create transporter dynamically based on user credentials or system default
export const createTransporter = async (userId) => {
    let user = null;
    
    if (userId) {
        user = await prisma.accountUser.findUnique({
            where: { id: userId },
            select: { emailUser: true, emailPass: true }
        });
    }

    if (user && user.emailUser && user.emailPass) {
        return nodemailer.createTransport({
            service: "gmail", // Assuming Gmail for now, could be dynamic
            auth: {
                user: user.emailUser,
                pass: user.emailPass,
            },
        });
    }

    // System Fallback
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

export const sendEmail = async (transporter, to, subject, html, fromOverride = null) => {
    const from = fromOverride || process.env.EMAIL_USER;
    await transporter.sendMail({
        from: `"Nexus Event" <${from}>`,
        to,
        subject,
        html,
    });
};
