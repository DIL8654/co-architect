using CoArchitect.Application.Interfaces;
using CoArchitect.Infrastructure.Settings;

namespace CoArchitect.Infrastructure.Storage;

public sealed class SasBlobArchitectureFileStorage : IArchitectureFileStorage
{
    private readonly HttpClient _httpClient;
    private readonly ArchitectureStorageOptions _options;

    public SasBlobArchitectureFileStorage(HttpClient httpClient, ArchitectureStorageOptions options)
    {
        _httpClient = httpClient;
        _options = options;
    }

    public async Task<string?> SaveDiagramFileAsync(
        Guid organizationId,
        Guid workspaceId,
        Guid diagramId,
        string fileName,
        Stream content,
        string contentType,
        CancellationToken cancellationToken)
    {
        if (!_options.UseAzureBlobSas)
        {
            return null;
        }

        var path = ArchitectureStoragePathHelper.GetDiagramOriginalPath(
            organizationId,
            workspaceId,
            diagramId,
            fileName);
        var uploadUri = BuildBlobUri(_options.ContainerSasUrl!, path);

        using var request = new HttpRequestMessage(HttpMethod.Put, uploadUri);
        request.Headers.Add("x-ms-blob-type", "BlockBlob");
        request.Content = new StreamContent(content);
        request.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(
            string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType);

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        return uploadUri.ToString();
    }

    private static Uri BuildBlobUri(string containerSasUrl, string blobPath)
    {
        var separatorIndex = containerSasUrl.IndexOf('?', StringComparison.Ordinal);
        var baseUrl = separatorIndex >= 0 ? containerSasUrl[..separatorIndex] : containerSasUrl;
        var query = separatorIndex >= 0 ? containerSasUrl[separatorIndex..] : string.Empty;
        var escapedPath = string.Join(
            '/',
            blobPath.Split('/', StringSplitOptions.RemoveEmptyEntries)
                .Select(Uri.EscapeDataString));

        return new Uri($"{baseUrl.TrimEnd('/')}/{escapedPath}{query}");
    }
}
