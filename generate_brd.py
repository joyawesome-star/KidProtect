"""
KidShield v2.0 - Business Requirement Document (BRD) Generator
Generates a professional PDF BRD for the KidShield school safety &
attendance ecosystem.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    ListFlowable, ListItem, HRFlowable, KeepTogether
)
from datetime import date

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
OUTPUT_FILE = "KidShield_Business_Requirement_Document.pdf"

BRAND_EMERALD = colors.HexColor("#10B981")
BRAND_DARK = colors.HexColor("#020617")
BRAND_SLATE = colors.HexColor("#0F172A")
ACCENT_BLUE = colors.HexColor("#3B82F6")
ACCENT_AMBER = colors.HexColor("#F59E0B")
ACCENT_RED = colors.HexColor("#EF4444")
LIGHT_BG = colors.HexColor("#F1F5F9")
LIGHT_EMERALD = colors.HexColor("#ECFDF5")

styles = getSampleStyleSheet()

# ---------------------------------------------------------------------------
# Custom styles
# ---------------------------------------------------------------------------
st_title = ParagraphStyle(
    "BRDTitle", parent=styles["Title"], fontSize=28, leading=34,
    textColor=colors.white, fontName="Helvetica-Bold", alignment=TA_LEFT
)
st_subtitle = ParagraphStyle(
    "BRDSubtitle", parent=styles["Normal"], fontSize=13, leading=18,
    textColor=colors.HexColor("#A7F3D0"), fontName="Helvetica"
)
st_h1 = ParagraphStyle(
    "BRDH1", parent=styles["Heading1"], fontSize=18, leading=24,
    textColor=BRAND_DARK, fontName="Helvetica-Bold", spaceAfter=6,
    spaceBefore=14
)
st_h2 = ParagraphStyle(
    "BRDH2", parent=styles["Heading2"], fontSize=13.5, leading=18,
    textColor=BRAND_EMERALD, fontName="Helvetica-Bold", spaceAfter=4,
    spaceBefore=10
)
st_h3 = ParagraphStyle(
    "BRDH3", parent=styles["Heading3"], fontSize=11.5, leading=15,
    textColor=BRAND_SLATE, fontName="Helvetica-Bold", spaceAfter=3,
    spaceBefore=6
)
st_body = ParagraphStyle(
    "BRDBody", parent=styles["Normal"], fontSize=9.8, leading=14.5,
    textColor=colors.HexColor("#1E293B"), fontName="Helvetica",
    alignment=TA_JUSTIFY, spaceAfter=5
)
st_bullet = ParagraphStyle(
    "BRDBullet", parent=st_body, leftIndent=12, bulletIndent=2,
    alignment=TA_LEFT
)
st_small = ParagraphStyle(
    "BRDSmall", parent=st_body, fontSize=8.5, leading=12,
    textColor=colors.HexColor("#475569")
)
st_cell = ParagraphStyle(
    "BRDCell", parent=st_body, fontSize=8.8, leading=12.5,
    alignment=TA_LEFT, spaceAfter=0
)
st_cell_bold = ParagraphStyle(
    "BRDCellBold", parent=st_cell, fontName="Helvetica-Bold"
)
st_cell_white = ParagraphStyle(
    "BRDCellWhite", parent=st_cell, textColor=colors.white,
    fontName="Helvetica-Bold"
)
st_footer = ParagraphStyle(
    "BRDFooter", parent=styles["Normal"], fontSize=7.5, leading=10,
    textColor=colors.HexColor("#64748B"), alignment=TA_CENTER
)
st_meta_label = ParagraphStyle(
    "BRDMetaLabel", parent=st_cell, fontName="Helvetica-Bold",
    textColor=colors.HexColor("#64748B")
)
st_meta_value = ParagraphStyle(
    "BRDMetaValue", parent=st_cell, fontName="Helvetica"
)

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------
def bullets(items, style=st_bullet):
    """Return a ListFlowable of bullet items."""
    return ListFlowable(
        [ListItem(Paragraph(t, style), leftIndent=14, value="•") for t in items],
        bulletType="bullet", start="•", leftIndent=10, spaceBefore=2, spaceAfter=6
    )

def numbered(items, style=st_body):
    """Return a numbered list."""
    return ListFlowable(
        [ListItem(Paragraph(t, style), leftIndent=16) for t in items],
        bulletType="1", leftIndent=14, spaceBefore=2, spaceAfter=6
    )

def make_table(header, rows, col_widths=None):
    """Build a styled table with a dark header row."""
    data = [[Paragraph(h, st_cell_white) for h in header]]
    for r in rows:
        data.append([Paragraph(str(c), st_cell) for c in r])
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_DARK),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t

def info_box(title, body_text, bg=LIGHT_EMERALD, border=BRAND_EMERALD):
    """A highlighted information box."""
    p_title = Paragraph(f"<b>{title}</b>", ParagraphStyle(
        "boxTitle", parent=st_body, fontName="Helvetica-Bold",
        textColor=BRAND_DARK, spaceAfter=3
    ))
    p_body = Paragraph(body_text, st_body)
    t = Table([[p_title], [p_body]], colWidths=[170 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 1, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t

# ---------------------------------------------------------------------------
# Document header / footer with page numbers
# ---------------------------------------------------------------------------
def on_page(canvas, doc):
    canvas.saveState()
    # Top band
    canvas.setFillColor(BRAND_DARK)
    canvas.rect(0, A4[1] - 14 * mm, A4[0], 14 * mm, fill=1, stroke=0)
    canvas.setFillColor(BRAND_EMERALD)
    canvas.rect(0, A4[1] - 14 * mm, 4 * mm, 14 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(10 * mm, A4[1] - 9.5 * mm, "KidShield v2.0  |  Business Requirement Document")
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(colors.HexColor("#A7F3D0"))
    canvas.drawRightString(A4[0] - 10 * mm, A4[1] - 9.5 * mm, "CONFIDENTIAL")
    # Footer
    canvas.setFillColor(BRAND_SLATE)
    canvas.rect(0, 0, A4[0], 10 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#94A3B8"))
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(10 * mm, 4 * mm, "© 2025 KidShield Technologies — All Rights Reserved")
    canvas.drawRightString(A4[0] - 10 * mm, 4 * mm, f"Page {doc.page}")
    canvas.restoreState()

# ---------------------------------------------------------------------------
# Build document
# ---------------------------------------------------------------------------
def build():
    doc = SimpleDocTemplate(
        OUTPUT_FILE, pagesize=A4,
        leftMargin=15 * mm, rightMargin=15 * mm,
        topMargin=20 * mm, bottomMargin=16 * mm,
        title="KidShield v2.0 Business Requirement Document",
        author="KidShield Technologies",
        subject="Business Requirements for the KidShield School Safety & Attendance Ecosystem"
    )

    story = []

    # =========================================================
    # COVER PAGE
    # =========================================================
    cover_bg = Table([[""]], colWidths=[180 * mm], rowHeights=[250 * mm])
    cover_bg.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BRAND_DARK),
        ("LINEBEFORE", (0, 0), (0, 0), 4, BRAND_EMERALD),
    ]))

    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph("🛡️  KIDSHIELD", st_title))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph("The Next-Generation School Safety & High-Speed Attendance Ecosystem", st_subtitle))
    story.append(Spacer(1, 1 * mm))
    story.append(Paragraph("Secure Access Gateway for Student Safety  •  Powered by Eastern Automations", ParagraphStyle(
        "coverBrand", parent=st_subtitle, fontSize=10.5, leading=15,
        textColor=colors.HexColor("#93C5FD")
    )))
    story.append(Spacer(1, 4 * mm))
    story.append(HRFlowable(width="100%", thickness=2, color=BRAND_EMERALD, spaceAfter=8))
    story.append(Paragraph("Business Requirement Document (BRD)", ParagraphStyle(
        "coverDocTitle", parent=st_title, fontSize=20, leading=26,
        textColor=colors.HexColor("#A7F3D0")
    )))
    story.append(Spacer(1, 6 * mm))

    # Cover meta table
    today = date.today().strftime("%d %B %Y")
    cover_meta_rows = [
        ["Document Title", "KidShield v2.0 — Business Requirement Document"],
        ["Version", "1.1 (Aligned with Deployed Live Site)"],
        ["Document Owner", "Product Management, KidShield Technologies"],
        ["Document Status", "Approved for Stakeholder Review"],
        ["Date", today],
        ["Classification", "Confidential"],
    ]
    cm = Table(
        [[Paragraph(f"<b>{k}</b>", st_meta_label), Paragraph(v, st_meta_value)]
         for k, v in cover_meta_rows],
        colWidths=[45 * mm, 130 * mm]
    )
    cm.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#0F172A")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#334155")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(cm)
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph(
        "Prepared for: School Administrators, Principals, Teachers, Parents/Guardians, "
        "and KidShield Internal Technology Teams.",
        st_body
    ))
    story.append(PageBreak())

    # =========================================================
    # TABLE OF CONTENTS (static)
    # =========================================================
    story.append(Paragraph("Table of Contents", st_h1))
    toc = [
        "1.  Executive Summary",
        "2.  Project Background & Business Context",
        "3.  Business Objectives & Success Metrics",
        "4.  Stakeholders & User Roles",
        "5.  Scope of the System",
        "6.  Functional Requirements",
        "7.  Non-Functional Requirements",
        "8.  Business Process Flows",
        "9.  Data Requirements & Data Privacy",
        "10. Technology Stack",
        "11. Assumptions, Dependencies & Constraints",
        "12. Risks & Mitigation Strategies",
        "13. Release Phases & Implementation Roadmap",
        "14. Key Performance Indicators (KPIs)",
        "15. Approval & Sign-off",
    ]
    story.append(ListFlowable(
        [ListItem(Paragraph(f"<b>{t}</b>", st_body), leftIndent=14) for t in toc],
        bulletType="1", leftIndent=14, spaceBefore=2, spaceAfter=4
    ))
    story.append(PageBreak())

    # =========================================================
    # 1. EXECUTIVE SUMMARY
    # =========================================================
    story.append(Paragraph("1. Executive Summary", st_h1))
    story.append(Paragraph(
        "KidShield v2.0 is a digital school-safety and attendance platform that replaces "
        "traditional paper-based roll calls and disconnected parent communication with a "
        "high-speed, QR-code-driven ecosystem. Each student is issued a cryptographically "
        "unique smart tag (QR code) affixed to their school bag. Scanning this tag with any "
        "smartphone instantly performs the intended action — recording attendance, routing a "
        "parent-teacher meeting request, identifying the owner of a lost item, or displaying "
        "emergency contact information to a good Samaritan.",
        st_body
    ))
    story.append(Paragraph(
        "The platform is delivered as a responsive, installable Next.js web application "
        "(Progressive Web App) comprising five role-based portals — Parent Portal, Staff/Teacher "
        "Hub, Principal Terminal, School Admin Command Center, and a restricted Overseer (HQ) "
        "console. The system is branded as a Secure Access Gateway for Student Safety and is "
        "powered by Eastern Automations. Data is persisted in a cloud-hosted Supabase "
        "(PostgreSQL) database with authentication and role-based access controls. The deployed "
        "production environment (kidshield-v2.vercel.app) adds PWA installability, real-time "
        "data synchronization on dashboards, and a system-status panel. This document specifies "
        "the business requirements governing the design, build, and acceptance of the system.",
        st_body
    ))

    # =========================================================
    # 2. PROJECT BACKGROUND
    # =========================================================
    story.append(Paragraph("2. Project Background & Business Context", st_h1))
    story.append(Paragraph(
        "Schools today face several operational pain points that directly affect child safety "
        "and institutional efficiency:",
        st_body
    ))
    story.append(bullets([
        "<b>Slow & error-prone attendance:</b> Manual roll calls consume 5–10 minutes per class "
        "and are prone to proxy marking and recording errors.",
        "<b>Delayed parent notification:</b> There is no real-time channel to inform parents "
        "when a child does not arrive at school or when an emergency occurs.",
        "<b>Inefficient parent-teacher communication:</b> Meeting invitations are paper-based, "
        "easily lost, and offer no delivery confirmation.",
        "<b>Lost belongings recovery:</b> Unlabeled school items are difficult to return to "
        "their owners, creating administrative burden.",
        "<b>Emergency data not accessible:</b> In an emergency, bystanders and first responders "
        "have no safe way to reach a child's parent or access critical medical information.",
    ]))
    story.append(Paragraph(
        "KidShield v2.0 addresses these challenges with a single, unified ecosystem built around "
        "a durable QR tag and a set of purpose-built web portals.",
        st_body
    ))

    # =========================================================
    # 3. BUSINESS OBJECTIVES
    # =========================================================
    story.append(Paragraph("3. Business Objectives & Success Metrics", st_h1))
    story.append(Paragraph("3.1 Strategic Objectives", st_h2))
    story.append(numbered([
        "Reduce daily attendance-taking time per class from ~8 minutes to under 60 seconds.",
        "Provide parents with near-real-time visibility and alerts regarding their child's "
        "school-day safety.",
        "Digitize and streamline parent-teacher meeting (PTM) invitation delivery with "
        "delivery confirmation (app push or WhatsApp fallback).",
        "Establish a campus-wide lost-and-found identification service using the same smart tag.",
        "Create an emergency-response layer that lets any bystander safely contact a child's "
        "parent when a tag is scanned.",
        "Equip school leadership (Principal & Admin) with live attendance analytics and "
        "alerting dashboards.",
    ]))

    story.append(Paragraph("3.2 Key Success Metrics", st_h2))
    kpi_rows = [
        ["Attendance processing time", "≤ 60 seconds per class", "Admin dashboard timers / logs"],
        ["Attendance accuracy", "≥ 99% (elimination of proxy marking)", "Reconciliation audits"],
        ["Notification delivery rate", "≥ 98% (app push + WhatsApp fallback)", "Meeting request logs"],
        ["Parent onboarding completion", "≥ 90% of enrolled students", "Registration records"],
        ["Tag activation turnaround", "Same-day activation", "Tag provisioning logs"],
        ["Lost item resolution time", "≤ 24 hours", "Lost & found logs"],
    ]
    story.append(make_table(
        ["Metric", "Target", "Measurement Source"], kpi_rows,
        col_widths=[55 * mm, 55 * mm, 65 * mm]
    ))

    # =========================================================
    # 4. STAKEHOLDERS & USER ROLES
    # =========================================================
    story.append(Paragraph("4. Stakeholders & User Roles", st_h1))
    story.append(Paragraph("4.1 Stakeholder Register", st_h2))
    stake_rows = [
        ["Parents / Guardians", "Register children, activate tags, receive alerts & PTM invites, view emergency profiles."],
        ["Teachers / Staff", "Take attendance, trigger PTM requests, manage lost & found, export attendance reports."],
        ["Principal / Campus Admin", "Monitor campus-wide attendance, review failed alerts, manage class sections, analytics, license renewal."],
        ["School Administrator (Admin)", "Manage staff assignments, view live campus analytics, emergency hub, export master CSV."],
        ["Overseer / HQ (Super Admin)", "Batch-generate tag batches, global fleet analytics, master database access (CRUD)."],
        ["Bystander / Good Samaritan", "Scan a lost child's tag to view safe contact actions (call / WhatsApp the parent)."],
        ["KidShield Product & Engineering", "Build, operate, and maintain the platform and tag supply chain."],
    ]
    story.append(make_table(
        ["Role", "Primary Business Responsibility"], stake_rows,
        col_widths=[45 * mm, 130 * mm]
    ))

    story.append(Paragraph("4.2 Role-Based Access Matrix", st_h2))
    access_rows = [
        ["Main Portal", "R", "R", "R", "R", "R"],
        ["Parent Registration", "W", "–", "–", "–", "–"],
        ["Take Attendance (QR scan)", "–", "W", "–", "–", "–"],
        ["PTM Request & Lost & Found", "–", "W", "R", "R", "–"],
        ["Attendance CSV Export", "–", "W", "R", "R", "–"],
        ["Live Analytics Overview", "–", "–", "R", "R", "R"],
        ["Staff Assignment", "–", "–", "–", "W", "R"],
        ["Emergency Hub", "–", "–", "R", "W", "R"],
        ["Tag Batch Generation", "–", "–", "–", "–", "W"],
        ["Fleet / Global Analytics", "–", "–", "–", "–", "R"],
        ["Master DB Vault (CRUD)", "–", "–", "–", "–", "W"],
    ]
    story.append(make_table(
        ["Capability", "Parent", "Teacher", "Principal", "Admin", "Overseer"],
        access_rows, col_widths=[62 * mm, 23 * mm, 23 * mm, 23 * mm, 23 * mm, 23 * mm]
    ))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(
        "<i>R = Read, W = Write/Execute, – = No Access.</i> The Overseer (HQ) console additionally "
        "requires Level-5 clearance authentication before any capability is exposed.",
        st_small
    ))

    # =========================================================
    # 5. SCOPE
    # =========================================================
    story.append(Paragraph("5. Scope of the System", st_h1))
    story.append(Paragraph("5.1 In-Scope", st_h2))
    story.append(bullets([
        "QR-based student smart tag lifecycle: batch generation, provisioning, activation, and archive.",
        "Parent self-registration portal with OTP phone verification and child profile creation.",
        "Teacher classroom command hub with batch QR scanning for attendance, PTM invites, and lost & found.",
        "WhatsApp / push-notification fallback routing for parent alerts.",
        "Principal terminal with class-wise attendance, failed-alert management, analytics, and system setup.",
        "Admin command center with live campus overview, staff assignment, and emergency hub.",
        "Overseer (HQ) console with restricted authentication, tag forging, fleet analytics, and DB vault.",
        "Bystander emergency scan page with verified child details and secure contact actions.",
        "Attendance CSV export for daily records.",
        "Public privacy policy page aligned with Indian data-protection law.",
    ]))
    story.append(Paragraph("5.2 Out-of-Scope (for v2.0)", st_h2))
    story.append(bullets([
        "Native mobile applications (current delivery is responsive web only).",
        "Hardware/embedded RFID readers; the v2.0 tag is a printed QR sticker.",
        "Billing, invoicing, and payment gateway integration.",
        "Multi-language localization.",
        "Offline (disconnected) mode; the system requires connectivity at scan time.",
    ]))

    # =========================================================
    # 6. FUNCTIONAL REQUIREMENTS
    # =========================================================
    story.append(Paragraph("6. Functional Requirements", st_h1))

    story.append(Paragraph("6.1 Main Portal (Landing / Secure Access Gateway)", st_h2))
    story.append(make_table(
        ["ID", "Requirement", "Priority"],
        [
            ["FR-01", "Landing page presents the KidShield brand logo with the tagline 'Secure Access Gateway for Student Safety'.", "Must"],
            ["FR-02", "Footer credits 'Powered by Eastern Automations'.", "Must"],
            ["FR-03", "Parent Portal card links to registration and advertises attendance, notices, and ranks.", "Must"],
            ["FR-04", "Staff Hub card links to the teacher console for attendance and class management.", "Must"],
            ["FR-05", "School Admin card links to the admin console for staff, students, and system management.", "Must"],
            ["FR-06", "Application is installable as a Progressive Web App (manifest.json + app icons).", "Must"],
        ],
        col_widths=[18 * mm, 120 * mm, 37 * mm]
    ))

    story.append(Paragraph("6.2 Parent Registration Portal (/register)", st_h2))
    story.append(make_table(
        ["ID", "Requirement", "Priority"],
        [
            ["FR-07", "Parent enters registered mobile number and requests an OTP verification code.", "Must"],
            ["FR-08", "System simulates OTP dispatch via SMS and advances to OTP entry step.", "Must"],
            ["FR-09", "Parent enters the 6-digit OTP; system verifies and unlocks the child registration form.", "Must"],
            ["FR-10", "Parent provides child's full name, school name, and blood group (mandatory safety fields).", "Must"],
            ["FR-11", "WhatsApp alert destination is pre-filled from the verified phone number and locked.", "Must"],
            ["FR-12", "On submit, system inserts the student record and provisions an active smart tag linked to the student.", "Must"],
            ["FR-13", "System displays a success acknowledgment screen confirming profile link and tag activation.", "Must"],
            ["FR-14", "Parent portal provides access to child attendance, school notices, and class ranks.", "Must"],
        ],
        col_widths=[18 * mm, 120 * mm, 37 * mm]
    ))

    story.append(Paragraph("6.3 Staff / Teacher Hub (/teacher)", st_h2))
    story.append(make_table(
        ["ID", "Requirement", "Priority"],
        [
            ["FR-15", "Teacher selects an operational mode: Take Attendance, Parents Meet Option, or Lost & Found System.", "Must"],
            ["FR-16", "System renders a live QR scanner (html5-qrcode) inside the selected mode.", "Must"],
            ["FR-17", "Each new tag scan is appended to the current batch; duplicate scans within a batch trigger an alert.", "Must"],
            ["FR-18", "Teacher executes batch processing; system writes attendance_logs rows per scanned tag.", "Must"],
            ["FR-19", "PTM mode: system looks up the tag, attempts KidShield-app push notification, then falls back to WhatsApp; result logged in meeting_requests.", "Must"],
            ["FR-20", "Lost & Found mode: system resolves the tag owner and logs a lost_found_logs entry to alert the parent.", "Must"],
            ["FR-21", "Teacher can export the day's attendance logs as a downloadable CSV file.", "Must"],
            ["FR-22", "Batch processing reports per-item progress and a final completion status.", "Should"],
        ],
        col_widths=[18 * mm, 120 * mm, 37 * mm]
    ))

    story.append(Paragraph("6.4 Principal Terminal (/principal/dashboard)", st_h2))
    story.append(make_table(
        ["ID", "Requirement", "Priority"],
        [
            ["FR-23", "Principal sees a live campus overview: today's attendance %, present/absent counts, total enrolled.", "Must"],
            ["FR-24", "Classrooms tab lists class sections with attendance and assigned class-teacher contact details.", "Must"],
            ["FR-25", "Failed Alerts tab surfaces delivery failures (e.g., invalid number) with a 'Ping Teacher' action.", "Must"],
            ["FR-26", "Analytics tab ranks low-attendance students (action required) and the campus honor roll.", "Must"],
            ["FR-27", "System Setup tab provides a batch-archive action for outgoing batches (e.g., graduating classes).", "Must"],
            ["FR-28", "License module displays the campus enterprise-license expiry and a renewal action.", "Should"],
        ],
        col_widths=[18 * mm, 120 * mm, 37 * mm]
    ))

    story.append(Paragraph("6.5 Admin Command Center (/admin)", st_h2))
    story.append(make_table(
        ["ID", "Requirement", "Priority"],
        [
            ["FR-29", "Overview tab shows total enrolled, present, absent, and WhatsApp delivery-rate metrics.", "Must"],
            ["FR-30", "Weekly attendance trend is visualized (bar chart simulation).", "Must"],
            ["FR-31", "Live entry feed lists recent tag scans with student name, class, and time.", "Must"],
            ["FR-32", "Staff Assignment tab manages class-teacher mapping and shows assignment status.", "Must"],
            ["FR-33", "Unassigned classes expose an 'Assign Staff' action.", "Must"],
            ["FR-34", "Emergency Hub provides local first-responder numbers and KidShield 24/7 support actions.", "Must"],
            ["FR-35", "'Export Master CSV' action is available from the header.", "Should"],
        ],
        col_widths=[18 * mm, 120 * mm, 37 * mm]
    ))

    story.append(Paragraph("6.6 Overseer HQ Console (/hq)", st_h2))
    story.append(make_table(
        ["ID", "Requirement", "Priority"],
        [
            ["FR-36", "Console is gated behind an Overseer login (HQ phone number + secure PIN).", "Must"],
            ["FR-37", "Invalid credentials produce an 'ACCESS DENIED' message and reset the passcode field.", "Must"],
            ["FR-38", "'The QR Forge' generates a batch of tags (default 500) with quantity and target-campus inputs.", "Must"],
            ["FR-39", "'Fleet Manager' displays global active-tag and hardware deployment analytics.", "Must"],
            ["FR-40", "'The Vault' exposes master database CRUD access (Supabase connection placeholder in MVP).", "Must"],
            ["FR-41", "Session can be explicitly locked out by the Overseer.", "Must"],
        ],
        col_widths=[18 * mm, 120 * mm, 37 * mm]
    ))

    story.append(Paragraph("6.7 Bystander Emergency Scan (/scan/[id])", st_h2))
    story.append(make_table(
        ["ID", "Requirement", "Priority"],
        [
            ["FR-42", "Scanning a tag URL resolves the tag UUID and loads the linked student profile.", "Must"],
            ["FR-43", "System validates tag validity/activity and shows a clear failure state for invalid tags.", "Must"],
            ["FR-44", "Verified view displays the child's name, school, and blood group without exposing the parent's number.", "Must"],
            ["FR-45", "Bystander can call the parent directly via a 'Call Parent Now' action.", "Must"],
            ["FR-46", "Bystander can message the parent via a pre-filled WhatsApp chat action.", "Must"],
        ],
        col_widths=[18 * mm, 120 * mm, 37 * mm]
    ))

    story.append(Paragraph("6.8 Privacy Policy (/privacy)", st_h2))
    story.append(make_table(
        ["ID", "Requirement", "Priority"],
        [
            ["FR-47", "Public privacy policy covers information collected, usage, sharing, security, retention, and user rights.", "Must"],
            ["FR-48", "Policy documents compliance with the IT Act, 2000; IT (SPDI) Rules, 2011; and DPDP Act, 2023.", "Must"],
            ["FR-49", "Policy discloses Grievance Officer contact and 48-hour acknowledgment / 30-day redressal commitment.", "Must"],
        ],
        col_widths=[18 * mm, 120 * mm, 37 * mm]
    ))

    # =========================================================
    # 7. NON-FUNCTIONAL REQUIREMENTS
    # =========================================================
    story.append(Paragraph("7. Non-Functional Requirements", st_h1))
    story.append(make_table(
        ["Category", "Requirement"],
        [
            ["Performance", "Dev server ready in ~1.1 s (Turbopack). Page loads under 2 s on broadband; scanner initializes within 1 s of mode selection."],
            ["Scalability", "System shall support up to 2,000 enrolled students per campus with room to scale across multiple campuses (global fleet)."],
            ["Security", "HTTPS/TLS transmission; role-based access control; Overseer console requires clearance-level authentication; least-privilege database access."],
            ["Reliability", "WhatsApp fallback ensures notification delivery when app push is unavailable; batch processing is resilient to per-item errors."],
            ["Compatibility", "Responsive UI on desktop, tablet, and mobile; QR scanning requires a camera-equipped device with a modern browser."],
            ["Usability", "Role portals are intuitive with clear labels, status feedback, and progress indicators for long-running operations."],
            ["Accessibility", "High-contrast color schemes, semantic markup, and keyboard-navigable controls across portals."],
            ["Maintainability", "Componentized React/Next.js codebase with a centralized Supabase client and mock-data boundaries for MVP."],
            ["Compliance", "Alignment with the Indian IT Act, IT (SPDI) Rules 2011, DPDP Act 2023, and child-privacy principles (COPPA)."],
        ],
        col_widths=[30 * mm, 145 * mm]
    ))

    # =========================================================
    # 8. BUSINESS PROCESS FLOWS
    # =========================================================
    story.append(Paragraph("8. Business Process Flows", st_h1))

    story.append(Paragraph("8.1 Parent Onboarding Flow", st_h2))
    story.append(numbered([
        "Parent navigates to /register and enters their registered mobile number.",
        "System dispatches a verification OTP (simulated via SMS).",
        "Parent enters the 6-digit OTP; the system verifies and unlocks the child profile form.",
        "Parent submits the child's full name, school, and blood group; WhatsApp number is auto-locked.",
        "System creates the student record and provisions an active tag in the database.",
        "Parent receives an activation success screen; the physical tag is now live for scanning.",
    ]))

    story.append(Paragraph("8.2 Daily Attendance Flow", st_h2))
    story.append(numbered([
        "Teacher opens the Staff Hub and selects 'Take Attendance'.",
        "Teacher batch-scans each student's bag tag with the in-app QR scanner.",
        "Each unique tag appends to the batch; duplicate scans are flagged.",
        "Teacher presses 'Process N Scans'; each tag is written to attendance_logs.",
        "CSV export is available for the day's records; Admin/Principal dashboards reflect live metrics.",
    ]))

    story.append(Paragraph("8.3 Parent-Teacher Meeting Invite Flow", st_h2))
    story.append(numbered([
        "Teacher selects 'Parents Meet Option' and batch-scans target student tags.",
        "System resolves each tag to the linked student and parent contact.",
        "Attempt 1 — push notification to the KidShield parent app (if installed).",
        "Attempt 2 — fallback WhatsApp message to the parent's verified number.",
        "Delivery outcome is recorded in meeting_requests for tracking.",
    ]))

    story.append(Paragraph("8.4 Emergency / Lost-Item Flow", st_h2))
    story.append(numbered([
        "A bystander scans the QR sticker on a lost bag or a child in distress.",
        "System validates the tag and displays the verified child profile (name, school, blood group).",
        "The bystander taps 'Call Parent Now' or 'Message via WhatsApp'.",
        "The parent is contacted using the verified contact number; the parent's number is never displayed publicly.",
    ]))

    story.append(Paragraph("8.5 Tag Provisioning Flow (Overseer)", st_h2))
    story.append(numbered([
        "Overseer logs in to /hq with Level-5 clearance credentials.",
        "Overseer opens 'The QR Forge' and specifies quantity and target campus.",
        "System generates the batch of cryptographic tag URLs and logs them securely.",
        "Physical stickers are manufactured from the batch and distributed to campuses.",
        "Parents activate individual tags during registration; retired batches can be archived by the Principal.",
    ]))

    # =========================================================
    # 9. DATA REQUIREMENTS & PRIVACY
    # =========================================================
    story.append(Paragraph("9. Data Requirements & Data Privacy", st_h1))
    story.append(Paragraph(
        "The system relies on a Supabase (PostgreSQL) backend with the following primary data "
        "entities: <b>students</b>, <b>schools</b>, <b>tags</b>, <b>attendance_logs</b>, "
        "<b>meeting_requests</b>, and <b>lost_found_logs</b>.",
        st_body
    ))
    data_rows = [
        ["students", "id, name, school_id, class_section, blood_group, parent_whatsapp, has_parent_app, app_device_token"],
        ["schools", "id, name"],
        ["tags", "uuid, student_id, status"],
        ["attendance_logs", "tag_uuid, created_at"],
        ["meeting_requests", "tag_uuid, status"],
        ["lost_found_logs", "tag_uuid, created_at"],
    ]
    story.append(make_table(
        ["Entity", "Key Attributes"], data_rows,
        col_widths=[40 * mm, 135 * mm]
    ))
    story.append(Spacer(1, 2 * mm))
    story.append(info_box(
        "Data Privacy & Protection",
        "Child blood-group data is treated as Sensitive Personal Data or Information (SPDI) under the "
        "IT (SPDI) Rules, 2011, and is processed only with explicit parental consent. Parent phone numbers "
        "are never publicly displayed on scan pages — bystanders contact parents only through the secure "
        "in-app call/WhatsApp actions. Camera footage from QR scanning is processed locally in the browser "
        "and is never transmitted or stored by KidShield."
    ))

    # =========================================================
    # 10. TECHNOLOGY STACK
    # =========================================================
    story.append(Paragraph("10. Technology Stack", st_h1))
    tech_rows = [
        ["Frontend", "Next.js 16 (App Router), React 19, Tailwind CSS 4"],
        ["PWA / Installability", "Web App Manifest (manifest.json), theme-color, app icons (icon-192/512), apple-touch-icon"],
        ["QR Scanning", "html5-qrcode"],
        ["Backend / Database", "Supabase (PostgreSQL + Auth) via @supabase/supabase-js"],
        ["Language", "JavaScript (ES2020+), TypeScript configuration present"],
        ["Linting", "ESLint 9 with eslint-config-next"],
        ["Build / Bundler", "Turbopack (Next.js 16) for development; next build for production"],
        ["Deployment Target", "Vercel — production live at https://kidshield-v2.vercel.app"],
        ["Environment", "Node.js ≥ 20, .env.local for NEXT_PUBLIC_SUPABASE_URL / ANON_KEY"],
    ]
    story.append(make_table(
        ["Layer", "Technology"], tech_rows,
        col_widths=[40 * mm, 135 * mm]
    ))

    # =========================================================
    # 11. ASSUMPTIONS, DEPENDENCIES, CONSTRAINTS
    # =========================================================
    story.append(Paragraph("11. Assumptions, Dependencies & Constraints", st_h1))
    story.append(Paragraph("11.1 Assumptions", st_h2))
    story.append(bullets([
        "Every enrolled student is issued exactly one physical QR smart tag.",
        "Parents own a smartphone with a modern browser (and WhatsApp for fallback alerts).",
        "Schools have reliable internet connectivity at scan points.",
        "The MVP may use simulated external integrations (SMS OTP, WhatsApp gateway, push) that are stubbed in the front end.",
    ]))
    story.append(Paragraph("11.2 Dependencies", st_h2))
    story.append(bullets([
        "A configured Supabase project with the required tables, RLS policies, and anon key.",
        "Third-party notification gateways (WhatsApp Business API / Meta, Twilio) for production alerting.",
        "Camera permissions granted by end users in the browser for QR scanning.",
    ]))
    story.append(Paragraph("11.3 Constraints", st_h2))
    story.append(bullets([
        "v2.0 is web-only; no native mobile apps or offline mode.",
        "The Overseer database vault currently depends on a future Supabase connection.",
        "Simulated integrations must be replaced with real gateways before broad production rollout.",
    ]))

    # =========================================================
    # 12. RISKS & MITIGATION
    # =========================================================
    story.append(Paragraph("12. Risks & Mitigation Strategies", st_h1))
    risk_rows = [
        ["Duplicate or fraudulent tag scans", "Medium", "Duplicate detection in scanner; per-batch state; tag status lifecycle (active/archived)."],
        ["Notification delivery failure", "Medium", "Waterfall routing: app push → WhatsApp fallback → logged failure surfaced to Principal."],
        ["SPDI data exposure (blood group)", "High", "Explicit consent; never display parent numbers; encrypted transport; role-based access."],
        ["Camera permission / hardware issues", "Medium", "Graceful scanner cleanup; clear UI feedback; manual fallback entry planned."],
        ["Supabase connectivity outages", "Medium", "Per-item error resilience in batch processing; clear error messages."],
        ["Unauthorized HQ access", "High", "Level-5 clearance login gate; session lock-out; audit logging of IP."],
    ]
    story.append(make_table(
        ["Risk", "Severity", "Mitigation"], risk_rows,
        col_widths=[45 * mm, 22 * mm, 108 * mm]
    ))

    # =========================================================
    # 13. RELEASE PHASES
    # =========================================================
    story.append(Paragraph("13. Release Phases & Implementation Roadmap", st_h1))
    phase_rows = [
        ["Phase 1 — MVP (current)", "Deployed live at kidshield-v2.vercel.app; PWA installability, Eastern Automations branding, redesigned portals, phone+PIN HQ auth, real-time dashboard sync, system-status panel.", "Live"],
        ["Phase 2 — Pilot", "Single-campus pilot; real WhatsApp gateway; principal & admin dashboards connected to live data.", "Next"],
        ["Phase 3 — Production", "Full notification stack (SMS, push, WhatsApp); Overseer vault connected; audit & compliance hardening.", "Planned"],
        ["Phase 4 — Scale", "Multi-campus fleet analytics; native mobile apps; offline scanning mode; localization.", "Future"],
    ]
    story.append(make_table(
        ["Phase", "Scope", "Status"], phase_rows,
        col_widths=[40 * mm, 110 * mm, 25 * mm]
    ))

    # =========================================================
    # 14. KPIs
    # =========================================================
    story.append(Paragraph("14. Key Performance Indicators (KPIs)", st_h1))
    kpi2_rows = [
        ["Average attendance-processing time per class", "< 60 seconds"],
        ["Attendance accuracy", "≥ 99%"],
        ["PTM notification delivery rate", "≥ 98%"],
        ["Parent onboarding completion", "≥ 90% of enrolled students"],
        ["Lost-item resolution time", "≤ 24 hours"],
        ["System uptime", "≥ 99.5% during school hours"],
        ["Scan-page load time", "< 2 seconds"],
    ]
    story.append(make_table(
        ["KPI", "Target"], kpi2_rows,
        col_widths=[80 * mm, 95 * mm]
    ))

    # =========================================================
    # 15. APPROVAL & SIGN-OFF
    # =========================================================
    story.append(Paragraph("15. Approval & Sign-off", st_h1))
    story.append(Paragraph(
        "By signing below, the undersigned stakeholders acknowledge that they have reviewed this "
        "Business Requirement Document and agree that it accurately captures the business needs for "
        "the KidShield v2.0 ecosystem.",
        st_body
    ))
    story.append(Spacer(1, 8 * mm))
    sign_header = ["Role / Title", "Name", "Signature", "Date"]
    sign_rows = [
        ["Product Owner", "", "", ""],
        ["School Administrator", "", "", ""],
        ["Principal Representative", "", "", ""],
        ["Engineering Lead", "", "", ""],
        ["QA / Acceptance Lead", "", "", ""],
    ]
    st = make_table(sign_header, sign_rows, col_widths=[45 * mm, 40 * mm, 50 * mm, 40 * mm])
    st.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_DARK),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(st)
    story.append(Spacer(1, 10 * mm))

    # Version history
    story.append(Paragraph("Document Version History", st_h2))
    hist_rows = [
        ["1.0", date.today().strftime("%d %b %Y"), "Initial business requirement baseline for stakeholder review.", "Product Management"],
        ["1.1", date.today().strftime("%d %b %Y"), "Aligned with deployed live site (kidshield-v2.vercel.app): PWA support, Eastern Automations branding, redesigned portals, phone+PIN HQ auth, real-time sync, system-status panel.", "Product Management"],
    ]
    story.append(make_table(
        ["Version", "Date", "Change Description", "Author"], hist_rows,
        col_widths=[18 * mm, 28 * mm, 105 * mm, 24 * mm]
    ))

    # ---------------------------------------------------------------------
    # Build PDF with header/footer
    # ---------------------------------------------------------------------
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"✅ BRD generated successfully: {OUTPUT_FILE}")


if __name__ == "__main__":
    build()

