namespace CoArchitect.Infrastructure.Storage;

public static class ArchitectureStoragePathHelper
{
    public static string GetDiagramOriginalPath(Guid orgId, Guid workspaceId, Guid diagramId, string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
        {
            throw new ArgumentException("File name must be provided.", nameof(fileName));
        }

        return $"orgs/{orgId}/workspaces/{workspaceId}/diagrams/{diagramId}/original/{fileName}";
    }

    public static string GetAnalysisReportPath(Guid orgId, Guid workspaceId, Guid analysisId)
    {
        return $"orgs/{orgId}/workspaces/{workspaceId}/analysis/{analysisId}/report.json";
    }
}
