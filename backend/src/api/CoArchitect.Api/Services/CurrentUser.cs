namespace CoArchitect.Api.Services;

public sealed record CurrentUser(
    Guid UserId,
    Guid TenantId,
    string Email,
    string DisplayName,
    IReadOnlyCollection<string> Roles)
{
    public bool IsAdmin => Roles.Contains(FronteggRoles.Admin, StringComparer.OrdinalIgnoreCase);
    public bool IsReader => Roles.Contains(FronteggRoles.Reader, StringComparer.OrdinalIgnoreCase);
}
