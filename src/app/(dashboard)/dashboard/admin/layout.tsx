import { redirect } from 'next/navigation'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { isSuperAdminEmail } from '@/lib/is-super-admin'
import { AdminNav } from '@/components/admin/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getCurrentUserAndOrg()

  // Strict check: Only Global SaaS Super Admin can access SaaS Admin panel
  if (!user || !isSuperAdminEmail(user.email)) {
    redirect('/dashboard')
  }

  return (
    <div className="p-8 space-y-8 bg-slate-950 text-slate-50 min-h-screen">
      <AdminNav />
      <div>{children}</div>
    </div>
  )
}
