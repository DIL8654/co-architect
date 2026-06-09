using CoArchitect.Domain.Enums;
using Xunit;

namespace CoArchitect.Application.Tests;

public class OrganizationRoleTests
{
    [Theory]
    [InlineData(OrganizationRole.Owner, OrganizationRole.Writer, true)]
    [InlineData(OrganizationRole.Owner, OrganizationRole.Commenter, true)]
    [InlineData(OrganizationRole.Owner, OrganizationRole.Reader, true)]
    [InlineData(OrganizationRole.Writer, OrganizationRole.Commenter, true)]
    [InlineData(OrganizationRole.Writer, OrganizationRole.Reader, true)]
    [InlineData(OrganizationRole.Commenter, OrganizationRole.Reader, true)]
    [InlineData(OrganizationRole.Reader, OrganizationRole.Writer, false)]
    [InlineData(OrganizationRole.Commenter, OrganizationRole.Writer, false)]
    [InlineData(OrganizationRole.Reader, OrganizationRole.Owner, false)]
    public void Role_HasSufficientPrivilege(OrganizationRole userRole, OrganizationRole requiredRole, bool expected)
    {
        var result = userRole >= requiredRole;
        Assert.Equal(expected, result);
    }

    [Fact]
    public void AllRoles_HaveExpectedValues()
    {
        Assert.Equal(0, (int)OrganizationRole.Reader);
        Assert.Equal(1, (int)OrganizationRole.Commenter);
        Assert.Equal(2, (int)OrganizationRole.Writer);
        Assert.Equal(3, (int)OrganizationRole.Owner);
    }

    [Fact]
    public void Enum_HasFourRoles()
    {
        var roles = Enum.GetValues<OrganizationRole>();
        Assert.Equal(4, roles.Length);
    }
}
