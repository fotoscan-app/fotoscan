export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-12">
      <div className="max-w-3xl mx-auto prose prose-gray">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: June 2026 | QuickPik by Anss Studio Pvt. Ltd.</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Who We Are</h2>
          <p className="text-gray-600">QuickPik is operated by Anss Studio Pvt. Ltd. ("we", "us", "our"). We provide an AI-powered event photo sharing platform. For questions, contact us at <a href="mailto:privacy@quickpik.in" className="text-brand-600">privacy@quickpik.in</a>.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Data We Collect from Guests</h2>
          <p className="text-gray-600 mb-3">When you use QuickPik as a guest to find your photos at an event, we collect:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li><strong>Your name</strong> — to identify your session</li>
            <li><strong>Your mobile number</strong> — to verify your identity via a one-time OTP</li>
            <li><strong>Your selfie</strong> — used only for AI face matching to find your photos. <strong>Deleted immediately after matching.</strong></li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. How We Use Your Data</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>Your mobile number is used only to send a one-time OTP for identity verification</li>
            <li>Your selfie is processed by AWS Rekognition to find photos with your face, then <strong>permanently deleted from our servers</strong></li>
            <li>Your name and mobile number are stored in your session record (valid 24 hours) so the event organiser can identify guest participation</li>
            <li>We do not sell, share, or use your data for advertising</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Data Retention</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li><strong>Selfies:</strong> Deleted immediately after face matching is complete</li>
            <li><strong>Guest sessions</strong> (name + mobile): Expire and are deleted after 24 hours</li>
            <li><strong>OTP records:</strong> Deleted after 15 minutes</li>
            <li><strong>Event photos:</strong> Retained as long as the event organiser's account is active</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Your Rights (DPDPA 2023)</h2>
          <p className="text-gray-600 mb-3">Under India's Digital Personal Data Protection Act 2023, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>Know what personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p className="text-gray-600 mt-3">To exercise any of these rights, email us at <a href="mailto:privacy@quickpik.in" className="text-brand-600">privacy@quickpik.in</a>.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Security</h2>
          <p className="text-gray-600">Your data is stored securely on AWS (Mumbai region) with encryption in transit and at rest. We use OTP verification to ensure only authorised users access photo sessions. We do not store passwords in plain text.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Third-Party Services</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li><strong>AWS Rekognition</strong> — face matching (images processed in ap-south-1 Mumbai region)</li>
            <li><strong>Twilio</strong> — OTP delivery via SMS</li>
            <li><strong>AWS S3</strong> — secure photo storage</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Contact</h2>
          <p className="text-gray-600">For any privacy-related queries or data deletion requests:</p>
          <p className="text-gray-600 mt-2">
            <strong>Anss Studio Pvt. Ltd.</strong><br />
            Email: <a href="mailto:privacy@quickpik.in" className="text-brand-600">privacy@quickpik.in</a>
          </p>
        </section>
      </div>
    </div>
  )
}
