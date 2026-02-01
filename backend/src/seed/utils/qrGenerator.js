import QRCode from "qrcode";

export async function generateQRCode(token) {
  try {
    const qrDataUrl = await QRCode.toDataURL(token, { width: 300 });
    return qrDataUrl;
  } catch (error) {
    console.error("QR generation failed:", error);
  }
}
