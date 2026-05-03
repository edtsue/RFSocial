import crypto from "node:crypto";

function sign(exp, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(String(exp))
    .digest("hex");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const password = process.env.PASSWORD;
  if (!password) {
    res.status(500).json({ error: "Server is missing PASSWORD" });
    return;
  }

  const { password: input, remember } = req.body || {};
  if (typeof input !== "string" || input !== password) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }

  const days = remember ? 7 : 1;
  const exp = Date.now() + days * 86400 * 1000;
  const sig = sign(exp, password);
  const token = `${exp}.${sig}`;
  const maxAge = days * 86400;

  res.setHeader(
    "Set-Cookie",
    `rfs_auth=${token}; Path=/; Max-Age=${maxAge}; SameSite=Lax; HttpOnly`,
  );
  res.status(200).json({ ok: true, expiresAt: exp });
}
