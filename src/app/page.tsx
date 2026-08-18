import Link from 'next/link'
import { QrCode, BarChart3, ShieldCheck, Zap, Globe, Layers, ArrowRight, CheckCircle2, Star, Sparkles } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              QRFlow
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#analytics" className="hover:text-white transition-colors">Analytics</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 hover:shadow-indigo-500/40"
            >
              Start 7-Day Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950" />
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Dynamic QR SaaS</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Create Dynamic QR Codes.{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              Track Everything.
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-normal">
            Change destination URLs on the fly without re-printing. Real-time geo-analytics, password protection, custom branding, and developer APIs.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition-all text-base"
            >
              <span>Start Your Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold transition-all text-base"
            >
              View Pricing
            </a>
          </div>

          {/* Hero Dashboard Graphic Mockup */}
          <div className="mt-16 relative max-w-5xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-4 shadow-2xl shadow-indigo-500/10">
            <div className="flex items-center space-x-2 pb-4 border-b border-slate-800 px-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-xs text-slate-500 font-mono ml-4">https://qrflow.io/dashboard</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Total Scans</span>
                <p className="text-2xl font-bold text-white mt-1">1,248,930</p>
                <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">↑ +24.8% this month</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Active QR Codes</span>
                <p className="text-2xl font-bold text-white mt-1">452</p>
                <span className="text-xs text-indigo-400 flex items-center gap-1 mt-1">28 Dynamic URLs</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Top Country</span>
                <p className="text-2xl font-bold text-white mt-1">United States</p>
                <span className="text-xs text-slate-400 mt-1">41.2% total traffic</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-900/40 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white">
              Everything You Need to Run High-Scale Campaigns
            </h2>
            <p className="mt-4 text-slate-400 text-lg">
              Engineered for dynamic destination updates, sub-millisecond edge redirects, and real-time conversion insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all group">
              <div className="p-3 w-fit rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mt-6">Instant URL Redirects</h3>
              <p className="text-slate-400 mt-2 text-sm leading-relaxed">
                Update the landing target of any printed QR code instantly. No re-printing, no broken links.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all group">
              <div className="p-3 w-fit rounded-xl bg-violet-500/10 text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-all">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mt-6">Granular Geo Analytics</h3>
              <p className="text-slate-400 mt-2 text-sm leading-relaxed">
                Track scan locations, device types, browser specs, time of day, and custom UTM campaign tags.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all group">
              <div className="p-3 w-fit rounded-xl bg-pink-500/10 text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-all">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mt-6">Security & Expiration</h3>
              <p className="text-slate-400 mt-2 text-sm leading-relaxed">
                Set password protection, scan thresholds, date limits, and country-level geo restrictions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-slate-400 text-lg">
              Try any plan free for 7 days. No credit card required. Powered by Razorpay.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {/* Starter */}
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Starter</h3>
                <p className="text-slate-400 text-sm mt-1">Essential tools for creators & small businesses</p>
                <div className="mt-6 flex items-baseline space-x-1">
                  <span className="text-4xl font-extrabold text-white">₹499</span>
                  <span className="text-slate-400 text-sm">/month</span>
                </div>
                <p className="mt-2 text-xs text-emerald-400 font-semibold">7-day free trial</p>
                <ul className="mt-8 space-y-3 text-sm text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> 50 Dynamic QR Codes</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> 25,000 Scans / mo</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Advanced Analytics</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Custom Branding</li>
                </ul>
              </div>
              <Link href="/signup" className="mt-8 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-center transition-all">
                Start Free Trial
              </Link>
            </div>

            {/* Pro (Highlighted) */}
            <div className="p-8 rounded-2xl bg-slate-900 border-2 border-indigo-500 relative shadow-xl shadow-indigo-500/10 flex flex-col justify-between">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Pro</h3>
                <p className="text-slate-400 text-sm mt-1">For marketing teams & growing businesses</p>
                <div className="mt-6 flex items-baseline space-x-1">
                  <span className="text-4xl font-extrabold text-white">₹1,499</span>
                  <span className="text-slate-400 text-sm">/month</span>
                </div>
                <ul className="mt-8 space-y-3 text-sm text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> 100 Dynamic QR Codes</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Unlimited Scans</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Advanced Heatmaps & UTM Builder</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Password & Geo Restrictions</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> CSV & PDF Export</li>
                </ul>
              </div>
              <Link href="/signup" className="mt-8 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-center transition-all shadow-md shadow-indigo-600/30">
                Start Pro Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Enterprise</h3>
                <p className="text-slate-400 text-sm mt-1">For custom high-volume operations</p>
                <div className="mt-6 flex items-baseline space-x-1">
                  <span className="text-4xl font-extrabold text-white">₹4,999</span>
                  <span className="text-slate-400 text-sm">/month</span>
                </div>
                <ul className="mt-8 space-y-3 text-sm text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Unlimited QR Codes</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Custom Domains & White-labeling</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> REST API & Webhooks</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Dedicated Account Manager</li>
                </ul>
              </div>
              <Link href="/contact" className="mt-8 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-center transition-all">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-400">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-indigo-500" />
            <span className="font-bold text-white">QRFlow</span>
            <span>© 2026 QRFlow SaaS Inc. All rights reserved.</span>
          </div>

          <div className="flex space-x-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
