import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookHandshake, verifyWebhookSignature } from '@/lib/whatsapp';

// Mark route as dynamic so it always runs at request time.
export const dynamic = 'force-dynamic';

/**
 * GET /api/whatsapp/webhook
 * Meta's webhook verification handshake.
 * When you subscribe to a webhook in the Meta dashboard, Meta sends a GET
 * request with `hub.mode`, `hub.verify_token`, and `hub.challenge`. If the
 * verify token matches, we echo back the challenge to confirm the endpoint.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const result = verifyWebhookHandshake(searchParams);

  if (!result.valid) {
    return new NextResponse('Verification failed: invalid token or mode.', { status: 403 });
  }

  // Meta expects the challenge echoed back as a plain text response.
  return new NextResponse(result.challenge, { status: 200 });
}

/**
 * POST /api/whatsapp/webhook
 * Receive incoming events from Meta (messages, delivery notifications, etc.).
 * For outbound-only usage we mainly need to acknowledge the event promptly.
 * We optionally update `attendance_logs.whatsapp_status` based on delivery
 * status callbacks (sent / delivered / read / failed).
 *
 * Always respond with 200 quickly so Meta does not retry repeatedly.
 */
export async function POST(request) {
  // 1. Read the raw body for signature verification.
  const rawBody = await request.text();

  // 2. Verify the incoming signature using the app secret (if configured).
  const signature = request.headers.get('x-hub-signature-256');
  if (process.env.WHATSAPP_APP_SECRET) {
    const valid = verifyWebhookSignature(signature, rawBody);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  // 3. Parse the payload. If it fails, still respond 200 to stop retries.
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // 4. Process delivery status updates (best-effort, non-blocking).
  if (payload.entry && Array.isArray(payload.entry)) {
    for (const entry of payload.entry) {
      if (!entry.changes) continue;
      for (const change of entry.changes) {
        const value = change.value || {};
        const statuses = value.statuses || [];
        for (const status of statuses) {
          await updateDeliveryStatus(status);
        }
      }
    }
  }

  // Always acknowledge receipt.
  return NextResponse.json({ received: true }, { status: 200 });
}

/**
 * Update `attendance_logs.whatsapp_status` when Meta reports a delivery status.
 * The Cloud API includes `context.id` (the outgoing message id) in status
 * callbacks. We store the message id in `attendance_logs.whatsapp_message_id`
 * when sending, so we can match it back here.
 */
async function updateDeliveryStatus(status) {
  const messageId = status?.id;
  const statusType = status?.status; // 'sent' | 'delivered' | 'read' | 'failed'

  if (!messageId || !statusType) return;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const statusMap = {
      sent: 'sent',
      delivered: 'delivered',
      read: 'read',
      failed: 'failed',
    };

    await supabase
      .from('attendance_logs')
      .update({ whatsapp_status: statusMap[statusType] || statusType })
      .eq('whatsapp_message_id', messageId);
  } catch (err) {
    console.error('Failed to update delivery status:', err);
  }
}
