using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;

namespace CoArchitect.Infrastructure.Repositories;

public sealed class InMemoryAiFoundrySettingsRepository : IAiFoundrySettingsRepository
{
    private static readonly object Lock = new();
    private static AiFoundrySettings? _settings;

    public Task<AiFoundrySettings?> GetAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (Lock)
        {
            return Task.FromResult(_settings);
        }
    }

    public Task<AiFoundrySettings> SaveAsync(AiFoundrySettings settings, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (Lock)
        {
            settings.UpdatedAt = DateTime.UtcNow;
            _settings = settings;
            return Task.FromResult(settings);
        }
    }
}
