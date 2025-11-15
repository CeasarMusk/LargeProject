// src/lib/sendgrid.js
require('dotenv').config();
const sgMail = require('@sendgrid/mail');

let _configured = false;

function ensureConfigured() {
  if (_configured) return true;
  const key = process.env.SENDGRID_API_KEY || '';
  if (!key) return false;
  sgMail.setApiKey(key);
  _configured = true;
  return true;
}

// Convert HTML to text fallback
function toText(html = '') {
  return String(html).replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Send an HTML email via SendGrid.
 * Accepts EITHER:
 *   sendMail(to, subject, html, from, fromName)
 * OR object:
 *   sendMail({ to, subject, html, from, fromName })
 *
 * Returns { ok: 1|0, status?: number, error?: string }
 */
async function sendMail(toOrObj, subject, html, from, fromName) {
  try {
    if (!ensureConfigured()) {
      console.log("SendGrid: SENDGRID_API_KEY missing");
      return { ok: 0, error: 'SENDGRID_API_KEY not set' };
    }

    let to, subj, bodyHtml, fromEmail, fromNameFinal;

    if (toOrObj && typeof toOrObj === 'object' && !Array.isArray(toOrObj)) {
      ({ to, subject: subj, html: bodyHtml, from: fromEmail, fromName: fromNameFinal } = toOrObj);
    } else {
      to = toOrObj;
      subj = subject;
      bodyHtml = html;
      fromEmail = from;
      fromNameFinal = fromName;
    }

    const msg = {
      to,
      from: {
        email: fromEmail || process.env.FROM_EMAIL || 'noreply@example.com',
        name: fromNameFinal || process.env.FROM_NAME || 'Budget Manager'
      },
      subject: subj,
      html: bodyHtml,
      text: toText(bodyHtml)
    };

    // Debug output so you can see what is being sent
    console.log("SendGrid: Sending email...", JSON.stringify({ to, subj, from: msg.from }, null, 2));

    // ACTUAL SENDGRID CALL - THIS WAS MISSING IN YOUR CODE
    const [resp] = await sgMail.send(msg);

    console.log("SendGrid response:", resp.statusCode);

    const ok = resp.statusCode >= 200 && resp.statusCode < 300;

    return {
      ok: ok ? 1 : 0,
      status: resp.statusCode,
      error: ok ? '' : `status=${resp.statusCode}`
    };

  } catch (e) {
    const sgErr = e?.response?.body ? JSON.stringify(e.response.body) : e.message;

    console.log("SendGrid ERROR:", sgErr);

    return { ok: 0, error: sgErr };
  }
}

module.exports = { sendMail };
