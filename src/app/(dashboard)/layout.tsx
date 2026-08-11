'use client'

import dynamic from 'next/dynamic'

const DashboardSidebar = dynamic(
  () => import('@/components/layout/sidebar').then((mod) => mod.DashboardSidebar),
  {
    ssr: false,
    loading: () => (
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:block min-h-screen shrink-0" />
    ),
  }
)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 w-full overflow-x-hidden" suppressHydrationWarning>
      <DashboardSidebar />
      <main className="flex-1 min-w-0 w-full overflow-y-auto" suppressHydrationWarning>
        {children}
      </main>
    </div>
  )
}
