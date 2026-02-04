import fs from "fs";
import csv from "csv-parser";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import cloudinary from "./utils/cloudinary.js";
import { generateToken } from "./utils/generateToken.js";
import { generateQRCode } from "./utils/qrGenerator.js";
import { sendQRMail } from "./utils/mailer.js";

dotenv.config();
const prisma = new PrismaClient();

async function processCSV(filePath) {
  const participants = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => participants.push(row))
    .on("end", async () => {
      for (const row of participants) {
        try {
          const token = generateToken();
          const qrDataUrl = await generateQRCode(token);

          const uploadResponse = await cloudinary.uploader.upload(qrDataUrl, {
            folder: "moongazing_qr",
            public_id: `QR_${token}`,
          });

          const newParticipant = await prisma.participant.create({
            data: {
              name: row.Name,
              email: row.Email,
              phone: row.Phone,
              branch: row.Branch,
              year: row.Year,
              token,
              qrUrl: uploadResponse.secure_url,
            },
          });


          await sendQRMail(newParticipant.email, newParticipant.name, uploadResponse.secure_url, token);


        } catch (err) {
          console.error("Error processing row:", err);
        }
      }
      await prisma.$disconnect();
    });
}

// Run: node importCsvAndGenerateQR.js ./participants.csv
processCSV("./filtered_participants.csv");
