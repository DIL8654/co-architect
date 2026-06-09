namespace CoArchitect.Application.Interfaces;

public interface IArchitectureFileStorage
{
    Task<string?> SaveDiagramFileAsync(
        Guid organizationId,
        Guid workspaceId,
        Guid diagramId,
        string fileName,
        Stream content,
        string contentType,
        CancellationToken cancellationToken);
}
