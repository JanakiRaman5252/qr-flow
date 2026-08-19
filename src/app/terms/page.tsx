import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { ShieldCheck, ArrowLeft, FileText, Lock, Globe, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service | DynoQR',
  description: 'Terms of Service, acceptable use policy, subscription terms, and legal agreement for DynoQR SaaS platform.',
}

export default function TermsOfServicePage() {
  const lastUpdated = 'August 20, 2026'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Background Glow Overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />

      {/* Header Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center space-x-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Legal Agreement</span>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10 space-y-12">
        <div className="space-y-4 text-center sm:text-left border-b border-slate-800/80 pb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FileText className="w-3.5 h-3.5" />
            <span>TERMS OF SERVICE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Terms of Service & Usage Agreement
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Please read these terms carefully before accessing or using the DynoQR platform.
            Last updated: <strong className="text-indigo-400">{lastUpdated}</strong>.
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-sm sm:text-base leading-relaxed text-slate-300">
          {/* Section 1 */}
          <section className="space-y-3 p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 text-xs font-black">
                1
              </span>
              <span>Acceptance of Terms & Registration</span>
            </h2>
            <p>
              By accessing, browsing, or creating an account on DynoQR (&quot;Service&quot;, &quot;Platform&quot;, &quot;We&quot;, &quot;Us&quot;),
              you (&quot;User&quot;, &quot;Subscriber&quot;, &quot;Customer&quot;) agree to be bound by these Terms of Service. If you are entering
              into this agreement on behalf of a company or organization, you represent that you have legal authority to bind that entity.
            </p>
            <p className="text-xs text-slate-400">
              You must be at least 18 years of age or the legal age of majority in your jurisdiction to create an account and manage billing.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 text-xs font-black">
                2
              </span>
              <span>Dynamic QR Codes & Redirection Rules</span>
            </h2>
            <p>
              DynoQR grants you a non-exclusive, non-transferable, revocable license to generate dynamic QR codes, configure real-time redirection URLs, and analyze scan telemetry data subject to your plan entitlements.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs sm:text-sm pl-2">
              <li>Destination URLs can be updated at any time without re-printing physical QR codes.</li>
              <li>You remain solely responsible for the content and validity of destination URLs.</li>
              <li>Scan redirection latency is governed by high-performance edge nodes and Upstash Redis caching.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 text-xs font-black">
                3
              </span>
              <span>Subscriptions, 7-Day Free Trial & Billing</span>
            </h2>
            <p>
              DynoQR offers paid subscriptions (Starter, Pro, Business) billed on a recurring monthly or yearly cycle via Razorpay.
            </p>
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs sm:text-sm space-y-2">
              <div className="flex items-center space-x-2 font-bold text-white">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>7-Day Free Trial Policy</span>
              </div>
              <p>
                New workspaces automatically receive a <strong>7-Day Starter Free Trial</strong> without upfront credit card requirements. At the end of 7 days, your workspace will transition to the plan selected during checkout or restrict dynamic QR updates until a paid subscription is activated.
              </p>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs sm:text-sm pl-2">
              <li><strong>Billing Cycle:</strong> Recurring payments auto-renew unless cancelled prior to the renewal date.</li>
              <li><strong>Upgrades:</strong> Plan upgrades take effect immediately upon payment confirmation.</li>
              <li><strong>Downgrades:</strong> Scheduled downgrades take effect at the end of the current billing cycle.</li>
              <li><strong>Refunds:</strong> Payments are non-refundable except where required by applicable consumer protection laws.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 text-xs font-black">
                4
              </span>
              <span>Prohibited Uses & Fraud Prevention</span>
            </h2>
            <p>
              You agree NOT to use DynoQR for any unlawful or malicious activities. We maintain zero tolerance for malicious QR codes. Prohibited uses include:
            </p>
            <ul className="list-disc list-inside space-y-1 text-rose-300/90 text-xs sm:text-sm pl-2">
              <li>Phishing websites, credential harvesting, or malware distribution.</li>
              <li>Deceptive redirects, scam links, or illegal product promotions.</li>
              <li>Automated scraping, DDoS attacks, or overloading scan infrastructure beyond plan limits.</li>
            </ul>
            <p className="text-xs text-slate-400">
              We reserve the right to immediately suspend or terminate any QR code or workspace violating these security requirements without notice or refund.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 text-xs font-black">
                5
              </span>
              <span>Service Level & Intellectual Property</span>
            </h2>
            <p>
              DynoQR strives for 99.9% service uptime for scan redirection edge routers. DynoQR owns all proprietary algorithms, design systems, and source code. All custom uploaded logos and destination URLs remain the intellectual property of the User.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 text-xs font-black">
                6
              </span>
              <span>Contact & Legal Inquiries</span>
            </h2>
            <p>
              For any questions regarding these Terms of Service or billing inquiries, please reach out to our legal support team:
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="mailto:support@dynoqr.in"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>support@dynoqr.in</span>
              </a>
            </div>
          </section>
        </div>

        {/* Footer Link */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 DynoQR SaaS Inc. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/pricing" className="hover:text-slate-300 transition-colors">
              Pricing Plans
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
