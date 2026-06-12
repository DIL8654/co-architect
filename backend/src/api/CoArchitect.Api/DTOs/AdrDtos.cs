namespace CoArchitect.Api.DTOs;

public sealed class AdrResponse
{
    public Guid Id { get; init; }
    public Guid WorkspaceId { get; init; }
    public Guid DiagramId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public int LatestVersionNumber { get; init; }
    public AdrVersionResponse? LatestVersion { get; init; }
    public List<AdrVersionSummaryResponse> Versions { get; init; } = new();
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public sealed class AdrVersionSummaryResponse
{
    public Guid Id { get; init; }
    public int VersionNumber { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}

public sealed class AdrVersionResponse
{
    public Guid Id { get; init; }
    public int VersionNumber { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public List<string> Frameworks { get; init; } = new();
    public List<string> Standards { get; init; } = new();
    public string Date { get; init; } = string.Empty;
    public List<string> Context { get; init; } = new();
    public List<string> Decision { get; init; } = new();
    public List<string> Alternatives { get; init; } = new();
    public List<string> Tradeoffs { get; init; } = new();
    public List<string> Consequences { get; init; } = new();
    public List<string> Risks { get; init; } = new();
    public List<string> GroundedContext { get; init; } = new();
    public List<string> History { get; init; } = new();
    public string Markdown { get; init; } = string.Empty;
    public string Html { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}
