# WhatsApp Cloud API Webhook Integration

## Goal
Connect the KidShield app to WhatsApp Cloud API for sending attendance notifications to parents (outbound only), and set up the required webhook for Meta.

## Steps
- [x] Create `lib/whatsapp.js` shared helper (Graph API send + signature verification)
- [x] Create `app/api/whatsapp/webhook/route.js` (GET verification + POST event receiver)
- [x] Update `app/api/whatsapp-notify/route.js` to use real Graph API sends
- [x] Update `.env.local` with WhatsApp configuration vars
- [x] Verify build/dev server runs without errors

## Build Result
- `npm run build` succeeds (Compiled successfully in 9.0s, TypeScript passed)
- New routes registered: `/api/whatsapp-notify` and `/api/whatsapp/webhook` (both dynamic)

## Notes / Findings
- Static template `kidshield_welcome_v1` created via API → status `PENDING` (will approve).
- Variable-based templates created via API get auto-rejected with `INVALID_FORMAT`. These must be created via the **Meta dashboard** visual editor instead.
- `WHATSAPP_TEMPLATE_HAS_PARAMS` controls whether body parameters are sent (true for variable templates, false for static).
