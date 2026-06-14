using CoArchitect.Domain.Models;

namespace CoArchitect.Application.Interfaces;

public interface IFoundryIqKnowledgeProvider
{
    Task<FoundryIqContextBundle> RetrieveContextAsync(FoundryIqQuery query, CancellationToken cancellationToken);
}
