using CoArchitect.Domain.Enums;

namespace CoArchitect.Application.Interfaces;

public interface IOrganizationAuthorizationService
{
    Task<bool> IsMemberAsync(Guid organizationId, Guid userId, CancellationToken cancellationToken);
    Task<bool> HasRoleAsync(Guid organizationId, Guid userId, OrganizationRole requiredRole, CancellationToken cancellationToken);
}
