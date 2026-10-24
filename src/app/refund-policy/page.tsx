export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund &amp; Cancellation Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: October 2026 | QuickPik by Anss Studio Pvt. Ltd.</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Overview</h2>
          <p className="text-gray-600">QuickPik is a software service (SaaS) for event photo sharing. We do not sell or ship physical goods. This policy explains how cancellations and refunds work for our paid subscription plans and event packs. All payments are processed securely through Razorpay.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Free Plan and Free Trials</h2>
          <p className="text-gray-600">The Free plan and any free trial can be used without payment. We recommend using them to evaluate QuickPik before purchasing a paid plan. No charge is made during a free trial unless you choose to upgrade.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Subscription Cancellation</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>You can cancel your subscription at any time from Dashboard → Billing</li>
            <li>Cancellation takes effect at the end of your current billing cycle (monthly, quarterly, half-yearly or annual)</li>
            <li>You keep full access to your plan until the end of the period you have paid for</li>
            <li>After cancellation, you will not be charged again</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. No Refunds</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>All payments for subscription plans and event packs are final and non-refundable once the plan or pack is activated</li>
            <li>This includes partially used billing periods and unused events or storage</li>
            <li>You are shown this notice before every payment, and we recommend using the Free plan or free trial to evaluate QuickPik before you buy</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Payment Issues and Concerns</h2>
          <p className="text-gray-600">If you find any issue with a payment or have any concern, please write to us at <a href="mailto:anssstudiopvtltd@gmail.com" className="text-brand-600">anssstudiopvtltd@gmail.com</a> with your registered email address and payment ID. We will review and consider your concern.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Account Termination</h2>
          <p className="text-gray-600">If an account is suspended or terminated for violating our <a href="/terms" className="text-brand-600">Terms of Service</a>, no refund is issued for the remaining period.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Contact</h2>
          <p className="text-gray-600">
            <strong>Anss Studio Pvt. Ltd.</strong><br />
            B-146 West Vinod Nagar, Opposite Press Apartment, Delhi - 110092<br />
            Email: <a href="mailto:anssstudiopvtltd@gmail.com" className="text-brand-600">anssstudiopvtltd@gmail.com</a><br />
            Phone: <a href="tel:+919540642600" className="text-brand-600">+91 9540642600</a>
          </p>
        </section>
      </div>
    </div>
  )
}
