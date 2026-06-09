using CoArchitect.Domain.Enums;
using CoArchitect.Infrastructure.Repositories;
using CoArchitect.Infrastructure.Seeding;
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

        var randomUserId = Guid.NewGuid();
        var isMember = await service.IsMemberAsync(DemoDataGenerator.OrganizationId, randomUserId, CancellationToken.None);

        Assert.False(isMember);
    }

    [Fact]
    public async Task OrganizationScoped_Access_AllowsMemberWithRequiredRole()
    {
        var repository = new MockOrganizationRepository();
        var service = new OrganizationAuthorizationService(repository);

        var hasRole = await service.HasRoleAsync(
            DemoDataGenerator.OrganizationId,
            DemoDataGenerator.OwnerUserId,
            OrganizationRole.Writer,
            CancellationToken.None);

        Assert.True(hasRole);
    }
}
