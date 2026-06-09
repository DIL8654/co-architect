import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, EmptyState, LoadingState, Modal, ErrorState } from '../components';
import { useOrganizations } from '../hooks/useOrganizations';
import { OrganizationRole } from '../types/roles';
import type { OrganizationMember } from '../api/organizations';

interface MembersPageMember extends OrganizationMember {
  fullName: string;
  email: string;
  status: 'Active' | 'Invited';
}

const ROLE_ORDER: OrganizationRole[] = [
  OrganizationRole.Reader,
  OrganizationRole.Commenter,
  OrganizationRole.Writer,
  OrganizationRole.Owner,
];

const ROLE_LABELS: Record<OrganizationRole, string> = {
  [OrganizationRole.Reader]: 'Reader',
  [OrganizationRole.Commenter]: 'Commenter',
  [OrganizationRole.Writer]: 'Writer',
  [OrganizationRole.Owner]: 'Owner',
};

const ROLE_VARIANTS: Record<OrganizationRole, 'secondary' | 'primary' | 'warning' | 'success'> = {
  [OrganizationRole.Reader]: 'secondary',
  [OrganizationRole.Commenter]: 'primary',
  [OrganizationRole.Writer]: 'warning',
  [OrganizationRole.Owner]: 'success',
};

const createSeedMembers = (organizationId: string, currentUserEmail: string, currentUserName: string): MembersPageMember[] => [
  {
    id: `${organizationId}-owner-1`,
    organizationId,
    userId: 'user-owner-1',
    role: OrganizationRole.Owner,
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 42).toISOString(),
    fullName: currentUserName,
    email: currentUserEmail,
    status: 'Active',
  },
  {
    id: `${organizationId}-writer-1`,
    organizationId,
    userId: 'user-writer-1',
    role: OrganizationRole.Writer,
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    fullName: 'Priya Shah',
    email: 'priya.shah@coarchitect.app',
    status: 'Active',
  },
  {
    id: `${organizationId}-commenter-1`,
    organizationId,
    userId: 'user-commenter-1',
    role: OrganizationRole.Commenter,
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    fullName: 'Marcus Chen',
    email: 'marcus.chen@coarchitect.app',
    status: 'Active',
  },
  {
    id: `${organizationId}-reader-1`,
    organizationId,
    userId: 'user-reader-1',
    role: OrganizationRole.Reader,
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    fullName: 'Amara Jones',
    email: 'amara.jones@coarchitect.app',
    status: 'Invited',
  },
];

const getStorageKey = (organizationId: string) => `organization-members:${organizationId}`;

const getRoleBadgeVariant = (role: OrganizationRole) => ROLE_VARIANTS[role];

export function OrganizationMembersPage() {
  const { orgId, organizationId } = useParams<{ orgId: string; organizationId: string }>();
  const resolvedOrganizationId = orgId ?? organizationId;
  const navigate = useNavigate();
  const { data: organizations, isLoading, isError } = useOrganizations();

  const [members, setMembers] = useState<MembersPageMember[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<OrganizationRole>(OrganizationRole.Reader);

  useEffect(() => {
    if (!resolvedOrganizationId) {
      return;
    }

    const storageKey = getStorageKey(resolvedOrganizationId);
    const storedMembers = localStorage.getItem(storageKey);

    if (storedMembers) {
      setMembers(JSON.parse(storedMembers) as MembersPageMember[]);
      return;
    }

    const seedMembers = createSeedMembers(resolvedOrganizationId, 'system@coarchitect.ai', 'CoArchitect System User');
    setMembers(seedMembers);
    localStorage.setItem(storageKey, JSON.stringify(seedMembers));
  }, [resolvedOrganizationId]);

  useEffect(() => {
    if (!resolvedOrganizationId || members.length === 0) {
      return;
    }

    localStorage.setItem(getStorageKey(resolvedOrganizationId), JSON.stringify(members));
  }, [members, resolvedOrganizationId]);

  const organization = useMemo(
    () => organizations?.find((item) => item.id === resolvedOrganizationId) ?? null,
    [organizations, resolvedOrganizationId]
  );

  const ownerCount = useMemo(() => members.filter((member) => member.role === OrganizationRole.Owner).length, [members]);

  const handleInvite = () => {
    if (!resolvedOrganizationId || !inviteEmail.trim() || !inviteName.trim()) {
      return;
    }

    const newMember: MembersPageMember = {
      id: `${resolvedOrganizationId}-${Date.now()}`,
      organizationId: resolvedOrganizationId,
      userId: `${inviteEmail.trim().toLowerCase()}`,
      role: inviteRole,
      joinedAt: new Date().toISOString(),
      fullName: inviteName.trim(),
      email: inviteEmail.trim(),
      status: 'Invited',
    };

    setMembers((current) => [newMember, ...current]);
    setInviteEmail('');
    setInviteName('');
    setInviteRole(OrganizationRole.Reader);
    setIsInviteOpen(false);
  };

  const handleRoleChange = (memberId: string, nextRole: OrganizationRole) => {
    setMembers((current) => current.map((member) => (member.id === memberId ? { ...member, role: nextRole } : member)));
  };

  const handleRemove = (memberId: string) => {
    setMembers((current) => current.filter((member) => member.id !== memberId));
  };

  if (!resolvedOrganizationId) {
    return (
      <ErrorState
        title="Invalid organization"
        message="Organization ID is missing."
        action={<Button onClick={() => navigate(-1)}>Go Back</Button>}
      />
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading organization members..." />;
  }

  if (isError || !organization) {
    return (
      <ErrorState
        title="Failed to load organization"
        message="Could not load the organization details."
        action={<Button onClick={() => navigate(-1)}>Go Back</Button>}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-3">
            ← Back
          </Button>
          <h1 className="text-4xl font-bold text-secondary-900">Organization Members</h1>
          <p className="mt-2 text-secondary-600">
            Manage users and roles for {organization.name}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsInviteOpen(true)}>Invite User</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card header="Users">
          <p className="text-3xl font-bold text-secondary-900">{members.length}</p>
          <p className="mt-1 text-sm text-secondary-600">People in this organization</p>
        </Card>
        <Card header="Roles">
          <p className="text-3xl font-bold text-secondary-900">{new Set(members.map((member) => member.role)).size}</p>
          <p className="mt-1 text-sm text-secondary-600">Distinct role assignments</p>
        </Card>
        <Card header="Access">
          <p className="text-3xl font-bold text-secondary-900">Open</p>
          <p className="mt-1 text-sm text-secondary-600">All MVP features are available</p>
        </Card>
      </div>

      {members.length === 0 ? (
        <EmptyState
          title="No members found"
          description="Invite the first user to begin collaborating in this organization."
          action={<Button onClick={() => setIsInviteOpen(true)}>Invite User</Button>}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-600">Users</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-600">Roles</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 bg-white">
                {members.map((member) => (
                  <tr key={member.id} className="align-top hover:bg-secondary-50/70">
                    <td className="px-4 py-4">
                      <p className="font-medium text-secondary-900">{member.fullName}</p>
                      <p className="text-sm text-secondary-500">{member.email}</p>
                      <p className="mt-1 text-xs text-secondary-400">Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={getRoleBadgeVariant(member.role as OrganizationRole)}>{ROLE_LABELS[member.role as OrganizationRole]}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(event) => handleRoleChange(member.id, event.target.value as OrganizationRole)}
                          className="rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-900"
                        >
                          {ROLE_ORDER.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemove(member.id)}
                          disabled={member.role === OrganizationRole.Owner && ownerCount === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite User"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite}>Send Invite</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-secondary-900">Full Name</span>
            <input
              value={inviteName}
              onChange={(event) => setInviteName(event.target.value)}
              className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm"
              placeholder="Enter full name"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-secondary-900">Email</span>
            <input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm"
              placeholder="name@company.com"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-secondary-900">Role</span>
            <select
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value as OrganizationRole)}
              className="w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm"
            >
              {ROLE_ORDER.map((role) => (
                <option key={role} value={role}>{ROLE_LABELS[role]}</option>
              ))}
            </select>
          </label>
        </div>
      </Modal>
    </div>
  );
}
