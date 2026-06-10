using System.Security.Claims;
using System.Text.Json;

namespace CoArchitect.Api.Services;

public static class ClaimsPrincipalExtensions
{
    private static readonly string[] TenantClaimTypes =
    [
        "tenantId",
        "tenant_id",
        "tenant",
        "https://identity.frontegg.com/claims/tenantId",
    ];

    private static readonly string[] RoleClaimTypes =
    [
        "roles",
        ClaimTypes.Role,
        "role",
    ];

    private static readonly string[] UserIdClaimTypes =
    [
        ClaimTypes.NameIdentifier,
        "sub",
        "userId",
    ];

    private static readonly string[] DisplayNameClaimTypes =
    [
        "name",
        ClaimTypes.Name,
        "email",
    ];

    private static readonly string[] EmailClaimTypes =
    [
        ClaimTypes.Email,
        "email",
        "upn",
    ];

    public static Guid GetRequiredTenantId(this ClaimsPrincipal principal)
    {
        foreach (var claimType in TenantClaimTypes)
        {
            var rawValue = principal.FindFirstValue(claimType);
            if (Guid.TryParse(rawValue, out var tenantId))
            {
                return tenantId;
            }
        }

        throw new InvalidOperationException("Authenticated user does not include a valid tenantId claim.");
    }

    public static Guid GetRequiredUserId(this ClaimsPrincipal principal)
    {
        foreach (var claimType in UserIdClaimTypes)
        {
            var rawValue = principal.FindFirstValue(claimType);
            if (Guid.TryParse(rawValue, out var userId))
            {
                return userId;
            }
        }

        var subject = principal.FindFirstValue("sub");
        if (!string.IsNullOrWhiteSpace(subject))
        {
            return DeterministicGuid.Create(subject);
        }

        throw new InvalidOperationException("Authenticated user does not include a valid subject identifier.");
    }

    public static string GetRequiredEmail(this ClaimsPrincipal principal)
    {
        foreach (var claimType in EmailClaimTypes)
        {
            var value = principal.FindFirstValue(claimType);
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        throw new InvalidOperationException("Authenticated user does not include an email claim.");
    }

    public static string GetDisplayName(this ClaimsPrincipal principal)
    {
        foreach (var claimType in DisplayNameClaimTypes)
        {
            var value = principal.FindFirstValue(claimType);
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return principal.GetRequiredEmail();
    }

    public static IReadOnlyCollection<string> GetRoleKeys(this ClaimsPrincipal principal)
    {
        var roles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var claimType in RoleClaimTypes)
        {
            foreach (var claim in principal.FindAll(claimType))
            {
                foreach (var parsedRole in ParseRoleValues(claim.Value))
                {
                    roles.Add(parsedRole);
                }
            }
        }

        return roles.ToList();
    }

    public static bool HasApplicationRole(this ClaimsPrincipal principal, string roleKey)
    {
        return principal.GetRoleKeys().Contains(roleKey, StringComparer.OrdinalIgnoreCase);
    }

    private static IEnumerable<string> ParseRoleValues(string rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            yield break;
        }

        var trimmed = rawValue.Trim();
        if (trimmed.StartsWith("[", StringComparison.Ordinal))
        {
            string[]? parsedValues = null;
            try
            {
                parsedValues = JsonSerializer.Deserialize<string[]>(trimmed);
            }
            catch (JsonException)
            {
            }

            if (parsedValues is not null)
            {
                foreach (var value in parsedValues.Where(value => !string.IsNullOrWhiteSpace(value)))
                {
                    yield return value;
                }

                yield break;
            }
        }

        if (trimmed.Contains(','))
        {
            foreach (var item in trimmed.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                yield return item;
            }

            yield break;
        }

        yield return trimmed;
    }
}
