import { describe, it, expect } from 'vitest'
import {
  hasMinimumRole,
  hasPermission,
  canManageTargetMember,
  ROLE_HIERARCHY,
  ROLE_DEFINITIONS,
  type Role,
} from '@/lib/rbac'

describe('Team & RBAC Engine', () => {
  describe('Role Hierarchy & Minimum Role', () => {
    it('verifies correct hierarchy order: OWNER > ADMIN > EDITOR > VIEWER', () => {
      expect(ROLE_HIERARCHY.OWNER).toBeGreaterThan(ROLE_HIERARCHY.ADMIN)
      expect(ROLE_HIERARCHY.ADMIN).toBeGreaterThan(ROLE_HIERARCHY.EDITOR)
      expect(ROLE_HIERARCHY.EDITOR).toBeGreaterThan(ROLE_HIERARCHY.VIEWER)
    })

    it('validates hasMinimumRole checks', () => {
      expect(hasMinimumRole('OWNER', 'ADMIN')).toBe(true)
      expect(hasMinimumRole('ADMIN', 'ADMIN')).toBe(true)
      expect(hasMinimumRole('EDITOR', 'ADMIN')).toBe(false)
      expect(hasMinimumRole('VIEWER', 'EDITOR')).toBe(false)
      expect(hasMinimumRole(null, 'VIEWER')).toBe(false)
    })
  })

  describe('Action Permissions Matrix', () => {
    it('allows only OWNER and ADMIN to invite or update team members', () => {
      expect(hasPermission('OWNER', 'team:invite')).toBe(true)
      expect(hasPermission('ADMIN', 'team:invite')).toBe(true)
      expect(hasPermission('EDITOR', 'team:invite')).toBe(false)
      expect(hasPermission('VIEWER', 'team:invite')).toBe(false)

      expect(hasPermission('OWNER', 'team:update_role')).toBe(true)
      expect(hasPermission('ADMIN', 'team:update_role')).toBe(true)
      expect(hasPermission('EDITOR', 'team:update_role')).toBe(false)
    })

    it('allows OWNER, ADMIN, and EDITOR to write QR codes, but blocks VIEWER', () => {
      expect(hasPermission('OWNER', 'qr:create')).toBe(true)
      expect(hasPermission('ADMIN', 'qr:create')).toBe(true)
      expect(hasPermission('EDITOR', 'qr:create')).toBe(true)
      expect(hasPermission('VIEWER', 'qr:create')).toBe(false)
      expect(hasPermission('VIEWER', 'qr:update')).toBe(false)
      expect(hasPermission('VIEWER', 'qr:delete')).toBe(false)
    })

    it('allows all roles to read QR codes and view analytics', () => {
      expect(hasPermission('VIEWER', 'qr:read')).toBe(true)
      expect(hasPermission('VIEWER', 'analytics:read')).toBe(true)
      expect(hasPermission('VIEWER', 'folder:read')).toBe(true)
    })

    it('restricts API keys, webhooks, and billing management to ADMIN/OWNER', () => {
      expect(hasPermission('ADMIN', 'api_keys:manage')).toBe(true)
      expect(hasPermission('EDITOR', 'api_keys:manage')).toBe(false)
      expect(hasPermission('VIEWER', 'api_keys:manage')).toBe(false)

      expect(hasPermission('ADMIN', 'webhooks:manage')).toBe(true)
      expect(hasPermission('EDITOR', 'webhooks:manage')).toBe(false)

      expect(hasPermission('ADMIN', 'billing:manage')).toBe(true)
      expect(hasPermission('EDITOR', 'billing:manage')).toBe(false)
    })

    it('restricts workspace deletion strictly to OWNER', () => {
      expect(hasPermission('OWNER', 'workspace:delete')).toBe(true)
      expect(hasPermission('ADMIN', 'workspace:delete')).toBe(false)
      expect(hasPermission('EDITOR', 'workspace:delete')).toBe(false)
      expect(hasPermission('VIEWER', 'workspace:delete')).toBe(false)
    })
  })

  describe('canManageTargetMember Rules', () => {
    it('allows OWNER to manage any role', () => {
      expect(canManageTargetMember('OWNER', 'ADMIN', 'EDITOR').allowed).toBe(true)
      expect(canManageTargetMember('OWNER', 'EDITOR', 'VIEWER').allowed).toBe(true)
      expect(canManageTargetMember('OWNER', 'VIEWER').allowed).toBe(true)
    })

    it('allows ADMIN to manage EDITORS and VIEWERS', () => {
      expect(canManageTargetMember('ADMIN', 'EDITOR', 'VIEWER').allowed).toBe(true)
      expect(canManageTargetMember('ADMIN', 'VIEWER', 'EDITOR').allowed).toBe(true)
    })

    it('prevents ADMIN from modifying or removing an OWNER', () => {
      const result = canManageTargetMember('ADMIN', 'OWNER', 'EDITOR')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('cannot modify or remove Workspace Owners')
    })

    it('prevents ADMIN from modifying another ADMIN', () => {
      const result = canManageTargetMember('ADMIN', 'ADMIN', 'EDITOR')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('cannot modify other Admins')
    })

    it('prevents ADMIN from promoting someone to OWNER or ADMIN', () => {
      const promoteOwner = canManageTargetMember('ADMIN', 'EDITOR', 'OWNER')
      expect(promoteOwner.allowed).toBe(false)

      const promoteAdmin = canManageTargetMember('ADMIN', 'EDITOR', 'ADMIN')
      expect(promoteAdmin.allowed).toBe(false)
    })

    it('prevents EDITORS and VIEWERS from managing members', () => {
      expect(canManageTargetMember('EDITOR', 'VIEWER').allowed).toBe(false)
      expect(canManageTargetMember('VIEWER', 'VIEWER').allowed).toBe(false)
    })
  })

  describe('Role Definitions for UI', () => {
    it('contains definitions for all 4 roles with badge classes and permissions list', () => {
      const roles: Role[] = ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']
      roles.forEach((r) => {
        const def = ROLE_DEFINITIONS[r]
        expect(def).toBeDefined()
        expect(def.label).toBeTruthy()
        expect(def.description).toBeTruthy()
        expect(def.badgeClass).toBeTruthy()
        expect(def.permissions.length).toBeGreaterThan(0)
      })
    })
  })
})
