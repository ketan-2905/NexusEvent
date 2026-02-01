export function generateToken(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid confusing chars
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
