using Microsoft.Extensions.Caching.Memory;

namespace CoArchitect.Api.Services;

public sealed class PerformanceCacheService
{
    private static readonly TimeSpan HotPathTtl = TimeSpan.FromSeconds(20);
    private readonly IMemoryCache _cache;

    public PerformanceCacheService(IMemoryCache cache)
    {
        _cache = cache;
    }

    public Task<T> GetOrCreateAsync<T>(string key, Func<ICacheEntry, Task<T>> factory)
    {
        return _cache.GetOrCreateAsync(key, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = HotPathTtl;
            return await factory(entry);
        })!;
    }

    public void InvalidateTenant(Guid tenantId)
    {
        _cache.Remove(Dashboard(tenantId));
        _cache.Remove(Workspaces(tenantId));
    }

    public void InvalidateWorkspace(Guid tenantId, Guid workspaceId)
    {
        InvalidateTenant(tenantId);
        _cache.Remove(Workspace(workspaceId));
        _cache.Remove(Diagrams(workspaceId));
    }

    public void InvalidateDiagram(Guid tenantId, Guid workspaceId, Guid diagramId)
    {
        InvalidateWorkspace(tenantId, workspaceId);
        _cache.Remove(Diagram(diagramId));
    }

    public static string Dashboard(Guid tenantId) => $"perf:dashboard:{tenantId:N}";
    public static string Workspaces(Guid tenantId) => $"perf:workspaces:{tenantId:N}";
    public static string Workspace(Guid workspaceId) => $"perf:workspace:{workspaceId:N}";
    public static string Diagrams(Guid workspaceId) => $"perf:diagrams:{workspaceId:N}";
    public static string Diagram(Guid diagramId) => $"perf:diagram:{diagramId:N}";
}
