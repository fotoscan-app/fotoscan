export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: June 2026 | QuickPik by Anss Studio Pvt. Ltd.</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance</h2>
          <p className="text-gray-600">By using QuickPik, you agree to these Terms of Service. If you do not agree, do not use the platform.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Service Description</h2>
          <p className="text-gray-600">QuickPik is an AI-powered event photo sharing platform. Event organisers upload photos; guests can find photos featuring themselves using face recognition technology.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Guest Use</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>You must provide your real mobile number for OTP verification</li>
            <li>You consent to your selfie being processed by AI for the sole purpose of finding your photos</li>
            <li>You may only access your own photos — attempting to access others' photos is prohibited</li>
            <li>You must be at least 13 years old to use this service</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Organiser Responsibilities</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>Organisers are responsible for obtaining consent from event attendees before using QuickPik</li>
            <li>Uploading illegal, obscene, or non-consensual content is strictly prohibited</li>
            <li>Organisers are responsible for informing guests that their photos may be shared via this platform</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Prohibited Use</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>Attempting to access photos of other individuals without consent</li>
            <li>Uploading content that violates any person's privacy or rights</li>
            <li>Using automated tools to scrape or abuse the platform</li>
            <li>Attempting to reverse-engineer or hack the platform</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Intellectual Property</h2>
          <p className="text-gray-600">Photos uploaded to QuickPik remain the property of the uploading organiser. QuickPik does not claim ownership of any uploaded content.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Limitation of Liability</h2>
          <p className="text-gray-600">QuickPik is provided "as is". Anss Studio Pvt. Ltd. is not liable for any indirect, incidental, or consequential damages arising from the use of the platform.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Governing Law</h2>
          <p className="text-gray-600">These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in India.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Contact</h2>
          <p className="text-gray-600">
            <strong>Anss Studio Pvt. Ltd.</strong><br />
            Email: <a href="mailto:legal@quickpik.in" className="text-brand-600">legal@quickpik.in</a>
          </p>
        </section>
      </div>
    </div>
  )
}
