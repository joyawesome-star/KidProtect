import crypto from 'crypto';

/**
 * WhatsApp Cloud API helper module.
 * Supports sending outbound template messages and verifying webhook signatures.
 */

const GRAPH_BASE = 'https://graph.facebook.com';

/**
 * Resolve the Graph API version.
 * Defaults to v21.0 if not provided.
 */
function apiVersion() {
  return process.env.WHATSAPP_API_VERSION || 'v21.0';
}

/**
 * Send a WhatsApp text/template message via the Cloud API.
 *
 * @param {object} params
 * @param {string} params.to          - Recipient phone number in E.164 format (e.g. +919876543210)
 * @param {string} [params.text]      - Raw text body (only for template-free sends; requires a
 *                                       business who can use the free-form message API)
 * @param {object} [params.template]  - Template object: { name, language: { code }, components? }
 * @returns {Promise<{ok: boolean, data?: any, error?: string}>}
 */
export async function sendWhatsAppMessage({ to, text, template }) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return {
      ok: false,
      error: 'WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not configured.',
    };
  }

  const body = {};
  if (template) {
    body.messaging_product = 'whatsapp';
    body.to = to;
    body.type = 'template';
    body.template = template;
  } else {
    body.messaging_product = 'whatsapp';
    body.to = to;
    body.type = 'text';
    body.text = { body: text };
  }

  try {
    const res = await fetch(
      `${GRAPH_BASE}/${apiVersion()}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: JSON.stringify(data), data };
    }

    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Verify the signature of an incoming webhook POST request.
 * Uses the App Secret (WHATSAPP_APP_SECRET) to compute an HMAC-SHA256
 * of the raw request body and compare it against the X-Hub-Signature-256 header.
 *
 * @param {string} signature - The `x-hub-signature-256` header value.
 * @param {string} rawBody   - The raw request body string.
 * @returns {boolean} - true if valid, false otherwise.
 */
export function verifyWebhookSignature(signature, rawBody) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret || !signature) return false;

  const expected = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  // Signature header is formatted as `sha256=<hex>`
  const provided = signature.replace(/^sha256=/, '');

  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(provided, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Verify the webhook subscription handshake (GET request from Meta).
 *
 * @param {URLSearchParams} params - The query params: mode, verify_token, challenge.
 * @returns {{valid: boolean, challenge?: string}} - whether the handshake is valid.
 */
export function verifyWebhookHandshake(params) {
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === expectedToken && challenge) {
    return { valid: true, challenge };
  }

  return { valid: false };
}
