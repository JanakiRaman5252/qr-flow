import { DashboardSidebarClient } from '@/components/layout/sidebar-client'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 w-full overflow-x-hidden">
      <DashboardSidebarClient />
      <main className="flex-1 min-w-0 w-full overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
