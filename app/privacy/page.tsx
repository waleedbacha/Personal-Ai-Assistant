import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Personal AI Assistant",
  description: "How we handle, store, and protect your data.",
};

export default function PrivacyPolicy() {
  const lastUpdated = "October 17, 2026";

  return (
    <main className="min-h-dvh bg-bg px-4 py-12 text-fg sm:px-6 sm:py-20">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="mb-12 border-b border-border pb-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Assistant
          </Link>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-muted">Last updated: {lastUpdated}</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-gold max-w-none text-sm leading-relaxed text-muted sm:text-[15px]">
          <p>
            This Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you use our Personal AI Assistant
            (the "Service"). This Service is operated as both a public portfolio
            demonstration and a commercial B2B/B2C product. We are committed to
            protecting your privacy and ensuring you have a positive experience.
          </p>

          <div className="my-8 rounded-xl border border-accent/20 bg-accent/5 p-4 sm:p-6">
            <h2 className="mt-0 text-fg">
              1. The "Separate Database" Guarantee
            </h2>
            <p className="mb-0">
              For commercial deployments of this AI Assistant,{" "}
              <strong>
                every client receives a fully isolated, private database.
              </strong>
              Unlike shared multi-tenant SaaS platforms where data might be
              pooled, we deploy a dedicated MongoDB Atlas cluster (or a
              segregated logical database) exclusively for your workspace. No
              other client, user, or third party can access, query, or view your
              organization's data.
            </p>
          </div>

          <h2>2. Information We Collect</h2>
          <p>We may collect information about you in a variety of ways:</p>
          <ul>
            <li>
              <strong>Conversational Data:</strong> The questions you ask, the
              AI's responses, and the context of your conversations. This is
              stored to provide memory, context, and weekly reporting.
            </li>
            <li>
              <strong>Integration Data:</strong> If you connect third-party
              services (like GitHub or Google Calendar), we ingest only the
              specific data you authorize (e.g., commit messages, event titles,
              times, and locations).
            </li>
            <li>
              <strong>Contact Information:</strong> If you use the contact form
              or book a call, we collect your name, email address, and the
              message you provide.
            </li>
            <li>
              <strong>Technical Data:</strong> Browser type, device type, and
              basic usage analytics (via Microsoft Clarity or Google Tag
              Manager) to improve the user experience.
            </li>
            <li>
              <strong>Location Data:</strong> Basic IP-based location
              (city/country level) to provide timezone-aware scheduling and
              availability answers.
            </li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, operate, and maintain the AI Assistant.</li>
            <li>
              Generate weekly reports, summaries, and track productivity (if you
              use the reporting feature).
            </li>
            <li>
              Respond to your inquiries, booking requests, or customer support
              needs.
            </li>
            <li>
              Analyze usage trends to improve the AI's accuracy and response
              quality.
            </li>
            <li>Prevent fraudulent activity and ensure system security.</li>
          </ul>

          <h2>4. Third-Party AI Providers & Data Processing</h2>
          <p>
            To function, the AI Assistant transmits your prompts and context to
            third-party AI providers for processing.
          </p>
          <ul>
            <li>
              <strong>LLM Providers:</strong> We use * and * to generate text
              responses. Your prompts are processed by these models but are{" "}
              <strong>not</strong> used to train their public base models.
            </li>
            <li>
              <strong>Embedding Providers:</strong> We use * (via API) to
              vectorize your documents for semantic search.
            </li>
          </ul>
          <p>
            We do not sell your personal data or conversational history to any
            third party.
          </p>

          <h2>5. How We Store and Protect Your Data</h2>
          <p>
            Your data is stored in <strong>MongoDB Atlas</strong>, a highly
            secure cloud database provider. We implement industry-standard
            security measures:
          </p>
          <ul>
            <li>
              <strong>Encryption in Transit:</strong> All data is transmitted
              over HTTPS/TLS.
            </li>
            <li>
              <strong>Encryption at Rest:</strong> MongoDB Atlas encrypts all
              data at the storage level.
            </li>
            <li>
              <strong>Access Controls:</strong> Database access is strictly
              limited to the application APIs using secure environment variables
              and IP allowlists.
            </li>
            <li>
              <strong>Data Retention:</strong> Chat history can be cleared by
              you at any time via the "New Chat" button or the sidebar menu.
              Server-side logs are retained for a maximum of 30 days.
            </li>
          </ul>

          <h2>6. Your Data Rights (GDPR & CCPA)</h2>
          <p>Depending on your location, you have the following rights:</p>
          <ul>
            <li>
              <strong>Right to Access:</strong> Request a copy of the data we
              hold about you.
            </li>
            <li>
              <strong>Right to Erasure:</strong> Request that we delete your
              conversation history and contact information.
            </li>
            <li>
              <strong>Right to Rectification:</strong> Correct any inaccurate
              data we hold.
            </li>
          </ul>
          <p>
            To exercise these rights, please contact us at the email provided
            below.
          </p>

          {/* <h2>7. Cookies and Local Storage</h2>
          <p>
            We use browser <code>localStorage</code> to save your chat history,
            theme preferences, and a randomly generated Visitor ID. This ensures
            that your conversations are waiting for you when you return. We do
            not use third-party tracking cookies for advertising.
          </p> */}

          <h2>7. Children's Privacy</h2>
          <p>
            This Service is not intended for use by children under the age of
            13. We do not knowingly collect personal information from children.
          </p>

          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of any changes by posting the new policy on this page and
            updating the "Last updated" date.
          </p>

          <h2>9. Contact Us</h2>
          <p>
            If you have questions or comments about this Privacy Policy, please
            contact us at:
          </p>
          <ul>
            <li>
              <strong>Email:</strong> myai.assistant3@gmail.com
            </li>
            {/* <li>
              <strong>Portfolio:</strong> waleed-portfolio-theta.vercel.app
            </li> */}
          </ul>
        </div>
      </div>
    </main>
  );
}
