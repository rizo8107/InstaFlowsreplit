export default function Privacy() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
          <p className="mb-2">We collect the following types of information:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Account information (username, email)</li>
            <li>Instagram account credentials (access tokens)</li>
            <li>Automation flow configurations</li>
            <li>Webhook events from Instagram</li>
            <li>Usage data and analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
          <p className="mb-2">We use your information to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Provide and maintain the automation service</li>
            <li>Execute your automation flows on Instagram</li>
            <li>Process webhook events from Instagram</li>
            <li>Improve and optimize the platform</li>
            <li>Communicate with you about service updates</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">3. Data Storage and Security</h2>
          <p>
            Your data is stored securely using industry-standard encryption. Instagram access tokens are encrypted and stored securely. We implement appropriate technical and organizational measures to protect your personal data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">4. Instagram Data</h2>
          <p>
            We access Instagram data on your behalf using your provided access tokens. We only access the data necessary to perform the automation tasks you configure. We comply with Instagram's Data Policy and Platform Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Sharing</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. We only share data with Instagram/Meta as necessary to execute your automation flows.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">6. Your Rights</h2>
          <p className="mb-2">You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your data</li>
            <li>Export your data</li>
            <li>Withdraw consent for data processing</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">7. Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to maintain your session and improve user experience. You can control cookies through your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">8. Changes to Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">9. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us through the platform.
          </p>
        </section>
      </div>
    </div>
  );
}
