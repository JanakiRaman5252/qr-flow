/**
 * Check whether a user email is a Global SaaS Super Admin.
 * ONLY designated Super Admin emails will see the Admin Panel in the sidebar
 * and have access to platform-wide SaaS administration.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false

  const envAdmins =
    process.env.SUPER_ADMIN_EMAIL || 'jansiva5252@gmail.com,tbcjanakiraman@gmail.com,admin@qrflow.io'

  const adminList = envAdmins
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  return adminList.includes(email.trim().toLowerCase())
}
