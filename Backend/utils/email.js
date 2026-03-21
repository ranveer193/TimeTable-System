const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM    = 'onboarding@resend.dev';
const SYSTEM  = 'Timetable System';
const APP_URL = process.env.FRONTEND_URL || '';

// ─── Shared HTML shell ────────────────────────────────────────────────────────
const buildHtml = (body) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#3b82f6,#2563eb);padding:32px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">✅ Account Approved</h1>
    <p style="color:#bfdbfe;margin-top:8px;font-size:14px;">${SYSTEM}</p>
  </div>
  <div style="background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
    ${body}
    <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
      If you didn't register, please contact your administrator.
    </p>
  </div>
</div>`;

// ─── sendApprovalEmail ────────────────────────────────────────────────────────
exports.sendApprovalEmail = async ({ name, email, role, department }) => {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not set — skipping approval email');
    return;
  }

  const deptRow = department && department !== 'NONE'
    ? `<p style="margin:4px 0;color:#1e293b;font-size:14px;">Department: <strong>${department}</strong></p>`
    : '';

  const body = `
    <p style="font-size:16px;color:#1e293b;">Hi <strong>${name}</strong>,</p>
    <p style="color:#475569;line-height:1.6;">
      Your account has been <strong style="color:#059669;">approved</strong>.
      You can now log in to the system.
    </p>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;">
        Account Details
      </p>
      <p style="margin:4px 0;color:#1e293b;font-size:14px;">Role: <strong>${role.replace(/_/g, ' ')}</strong></p>
      ${deptRow}
    </div>
    <a href="${APP_URL}/login"
       style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">
      Login Now →
    </a>`;

  const { data, error } = await resend.emails.send({
    from:    `${SYSTEM} <${FROM}>`,
    to:      email,
    subject: 'Your Account Has Been Approved',
    html:    buildHtml(body),
  });

  if (error) throw new Error(`[Email] Resend error: ${error.message}`);
  console.log(`[Email] Approval sent → ${email} (id: ${data.id})`);
  return data;
};