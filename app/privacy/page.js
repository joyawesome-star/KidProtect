'use client';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="inline-flex items-center justify-center w-9 h-9 bg-slate-900 border-2 border-emerald-500/30 rounded-lg group-hover:border-emerald-500/60 transition">
              <span className="text-lg">🛡️</span>
            </span>
            <span className="font-black tracking-tight">
              Kid<span className="text-emerald-400">Shield</span>
            </span>
          </Link>
          <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-widest">
            Privacy Policy
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Privacy <span className="text-emerald-400">Policy</span>
          </h1>
          <p className="text-slate-400 text-sm">
            <strong className="text-slate-300">Effective Date:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-900 border border-slate-800 rounded-full">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono text-slate-400">Last Updated: {new Date().toISOString().split('T')[0]}</span>
          </div>
        </div>

        {/* Intro */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">1. Introduction</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            KidProtect ("we", "our", "us") is a school safety and high-speed attendance ecosystem designed for modern educational campuses. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile portals, and associated safety tag services (collectively, the "Service").
          </p>
          <p className="text-slate-300 text-sm leading-relaxed">
            By accessing or using the KidProtect Service, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with our policies and practices, please do not use the Service. This policy applies to all visitors, parents/guardians, students, teachers, school administrators, and authorized staff members.
          </p>
        </section>

        {/* Who we are / info collected */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">2. Information We Collect</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            We collect information to provide and improve our safety and attendance services. The categories of information we collect include:
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-white mb-2">a) Parent / Guardian Information</h3>
              <ul className="list-disc list-inside text-slate-400 text-sm space-y-1.5 leading-relaxed">
                <li>Mobile phone number (used for OTP verification and account setup)</li>
                <li>WhatsApp contact number (used for emergency alerts and parent-teacher meeting notifications)</li>
                <li>Device push notification tokens (when the KidProtect parent app is installed)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-2">b) Student / Child Information</h3>
              <ul className="list-disc list-inside text-slate-400 text-sm space-y-1.5 leading-relaxed">
                <li>Student's full name</li>
                <li>School name and class/section</li>
                <li>Blood group (provided voluntarily for emergency medical purposes) — <strong className="text-emerald-400">Sensitive Personal Data or Information (SPDI)</strong> under the IT (SPDI) Rules, 2011, processed only with your explicit prior consent</li>
                <li>Unique smart tag identifier (UUID) linked to the child's school bag</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-2">c) Usage & Attendance Data</h3>
              <ul className="list-disc list-inside text-slate-400 text-sm space-y-1.5 leading-relaxed">
                <li>Attendance logs (tag scans, timestamps, class check-ins)</li>
                <li>Parent-teacher meeting request records</li>
                <li>Lost-and-found item scan records</li>
                <li>CSV export history and download activities</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-2">d) Technical & Device Information</h3>
              <ul className="list-disc list-inside text-slate-400 text-sm space-y-1.5 leading-relaxed">
                <li>Camera access (used exclusively for scanning KidProtect QR tags)</li>
                <li>IP address, browser type, and device identifiers (for security and system administration)</li>
                <li>Usage patterns and pages visited within the portals</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How we use */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside text-slate-400 text-sm space-y-2 leading-relaxed">
            <li><strong className="text-slate-200">To operate the Service:</strong> Register children, provision smart tags, record attendance, and manage lost-and-found identification.</li>
            <li><strong className="text-slate-200">To facilitate emergency contact:</strong> When a bystander scans a child's tag, we display the child's name, school, blood group, and a secure contact button to reach the parent directly.</li>
            <li><strong className="text-slate-200">To send notifications:</strong> Deliver parent-teacher meeting invitations and alerts via the KidProtect app (push) or WhatsApp fallback.</li>
            <li><strong className="text-slate-200">For safety verification:</strong> Display blood group information to first responders or good Samaritans during emergencies.</li>
            <li><strong className="text-slate-200">To generate analytics:</strong> Provide authorized school and administrative dashboards with aggregate attendance insights (e.g., present/absent rates).</li>
            <li><strong className="text-slate-200">To improve the Service:</strong> Analyze usage patterns, debug issues, and enhance features and security.</li>
            <li><strong className="text-slate-200">To comply with legal obligations:</strong> Where required by applicable law, regulation, or legal process.</li>
          </ul>
        </section>

        {/* Legal basis */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">4. Legal Framework & Basis for Processing</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            KidProtect operates in compliance with the Indian data protection framework, including the <strong className="text-slate-200">Information Technology Act, 2000</strong> (Sections 43A and 72A), the <strong className="text-slate-200">IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>, and the <strong className="text-slate-200">Digital Personal Data Protection (DPDP) Act, 2023</strong>. We process personal information based on the following lawful grounds:
          </p>
          <ul className="list-disc list-inside text-slate-400 text-sm space-y-2 leading-relaxed">
            <li><strong className="text-slate-200">Consent:</strong> Where you have explicitly agreed to the processing (e.g., during registration).</li>
            <li><strong className="text-slate-200">Contractual necessity:</strong> Processing required to deliver the service you have subscribed to.</li>
            <li><strong className="text-slate-200">Legitimate interest:</strong> For security, fraud prevention, and operational improvements, balanced against your rights.</li>
            <li><strong className="text-slate-200">Legal obligation:</strong> Where processing is required to comply with applicable laws.</li>
            <li><strong className="text-slate-200">Vital interest:</strong> In emergencies where processing is necessary to protect a child's life or safety.</li>
          </ul>
        </section>

        {/* Sharing */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">5. How We Share Your Information</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            We do <strong className="text-emerald-400">not</strong> sell, rent, or trade your personal information. We may share limited information only in the following circumstances:
          </p>
          <ul className="list-disc list-inside text-slate-400 text-sm space-y-2 leading-relaxed">
            <li><strong className="text-slate-200">With your school:</strong> Attendance data and safety records are shared with the student's registered school and its authorized staff.</li>
            <li><strong className="text-slate-200">With a bystander/finder in emergencies:</strong> When a KidProtect tag is scanned, we display the child's name, school, and blood group, and provide a means to contact the parent via the parent's chosen contact channel. <em className="text-slate-500">We never publicly display the parent's phone number.</em></li>
            <li><strong className="text-slate-200">With service providers:</strong> Trusted third-party vendors (e.g., Supabase for database hosting, SMS/WhatsApp gateway providers, push-notification services) that help us operate the Service. These parties are bound by confidentiality and data-processing obligations, and SPDI is only transferred to them with your consent or where necessary for the Service.</li>
            <li><strong className="text-slate-200">For legal reasons:</strong> When required by law, court order, or governmental authority, or when we believe disclosure is necessary to protect the rights, safety, and security of KidProtect, our users, or the public. SPDI is never disclosed to third parties without your prior consent, except as required by law.</li>
          </ul>
        </section>

        {/* Notice at collection */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">5A. Notice at Collection (IT Rules, 2011)</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            In compliance with Rule 5(3) of the IT (SPDI) Rules, 2011, at the time of collecting your personal information, we provide the following notice:
          </p>
          <ul className="list-disc list-inside text-slate-400 text-sm space-y-2 leading-relaxed">
            <li><strong className="text-slate-200">What we collect:</strong> Parent/guardian contact details, student information (name, school, class, blood group, tag UUID), attendance logs, and technical/device data as described in Section 2.</li>
            <li><strong className="text-slate-200">Purpose:</strong> Child safety, attendance tracking, parent-teacher communication, emergency contact, lost-and-found identification, and service improvement as described in Section 3.</li>
            <li><strong className="text-slate-200">Recipients:</strong> Your child's school and authorized staff, emergency responders/bystanders (limited data), and trusted service providers as described in Section 5.</li>
            <li><strong className="text-slate-200">Retention:</strong> As described in Section 8 of this policy.</li>
            <li>You may withdraw consent or update your information at any time by contacting our Grievance Officer (see Section 12).</li>
          </ul>
        </section>

        {/* Children's privacy */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8 border-t-4 border-t-emerald-500">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">6. Children's Privacy</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            KidProtect is designed for schools and is used by parents/guardians on behalf of their children. We are committed to protecting children's personal information in accordance with applicable laws, including the Children's Online Privacy Protection Act (COPPA) and similar regulations.
          </p>
          <ul className="list-disc list-inside text-slate-400 text-sm space-y-2 leading-relaxed">
            <li>We collect a child's information <strong className="text-slate-200">only from a parent or guardian</strong>, or through the child's registered school.</li>
            <li>Parents/guardians can review, update, or request deletion of their child's information at any time.</li>
            <li>We do not require children to disclose more information than is reasonably necessary to participate in the Service.</li>
            <li>We do not knowingly contact children for marketing purposes.</li>
          </ul>
        </section>

        {/* Security */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">7. Data Security</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            We implement <strong className="text-slate-200">reasonable security practices and procedures</strong> as mandated by <strong className="text-slate-200">Rule 8 of the IT (SPDI) Rules, 2011</strong> and Section 43A of the Information Technology Act, 2000, including:
          </p>
          <ul className="list-disc list-inside text-slate-400 text-sm space-y-2 leading-relaxed">
            <li>Encrypted data transmission (TLS/HTTPS) between your browser and our servers.</li>
            <li>Secure, role-based access controls for teachers, administrators, and headquarters staff.</li>
            <li>Authentication requirements for administrative and sensitive dashboards.</li>
            <li>Regular monitoring for unauthorized access and system integrity.</li>
            <li>Least-privilege access to stored records within our database infrastructure (Supabase).</li>
            <li>Information security policies and documented procedures aligned with industry standards such as ISO/IEC 27001, with periodic reviews and audits.</li>
            <li>SPDI-specific safeguards, including restricted access on a need-to-know basis, contractual confidentiality obligations on all personnel handling SPDI, and prompt notification to affected users in the event of a security breach.</li>
          </ul>
          <p className="text-slate-400 text-xs leading-relaxed mt-4 border-t border-slate-800 pt-4">
            ⚠️ However, no method of electronic transmission or storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security. You are responsible for safeguarding any credentials used to access the Service.
          </p>
        </section>

        {/* Retention */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">8. Data Retention</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            We retain personal information only for as long as necessary to fulfill the purposes described in this policy, unless a longer retention period is required or permitted by law. Specifically:
          </p>
          <ul className="list-disc list-inside text-slate-400 text-sm space-y-2 leading-relaxed">
            <li><strong className="text-slate-200">Student profiles and tags:</strong> Retained for the duration of the student's enrollment and a reasonable period afterward, unless deletion is requested.</li>
            <li><strong className="text-slate-200">Attendance logs:</strong> Retained to support school academic records and reporting obligations.</li>
            <li><strong className="text-slate-200">Contact and notification records:</strong> Retained for operational and audit purposes.</li>
            <li>Upon request, we will delete or anonymize personal data where feasible, subject to legal and school-record retention obligations.</li>
          </ul>
        </section>

        {/* Your rights */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">9. Your Rights & Choices</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            Depending on your jurisdiction (e.g., GDPR in the EU/UK, DPDP Act in India, CCPA/COPPA in the US), you may have the following rights regarding your personal information:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: '👁️', title: 'Right to Access', desc: 'Request a copy of the personal data we hold about you or your child.' },
              { icon: '✏️', title: 'Right to Rectification', desc: 'Correct inaccurate or incomplete information.' },
              { icon: '🗑️', title: 'Right to Erasure', desc: 'Request deletion of your data, subject to legal limits.' },
              { icon: '⏸️', title: 'Right to Restrict', desc: 'Limit how we process your data in certain circumstances.' },
              { icon: '📦', title: 'Right to Portability', desc: 'Receive your data in a structured, machine-readable format.' },
              { icon: '🚫', title: 'Right to Object', desc: 'Object to processing based on legitimate interests or for marketing.' },
              { icon: '🔄', title: 'Right to Withdraw Consent', desc: 'Withdraw consent at any time where processing is based on consent.' },
              { icon: '⚖️', title: 'Right to Lodge a Complaint', desc: 'Complain to your local data protection authority.' },
            ].map((right, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <span className="text-2xl block mb-2">{right.icon}</span>
                <h3 className="font-bold text-white text-sm mb-1">{right.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{right.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-300 text-sm leading-relaxed mt-4">
            To exercise any of these rights, please contact us using the details in Section 12. We will respond within a reasonable timeframe (typically within 30 days) and may require identity verification before fulfilling your request.
          </p>
        </section>

        {/* Cookies */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">10. Cookies & Tracking Technologies</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            KidProtect uses essential cookies and local browser storage to maintain session state, authenticate portal access, and remember your preferences. We may also use analytics technologies to understand how the Service is used.
          </p>
          <ul className="list-disc list-inside text-slate-400 text-sm space-y-2 leading-relaxed">
            <li><strong className="text-slate-200">Essential cookies:</strong> Required for the Service to function (e.g., login sessions).</li>
            <li><strong className="text-slate-200">Camera access:</strong> The QR scanning feature requires camera permission. Camera footage is processed locally in your browser and is <strong className="text-emerald-400">never transmitted or stored</strong> by KidProtect.</li>
            <li>You may adjust your browser settings to refuse cookies; however, some parts of the Service may not function properly.</li>
          </ul>
        </section>

        {/* Third-party links */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">11. Third-Party Services & Links</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            The Service integrates with and may link to third-party services, including:
          </p>
          <ul className="list-disc list-inside text-slate-400 text-sm space-y-2 leading-relaxed">
            <li><strong className="text-slate-200">Supabase:</strong> Our database and authentication backend, which stores encrypted records in secure cloud infrastructure.</li>
            <li><strong className="text-slate-200">WhatsApp:</strong> Used to route parent-teacher meeting invitations and emergency notifications. When you use WhatsApp links, WhatsApp's own privacy policy applies.</li>
            <li><strong className="text-slate-200">SMS/Push providers:</strong> Used to deliver OTP verification codes and app notifications.</li>
            <li><strong className="text-slate-200">Phone dialer:</strong> The emergency call button opens your device's native dialer; we do not record call contents.</li>
          </ul>
          <p className="text-slate-400 text-xs leading-relaxed mt-4">
            We are not responsible for the privacy practices of third-party services. We encourage you to review the privacy policies of any external service you access.
          </p>
        </section>

        {/* Contact */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8 border-b-4 border-b-emerald-500">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">12. Grievance Officer & Contact Us</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            In compliance with <strong className="text-slate-200">Rule 5(9) of the IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>, KidProtect has designated a <strong className="text-emerald-400">Grievance Officer</strong> to address any discrepancies, grievances, or complaints regarding the processing of your personal information:
          </p>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 text-sm">
            <p className="flex items-center gap-3 text-slate-300">
              <span className="text-lg">🛡️</span> <strong className="text-white">Grievance Officer</strong>
            </p>
            <p className="flex items-center gap-3 text-slate-400">
              <span className="text-lg">👤</span> [Name of Grievance Officer], KidProtect Privacy Office
            </p>
<p className="flex items-center gap-3 text-slate-400">
              <span className="text-lg">✉️</span> kisshieldsci@gmail.com
            </p>
            <p className="flex items-center gap-3 text-slate-400">
              <span className="text-lg">📞</span> +91 8777524976 (Grievance Line)
            </p>
            <p className="flex items-start gap-3 text-slate-400">
              <span className="text-lg">🏢</span> <span>KidProtect Technologies, Support Office, [Street Address], [City], [State], [PIN Code], India</span>
            </p>
          </div>
          <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-sm">
            <p className="text-slate-300 leading-relaxed">
              <strong className="text-emerald-400">⏱️ 30-Day Redressal Commitment:</strong> We will acknowledge your grievance within <strong className="text-white">48 hours</strong> and resolve it within <strong className="text-white">1 month (30 days)</strong> from the date of receipt, as required under Rule 5(9). If a grievance is not resolved to your satisfaction, you may escalate it to the relevant adjudicating authority under the Information Technology Act, 2000.
            </p>
          </div>
        </section>

        {/* Governing law */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">12A. Governing Law & Jurisdiction</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            This Privacy Policy and the use of the KidProtect Service shall be governed by and construed in accordance with the laws of <strong className="text-slate-200">India</strong>, including the Information Technology Act, 2000, and the rules framed thereunder. Any disputes arising out of or in connection with this Privacy Policy shall be subject to the exclusive jurisdiction of the courts at <strong className="text-slate-200">[City], India</strong>.
          </p>
        </section>

        {/* Changes */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">13. Changes to This Privacy Policy</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. When we make material changes, we will update the "Effective Date" at the top of this page and, where appropriate, notify you through the Service. We encourage you to review this page periodically to stay informed about how we protect your information.
          </p>
        </section>

        {/* Consent acknowledgement */}
        <section className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">14. Your Consent</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            By using the KidProtect Service, you consent to the collection, use, and sharing of your information as described in this Privacy Policy. As a parent or guardian registering a child, you confirm that you have the legal authority to provide this information and consent on behalf of your child.
          </p>
        </section>

        {/* Back to home */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-emerald-500/10"
          >
            ← Back to KidProtect Portal
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-6 py-6 text-center">
          <p className="text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
            <span className="text-emerald-500">🟢</span> KidProtect v2.0 © {new Date().getFullYear()} — All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}

