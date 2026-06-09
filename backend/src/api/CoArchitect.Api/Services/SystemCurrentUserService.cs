namespace CoArchitect.Api.Services;

public sealed class SystemCurrentUserService : ICurrentUserService
{
    public static readonly Guid UserId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    public const string Email = "system@coarchitect.ai";
    public const string DisplayName = "CoArchitect System User";

    public CurrentUser GetCurrentUser()
    {
        return new CurrentUser(UserId, Email, DisplayName);
    }
}
