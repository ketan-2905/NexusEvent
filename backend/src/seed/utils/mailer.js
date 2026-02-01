// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
// dotenv.config();

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// export async function sendQRMail(to, name, qrUrl, token) {
//   const mailOptions = {
//     from: `"DJS NOVA" <${process.env.EMAIL_USER}>`,
//     to,
//     subject: "Your Moongazing 2.0 QR Code 🌙",
//     html: `
//       <h2>Hello ${name},</h2>
//       <p>Welcome to <b>Moongazing 2.0</b>! 🌕</p>
//       <p>Your unique entry token: <b>${token}</b></p>
//       <p>Here is your QR code:</p>
//       <img src="${qrUrl}" alt="QR Code" style="width:200px;height:200px;"/>
//       <p>Keep this safe — you'll need it for event entry.</p>
//       <br/>
//       <p>– DJS NOVA Team</p>
//     `,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log(`✅ Mail sent to ${to}`);
//   } catch (error) {
//     console.error(`❌ Error sending mail to ${to}:`, error);
//   }
// }


import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendQRMail(to, name, qrUrl, token) {
  const mailOptions = {
    from: `"🌌 DJS NOVA – Moongazing 2.0" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🌙 Your Boarding Pass to Moongazing 2.0!",
    html: `
    <div style="
      background: radial-gradient(circle at top, #0b0c10, #000);
      color: #e6e6e6;
      font-family: 'Segoe UI', Arial, sans-serif;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
    ">
      <h1 style="color: #fff; font-size: 28px; letter-spacing: 1px;">
        🚀 Welcome, <span style="color:#7dd3fc;">${name}</span>!
      </h1>
      <p style="font-size:16px; color:#b0b0b0; margin-top:8px;">
        You’re officially part of <b style="color:#93c5fd;">Moongazing 2.0</b> — where the night sky comes alive!
      </p>

      <div style="margin: 24px 0; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
        <p style="font-size: 15px; margin: 0; color:#9ca3af;">Your unique entry token:</p>
        <p style="font-size: 22px; font-weight: bold; color:#38bdf8; letter-spacing: 1px; margin:8px 0;">
          ${token}
        </p>
      </div>

      <p style="font-size: 15px; color:#d1d5db;">Here’s your cosmic QR pass 👇</p>
      <img src="${qrUrl}" alt="QR Code"
        style="width:200px;height:200px;border-radius:12px;margin:15px auto;display:block;border:2px solid #38bdf8;" />

      <p style="color:#a3a3a3; font-size:14px; margin-top:20px;">
        Keep this QR safe — it’s your <b>boarding pass to the stars ✨</b><br/>
        Present it at the registration desk during entry.
      </p>

      <hr style="margin:30px 0;border:none;border-top:1px solid rgba(255,255,255,0.1);" />

      <p style="font-size:13px; color:#6b7280;">
        With love from the <b style="color:#93c5fd;">DJS NOVA</b> Team 🌕
      </p>
    </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Mail sent to ${to}`);
  } catch (error) {
    console.error(`❌ Error sending mail to ${to}:`, error);
  }
}
