using CoArchitect.Domain.Models;

namespace CoArchitect.Application.Interfaces;

public interface IFoundryIqProvider
{
    Task<FoundryIqContextBundle> RetrieveContextAsync(FoundryIqQuery query, CancellationToken cancellationToken);
}
