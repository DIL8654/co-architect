using CoArchitect.Application.Interfaces;

namespace CoArchitect.Infrastructure.Storage;

public sealed class NoopArchitectureFileStorage : IArchitectureFileStorage
{
    public Task<string?> SaveDiagramFileAsync(
        Guid organizationId,
        Guid workspaceId,
        Guid diagramId,
        string fileName,
        Stream content,
        string contentType,
        CancellationToken cancellationToken)
    {
        return Task.FromResult<string?>(null);
    }
}
