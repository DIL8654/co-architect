namespace CoArchitect.Api.Services;

public sealed class LocalCurrentUserService : ICurrentUserService
{
    public static readonly Guid UserId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    public static readonly Guid TenantId = Guid.Parse("00000000-0000-0000-0000-000000000101");
    public const string Email = "local-admin@coarchitect.ai";
    public const string DisplayName = "CoArchitect Local Admin";

    private static readonly string[] Roles =
    [
        FronteggRoles.Admin,
        FronteggRoles.Reader,
    ];

    public CurrentUser GetCurrentUser()
    {
        return new CurrentUser(UserId, TenantId, Email, DisplayName, Roles);
    }
}
