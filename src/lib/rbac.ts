// ─────────────────────────────────────────────
// Role-Based Access Control (RBAC) Engine
// ─────────────────────────────────────────────

export type Role = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'

export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1,
}

export type PermissionAction =
  | 'team:read'
  | 'team:invite'
  | 'team:update_role'
  | 'team:remove'
  | 'qr:read'
  | 'qr:create'
  | 'qr:update'
  | 'qr:delete'
  | 'analytics:read'
  | 'folder:read'
  | 'folder:write'
  | 'tag:write'
  | 'api_keys:read'
  | 'api_keys:manage'
  | 'webhooks:read'
  | 'webhooks:manage'
  | 'custom_domain:manage'
  | 'billing:view'
  | 'billing:manage'
  | 'workspace:delete'

const PERMISSION_MATRIX: Record<PermissionAction, Role> = {
  'team:read': 'VIEWER',
  'team:invite': 'ADMIN',
  'team:update_role': 'ADMIN',
  'team:remove': 'ADMIN',
  'qr:read': 'VIEWER',
  'qr:create': 'EDITOR',
  'qr:update': 'EDITOR',
  'qr:delete': 'EDITOR',
  'analytics:read': 'VIEWER',
  'folder:read': 'VIEWER',
  'folder:write': 'EDITOR',
  'tag:write': 'EDITOR',
  'api_keys:read': 'ADMIN',
  'api_keys:manage': 'ADMIN',
  'webhooks:read': 'ADMIN',
  'webhooks:manage': 'ADMIN',
  'custom_domain:manage': 'ADMIN',
  'billing:view': 'ADMIN',
  'billing:manage': 'ADMIN',
  'workspace:delete': 'OWNER',
}

/** Check if an actor's role meets the minimum required role */
export function hasMinimumRole(actorRole: string | undefined | null, requiredRole: Role): boolean {
  if (!actorRole) return false
  const actorWeight = ROLE_HIERARCHY[actorRole.toUpperCase() as Role] ?? 0
  const requiredWeight = ROLE_HIERARCHY[requiredRole]
  return actorWeight >= requiredWeight
}

/** Check if an actor has permission to perform a specific action */
export function hasPermission(actorRole: string | undefined | null, action: PermissionAction): boolean {
  const minRole = PERMISSION_MATRIX[action]
  if (!minRole) return false
  return hasMinimumRole(actorRole, minRole)
}

/**
 * Validate whether an actor can modify or remove a target member.
 * - OWNER can manage anyone (except demoting the sole owner)
 * - ADMIN can manage EDITOR and VIEWER (cannot modify OWNER or other ADMINs)
 * - EDITOR / VIEWER cannot manage anyone
 */
export function canManageTargetMember(
  actorRole: string,
  targetRole: string,
  newRole?: string
): { allowed: boolean; reason?: string } {
  const actor = actorRole.toUpperCase() as Role
  const target = targetRole.toUpperCase() as Role
  const next = newRole ? (newRole.toUpperCase() as Role) : undefined

  if (actor !== 'OWNER' && actor !== 'ADMIN') {
    return { allowed: false, reason: 'Only Workspace Owners and Admins can manage team members.' }
  }

  // Admin cannot modify or remove an Owner
  if (actor === 'ADMIN' && target === 'OWNER') {
    return { allowed: false, reason: 'Admins cannot modify or remove Workspace Owners.' }
  }

  // Admin cannot modify another Admin
  if (actor === 'ADMIN' && target === 'ADMIN') {
    return { allowed: false, reason: 'Admins cannot modify other Admins.' }
  }

  // Admin cannot promote anyone to Owner or Admin
  if (actor === 'ADMIN' && next && (next === 'OWNER' || next === 'ADMIN')) {
    return { allowed: false, reason: 'Admins can only assign Editor or Viewer roles.' }
  }

  return { allowed: true }
}

/** Role capabilities description for UI display */
export const ROLE_DEFINITIONS: Record<
  Role,
  { label: string; description: string; badgeClass: string; permissions: string[] }
> = {
  OWNER: {
    label: 'Owner',
    description: 'Full administrative access, billing control, and workspace deletion.',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    permissions: [
      'Full QR code management',
      'Invite & remove any member',
      'Manage subscription & billing',
      'Manage API keys & Webhooks',
      'Workspace deletion',
    ],
  },
  ADMIN: {
    label: 'Admin',
    description: 'Can manage team members, API keys, Webhooks, and view billing.',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    permissions: [
      'Full QR code management',
      'Invite & manage Editors / Viewers',
      'Manage API keys & Webhooks',
      'View billing and usage',
    ],
  },
  EDITOR: {
    label: 'Editor',
    description: 'Can create, edit, customize, and delete dynamic QR codes, folders, and tags.',
    badgeClass: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    permissions: [
      'Create & edit QR codes',
      'Create folders & tags',
      'View analytics reports',
      'Export data',
    ],
  },
  VIEWER: {
    label: 'Viewer',
    description: 'Read-only access to QR codes, scans, and analytics.',
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    permissions: [
      'View QR codes & destinations',
      'View scan statistics & analytics',
      'Download generated QR images',
    ],
  },
}
