/**
 * Check whether a user email is a Global SaaS Super Admin.
 * ONLY designated Super Admin emails will see the Admin Panel in the sidebar
 * and have access to platform-wide SaaS administration.
 *
 * Configured via SUPER_ADMIN_EMAIL environment variable (comma-separated).
 * Returns false if not configured — no hardcoded fallbacks.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false

  const envAdmins = process.env.SUPER_ADMIN_EMAIL
  if (!envAdmins) return false

  const adminList = envAdmins
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  if (adminList.length === 0) return false

  return adminList.includes(email.trim().toLowerCase())
}
