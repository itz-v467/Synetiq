export type Capabilities = {
  platform_role: string;
  is_super_admin: boolean;
  can_manage_users: boolean;
  can_assign_superadmin?: boolean;
  can_create_community: boolean;
  can_create_meeting: boolean;
  can_manage_mom: boolean;
  read_only: boolean;
  admin_group_ids?: number[];
};

export const PLATFORM_ADMIN_ROLES = ["SUPERADMIN", "ADMIN"] as const;

export function isPlatformAdmin(role?: string | null) {
  return role != null && PLATFORM_ADMIN_ROLES.includes(role as (typeof PLATFORM_ADMIN_ROLES)[number]);
}

export function isSuperadmin(role?: string | null) {
  return role === "SUPERADMIN";
}

export function canManageMom(caps?: Capabilities | null) {
  return caps?.is_super_admin || caps?.can_manage_mom;
}

export function canCreateCommunity(caps?: Capabilities | null) {
  return caps?.is_super_admin || caps?.can_create_community;
}

export function canManageUsers(caps?: Capabilities | null) {
  return Boolean(caps?.can_manage_users);
}
