using Microsoft.AspNetCore.Http;

namespace CoArchitect.Api.Services;

public sealed class HttpContextCurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HttpContextCurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public CurrentUser GetCurrentUser()
    {
        var principal = _httpContextAccessor.HttpContext?.User
            ?? throw new InvalidOperationException("No active HTTP context is available.");

        if (principal.Identity?.IsAuthenticated != true)
        {
            throw new InvalidOperationException("No authenticated user context is available.");
        }

        return new CurrentUser(
            principal.GetRequiredUserId(),
            principal.GetRequiredTenantId(),
            principal.GetRequiredEmail(),
            principal.GetDisplayName(),
            principal.GetRoleKeys());
    }
}
