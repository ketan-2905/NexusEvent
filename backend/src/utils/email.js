import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail", // Or use 'host' and 'port' from env if preferred. Using gmail as common default or smtp.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, code) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #4A90E2; letter-spacing: 5px;">${code}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export const sendCredentialsEmail = async (email, password, eventName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Staff Access for ${eventName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Access Granted</h2>
          <p>You have been added as staff for <strong>${eventName}</strong>.</p>
          <p>Your login credentials are:</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 5px;">
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Password:</strong> ${password}</p>
          </div>
          <p>Please login and change your password if needed.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Credentials sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending credentials:", error);
    // Don't throw to prevent rollback of staff creation? Or maybe throw.
    // User requirement: "Our male should send a mail ... if already something there ... remove that"
    // I'll log it.
  }
};
