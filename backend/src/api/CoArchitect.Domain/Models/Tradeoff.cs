namespace CoArchitect.Domain.Models;

public sealed class Tradeoff
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Summary { get; init; } = string.Empty;
    public IList<string> Pros { get; init; } = new List<string>();
    public IList<string> Cons { get; init; } = new List<string>();
}
