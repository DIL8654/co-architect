export enum OrganizationRole {
  Reader = 'Reader',
  Commenter = 'Commenter',
  Writer = 'Writer',
  Owner = 'Owner',
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
}

export interface OrganizationMembership {
  organizationId: string;
  role: OrganizationRole;
}

export const RolePermissions = {
  [OrganizationRole.Reader]: {
    canView: true,
    canComment: false,
    canCreateOrganization: false,
    canCreateWorkspace: false,
    canUploadDiagram: false,
    canEditDiagram: false,
    canRunAnalysis: false,
    canDeleteDiagram: false,
    canManageUsers: false,
    canInviteUsers: false,
  },
  [OrganizationRole.Commenter]: {
    canView: true,
    canComment: true,
    canCreateOrganization: false,
    canCreateWorkspace: false,
    canUploadDiagram: false,
    canEditDiagram: false,
    canRunAnalysis: false,
    canDeleteDiagram: false,
    canManageUsers: false,
    canInviteUsers: false,
  },
  [OrganizationRole.Writer]: {
    canView: true,
    canComment: true,
    canCreateOrganization: true,
    canCreateWorkspace: true,
    canUploadDiagram: true,
    canEditDiagram: true,
    canRunAnalysis: true,
    canDeleteDiagram: true,
    canManageUsers: false,
    canInviteUsers: false,
  },
  [OrganizationRole.Owner]: {
    canView: true,
    canComment: true,
    canCreateOrganization: true,
    canCreateWorkspace: true,
    canUploadDiagram: true,
    canEditDiagram: true,
    canRunAnalysis: true,
    canDeleteDiagram: true,
    canManageUsers: true,
    canInviteUsers: true,
  },
};

export const hasPermission = (role: OrganizationRole, permission: keyof typeof RolePermissions.Reader): boolean => {
  return RolePermissions[role][permission];
};
