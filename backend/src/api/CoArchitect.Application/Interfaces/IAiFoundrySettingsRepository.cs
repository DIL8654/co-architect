using CoArchitect.Domain.Entities;

namespace CoArchitect.Application.Interfaces;

public interface IAiFoundrySettingsRepository
{
    Task<AiFoundrySettings?> GetAsync(CancellationToken cancellationToken);
    Task<AiFoundrySettings> SaveAsync(AiFoundrySettings settings, CancellationToken cancellationToken);
}
