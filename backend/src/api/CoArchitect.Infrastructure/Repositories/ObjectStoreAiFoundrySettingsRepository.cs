using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Infrastructure.Persistence;

namespace CoArchitect.Infrastructure.Repositories;

public sealed class ObjectStoreAiFoundrySettingsRepository : IAiFoundrySettingsRepository
{
    private const string Kind = "ai_foundry_settings";
    private readonly IObjectStore _store;

    public ObjectStoreAiFoundrySettingsRepository(IObjectStore store)
    {
        _store = store;
    }

    public Task<AiFoundrySettings?> GetAsync(CancellationToken cancellationToken)
    {
        return _store.GetAsync<AiFoundrySettings>(Kind, AiFoundrySettings.WellKnownId, cancellationToken);
    }

    public async Task<AiFoundrySettings> SaveAsync(AiFoundrySettings settings, CancellationToken cancellationToken)
    {
        settings.UpdatedAt = DateTime.UtcNow;
        await _store.UpsertAsync(
            Kind,
            AiFoundrySettings.WellKnownId,
            settings,
            null,
            null,
            null,
            cancellationToken);

        return settings;
    }
}
