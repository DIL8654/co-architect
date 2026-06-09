using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Enums;

namespace CoArchitect.Infrastructure.Services;

public sealed class OrganizationAuthorizationService : IOrganizationAuthorizationService
{
    private readonly IOrganizationRepository _organizationRepository;

    public OrganizationAuthorizationService(IOrganizationRepository organizationRepository)
    {
        _organizationRepository = organizationRepository;
    }

    public Task<bool> IsMemberAsync(Guid organizationId, Guid userId, CancellationToken cancellationToken)
    {
        return HasRoleAsync(organizationId, userId, OrganizationRole.Reader, cancellationToken);
    }

    public async Task<bool> HasRoleAsync(Guid organizationId, Guid userId, OrganizationRole requiredRole, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var organization = await _organizationRepository.GetByIdAsync(organizationId, cancellationToken);
        if (organization is null)
        {
            return false;
        }

        var membership = organization.Members.FirstOrDefault(member => member.UserId == userId);
        if (membership is null)
        {
            return false;
        }

        return membership.Role >= requiredRole;
    }
}
