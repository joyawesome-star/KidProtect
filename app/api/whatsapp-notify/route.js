import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { batchData, logIds } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const messagePromises = batchData.map(async (student, index) => {
      // Ensure we have a matching log ID for the database update
      const logId = logIds && logIds[index] ? logIds[index].id : null;
      let deliveryStatus = 'failed';
      let messageId = null;

      try {
        // ==============================================================
        // WHATSAPP CLOUD API (REAL SEND)
        // ==============================================================
        // configuration flag to allow graceful fallback to mock simulation
        const useWhatsApp = process.env.WHATSAPP_ENABLED === 'true';

        if (useWhatsApp && process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
          // Send a template message (business-initiated messages require an
          // approved template). Replace the template name with your approved one.
          //
          // If the template has variables (WHATSAPP_TEMPLATE_HAS_PARAMS=true),
          // we pass body parameters. Static templates (no variables) must be
          // sent WITHOUT the components array, otherwise Meta rejects it.
          const template = {
            name: process.env.WHATSAPP_TEMPLATE_NAME || 'attendance_notification',
            language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' },
          };

          if (process.env.WHATSAPP_TEMPLATE_HAS_PARAMS === 'true') {
            template.components = [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: student.child_name || 'Student' },
                  { type: 'text', text: student.grade || '' },
                  { type: 'text', text: student.time_scanned || '' },
                  { type: 'text', text: student.date_scanned || '' },
                ],
              },
            ];
          }

          const result = await sendWhatsAppMessage({
            to: student.contact_phone,
            template,
          });

          if (result.ok) {
            deliveryStatus = 'sent';
            messageId = result.data?.messages?.[0]?.id || null;
          } else {
            console.error(`WhatsApp send failed for ${student.contact_phone}:`, result.error);
            deliveryStatus = 'failed';
          }
        } else {
          // Simulating network delay of 500ms to test performance
          await new Promise(resolve => setTimeout(resolve, 500));
          // Simulating a successful send
          deliveryStatus = 'success';
        }
        // ==============================================================

      } catch (err) {
        console.error(`Message failed for ${student.contact_phone}:`, err);
        deliveryStatus = 'failed';
      }

      // Update the exact row in attendance_logs with success/failure
      if (logId) {
        const updateData = { whatsapp_status: deliveryStatus };
        if (messageId) updateData.whatsapp_message_id = messageId;

        await supabase
          .from('attendance_logs')
          .update(updateData)
          .eq('id', logId);
      }

      return { phone: student.contact_phone, status: deliveryStatus };
    });

    // Wait for all promises to resolve without crashing the loop
    const results = await Promise.allSettled(messagePromises);

const successCount = results.filter(
      r => r.status === 'fulfilled' && (r.value.status === 'success' || r.value.status === 'sent')
    ).length;

    return NextResponse.json({
      success: true,
      successCount,
      total: batchData.length,
      mode: (process.env.WHATSAPP_ENABLED === 'true') ? 'live' : 'mock',
    }, { status: 200 });

  } catch (error) {
    console.error("Critical API Route Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
