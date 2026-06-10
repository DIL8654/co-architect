using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Entities;
using CoArchitect.Infrastructure.Repositories;
using CoArchitect.Infrastructure.Services;
using Xunit;

namespace CoArchitect.Application.Tests;

public class OrganizationAuthorizationServiceTests
{
    [Fact]
    public async Task OrganizationScoped_Access_RequiresMembership()
    {
        var repository = new MockOrganizationRepository();
        var service = new OrganizationAuthorizationService(repository);
        var organizationId = Guid.NewGuid();

        await repository.AddAsync(new Organization
        {
            Id = organizationId,
            Name = "Access Test Org",
        }, CancellationToken.None);

        var randomUserId = Guid.NewGuid();
        var isMember = await service.IsMemberAsync(organizationId, randomUserId, CancellationToken.None);

        Assert.False(isMember);
    }

    [Fact]
    public async Task OrganizationScoped_Access_AllowsMemberWithRequiredRole()
    {
        var repository = new MockOrganizationRepository();
        var service = new OrganizationAuthorizationService(repository);
        var organizationId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();

        await repository.AddAsync(new Organization
        {
            Id = organizationId,
            Name = "Role Test Org",
            Members = new List<OrganizationUser>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = organizationId,
                    UserId = ownerUserId,
                    AddedByUserId = ownerUserId,
                    Role = OrganizationRole.Owner,
                    JoinedAt = DateTime.UtcNow,
                },
            },
        }, CancellationToken.None);

        var hasRole = await service.HasRoleAsync(
            organizationId,
            ownerUserId,
            OrganizationRole.Writer,
            CancellationToken.None);

        Assert.True(hasRole);
    }
}
