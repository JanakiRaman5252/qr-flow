
'use client'

import dynamic from 'next/dynamic'

const DashboardSidebar = dynamic(
  () =>
    import('@/components/layout/sidebar').then(
      (mod) => mod.DashboardSidebar,
    ),
  {
    ssr: false,
    loading: () => (
      <aside className="w-full md:w-64 md:shrink-0">
        {/* Mobile skeleton */}
        <div className="md:hidden w-full border-b border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between p-4">
            <div className="h-10 w-32 rounded-xl bg-slate-800 animate-pulse" />

            <div className="h-10 w-10 rounded-xl bg-slate-800 animate-pulse" />
          </div>
        </div>

        {/* Desktop skeleton */}
        <div className="hidden md:flex w-64 h-screen bg-slate-900 border-r border-slate-800 flex-col">
          <div className="p-6 space-y-6">
            <div className="h-10 w-32 rounded-xl bg-slate-800 animate-pulse" />

            <div className="h-12 w-full rounded-xl bg-slate-800 animate-pulse" />

            <div className="space-y-2">
              <div className="h-10 w-full rounded-xl bg-slate-800/70 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-slate-800/70 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-slate-800/70 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-slate-800/70 animate-pulse" />
            </div>
          </div>
        </div>
      </aside>
    ),
  },
)

export function DashboardSidebarClient() {
  return <DashboardSidebar />
}
