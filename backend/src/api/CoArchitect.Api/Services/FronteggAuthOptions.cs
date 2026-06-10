namespace CoArchitect.Api.Services;

public sealed class FronteggAuthOptions
{
    public string? Domain { get; init; }
    public string? ClientId { get; init; }
    public string? Audience { get; init; }
    public string? Authority { get; init; }
    public string? MetadataAddress { get; init; }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(GetAuthority()) &&
        !string.IsNullOrWhiteSpace(GetAudience());

    public string? GetAuthority()
    {
        if (!string.IsNullOrWhiteSpace(Authority))
        {
            return Authority;
        }

        if (string.IsNullOrWhiteSpace(Domain))
        {
            return null;
        }

        var normalized = Domain.Trim();
        if (!normalized.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
            !normalized.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            normalized = $"https://{normalized}";
        }

        return normalized.TrimEnd('/');
    }

    public string? GetAudience() =>
        !string.IsNullOrWhiteSpace(Audience)
            ? Audience
            : ClientId;
}
