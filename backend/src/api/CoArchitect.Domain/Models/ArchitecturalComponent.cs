namespace CoArchitect.Domain.Models;

public record ArchitecturalComponent
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Name { get; init; } = string.Empty;
}
