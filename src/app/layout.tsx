import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'QRFlow — Create Dynamic QR Codes. Track Everything.',
    template: '%s | QRFlow',
  },
  description:
    'QRFlow is a production-grade dynamic QR code SaaS platform. Change destinations without reprinting. Real-time analytics, custom domains, team workspaces, and Razorpay billing.',
  keywords: ['dynamic QR code', 'QR code generator', 'QR analytics', 'QR SaaS', 'trackable QR codes'],
  authors: [{ name: 'QRFlow' }],
  creator: 'QRFlow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://qrflow.io',
    title: 'QRFlow — Create Dynamic QR Codes. Track Everything.',
    description:
      'Create dynamic QR codes with real-time analytics, geo restrictions, password protection, and instant destination updates.',
    siteName: 'QRFlow',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QRFlow — Dynamic QR Codes',
    description: 'Create, track, and optimize dynamic QR codes with real-time analytics.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased bg-slate-950 text-slate-50">{children}</body>
    </html>
  )
}
