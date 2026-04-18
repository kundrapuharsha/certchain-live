/**
 * POST /api/notify
 * Sends a certificate-issued email to the student via SendGrid.
 * Deployed as a Vercel Serverless Function.
 *
 * Body: {
 *   studentName,  studentEmail, studentId,
 *   courseName,   grade,        certId,
 *   institutionName, issueDate, metadataURI,
 *   ipfsUrl (optional)
 * }
 */

const sgMail = require("@sendgrid/mail");

// ── CORS helper ──────────────────────────────────────────────
function setCORS(res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ── Email HTML template ──────────────────────────────────────
function buildHTML({ studentName, studentEmail, studentId, courseName, grade,
  certId, institutionName, issueDate, ipfsUrl, siteUrl }) {

  const verifyUrl = `${siteUrl || "https://certchain.vercel.app"}/verify/${certId}`;
  const dateStr   = new Date(issueDate * 1000).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Certificate is Ready</title>
  <style>
    body { margin:0; padding:0; background:#f1f5f9; font-family: Arial, sans-serif; }
    .wrap { max-width:600px; margin:32px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
    .header { background:#1A56DB; padding:36px 40px; text-align:center; }
    .header h1 { margin:0; color:#fff; font-size:26px; font-weight:800; letter-spacing:-0.5px; }
    .header p  { margin:8px 0 0; color:rgba(255,255,255,0.8); font-size:14px; }
    .body  { padding:36px 40px; }
    .greeting { font-size:20px; font-weight:700; color:#1e293b; margin-bottom:12px; }
    .text  { font-size:15px; color:#475569; line-height:1.7; margin-bottom:24px; }
    .cert-card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:24px; margin-bottom:28px; }
    .cert-row  { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #e2e8f0; font-size:14px; }
    .cert-row:last-child { border-bottom:none; }
    .cert-label { color:#64748b; font-weight:600; }
    .cert-value { color:#1e293b; font-weight:700; text-align:right; max-width:60%; }
    .cert-id { background:#1e293b; border-radius:8px; padding:14px 18px; margin-bottom:28px; word-break:break-all; font-family:monospace; font-size:12px; color:#94a3b8; }
    .cert-id span { display:block; font-size:11px; color:#64748b; margin-bottom:6px; letter-spacing:1px; text-transform:uppercase; }
    .btn { display:block; text-align:center; background:#1A56DB; color:#fff; text-decoration:none; padding:16px 32px; border-radius:10px; font-size:16px; font-weight:700; margin-bottom:20px; }
    .ipfs-btn { display:block; text-align:center; background:#065f46; color:#fff; text-decoration:none; padding:12px 24px; border-radius:8px; font-size:14px; font-weight:600; margin-bottom:28px; }
    .footer { background:#f8fafc; padding:24px 40px; text-align:center; border-top:1px solid #e2e8f0; }
    .footer p { font-size:12px; color:#94a3b8; margin:4px 0; }
    .badge { display:inline-block; background:#dcfce7; color:#166534; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; margin-bottom:20px; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>🎓 CertChain</h1>
    <p>Blockchain Certificate Registry</p>
  </div>
  <div class="body">
    <div class="greeting">Congratulations, ${studentName}!</div>
    <div class="badge">✅ Blockchain Verified</div>
    <p class="text">
      Your academic certificate has been permanently recorded on the Ethereum blockchain
      by <strong>${institutionName}</strong>. It is now publicly verifiable by anyone — no
      central authority required.
    </p>

    <div class="cert-card">
      <div class="cert-row">
        <span class="cert-label">Student Name</span>
        <span class="cert-value">${studentName}</span>
      </div>
      <div class="cert-row">
        <span class="cert-label">Student ID</span>
        <span class="cert-value">${studentId}</span>
      </div>
      <div class="cert-row">
        <span class="cert-label">Course</span>
        <span class="cert-value">${courseName}</span>
      </div>
      <div class="cert-row">
        <span class="cert-label">Grade</span>
        <span class="cert-value">${grade}</span>
      </div>
      <div class="cert-row">
        <span class="cert-label">Issued By</span>
        <span class="cert-value">${institutionName}</span>
      </div>
      <div class="cert-row">
        <span class="cert-label">Issue Date</span>
        <span class="cert-value">${dateStr}</span>
      </div>
    </div>

    <div class="cert-id">
      <span>Certificate ID (save this)</span>
      ${certId}
    </div>

    <a href="${verifyUrl}" class="btn">🔍 Verify My Certificate</a>
    ${ipfsUrl ? `<a href="${ipfsUrl}" class="ipfs-btn">📄 Download Certificate PDF (IPFS)</a>` : ""}

    <p class="text" style="font-size:13px; color:#94a3b8;">
      Share your Certificate ID or the verification link above with employers, universities,
      or anyone who needs to confirm your qualification. Verification is instant, free, and
      requires no account.
    </p>
  </div>
  <div class="footer">
    <p><strong>CertChain</strong> — Powered by Ethereum Blockchain</p>
    <p>This certificate is tamper-proof and permanently stored on-chain.</p>
    <p style="margin-top:12px; font-size:11px;">
      You are receiving this email because ${institutionName} issued a certificate to ${studentEmail}.
    </p>
  </div>
</div>
</body>
</html>`;
}

// ── Handler ──────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  setCORS(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "SendGrid not configured" });

  const {
    studentName, studentEmail, studentId,
    courseName, grade, certId,
    institutionName, issueDate, ipfsUrl,
  } = req.body || {};

  // Validate required fields
  const missing = ["studentName","studentEmail","certId","courseName","institutionName"]
    .filter(k => !req.body?.[k]);
  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
    return res.status(400).json({ error: "Invalid student email" });
  }

  sgMail.setApiKey(apiKey);

  const siteUrl = process.env.REACT_APP_SITE_URL || "https://certchain.vercel.app";
  const fromEmail = process.env.EMAIL_FROM      || "certificates@certchain.app";
  const fromName  = process.env.EMAIL_FROM_NAME || "CertChain Certificate Registry";

  const msg = {
    to:      studentEmail,
    from:    { email: fromEmail, name: fromName },
    subject: `Your ${courseName} Certificate — Blockchain Verified`,
    text:    `Congratulations ${studentName}! Your ${courseName} certificate from ${institutionName} has been issued on the blockchain. Certificate ID: ${certId}. Verify at: ${siteUrl}/verify/${certId}`,
    html:    buildHTML({ studentName, studentEmail, studentId, courseName, grade,
                         certId, institutionName, issueDate, ipfsUrl, siteUrl }),
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Email sent to ${studentEmail} for cert ${certId.slice(0,10)}...`);
    return res.status(200).json({ success: true, to: studentEmail });
  } catch (err) {
    console.error("SendGrid error:", err?.response?.body || err.message);
    return res.status(500).json({ error: "Failed to send email", detail: err.message });
  }
};
