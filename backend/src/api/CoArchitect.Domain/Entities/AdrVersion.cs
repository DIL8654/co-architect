using CoArchitect.Domain.Models;

namespace CoArchitect.Domain.Entities;

public sealed class AdrVersion
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid AdrId { get; init; }
    public int VersionNumber { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Status { get; init; } = "Draft";
    public IList<string> Frameworks { get; init; } = new List<string>();
    public AdrDocument Draft { get; init; } = new();
    public string Markdown { get; init; } = string.Empty;
    public string Html { get; init; } = string.Empty;
    public string Summary { get; init; } = string.Empty;
    public Guid CreatedByUserId { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}
