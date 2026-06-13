using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Models;
using CoArchitect.Infrastructure.Settings;
using Microsoft.Extensions.Caching.Memory;
using System.Security.Cryptography;
using System.Text;

namespace CoArchitect.Infrastructure.Services;

public sealed class HybridFoundryIqKnowledgeProvider : IFoundryIqKnowledgeProvider
{
    private readonly FoundryIqOptions _options;
    private readonly AzureFoundryIqProvider _managedProvider;
    private readonly FileSystemFoundryIqProvider _localProvider;
    private readonly IMemoryCache _cache;

    public HybridFoundryIqKnowledgeProvider(
        FoundryIqOptions options,
        AzureFoundryIqProvider managedProvider,
        FileSystemFoundryIqProvider localProvider,
        IMemoryCache cache)
    {
        _options = options;
        _managedProvider = managedProvider;
        _localProvider = localProvider;
        _cache = cache;
    }

    public async Task<FoundryIqContextBundle> RetrieveContextAsync(FoundryIqQuery query, CancellationToken cancellationToken)
    {
        var cacheKey = BuildCacheKey(query, _options.Provider);
        if (_cache.TryGetValue(cacheKey, out FoundryIqContextBundle? cached) && cached is not null)
        {
            return cached;
        }

        FoundryIqContextBundle result;
        if (_options.UseLocalOnly)
        {
            result = await _localProvider.RetrieveContextAsync(query, cancellationToken);
            CacheBundle(cacheKey, result);
            return result;
        }

        if (_options.PreferManagedFoundry)
        {
            var managed = await _managedProvider.RetrieveContextAsync(query, cancellationToken);
            if (HasUsefulManagedContext(managed) && !managed.FallbackUsed)
            {
                CacheBundle(cacheKey, managed);
                return managed;
            }

            var localFallback = await _localProvider.RetrieveContextAsync(query, cancellationToken);
            result = new FoundryIqContextBundle
            {
                RetrievalProvider = "LocalKnowledgeBase",
                FallbackUsed = true,
                FallbackReason = managed.FallbackReason ?? "Azure Foundry IQ was unavailable.",
                FrameworkGuidanceItems = localFallback.FrameworkGuidanceItems,
                PrincipleItems = localFallback.PrincipleItems,
                TradeoffItems = localFallback.TradeoffItems,
                ComplianceItems = localFallback.ComplianceItems,
                AdrTemplateItems = localFallback.AdrTemplateItems,
                WorkspaceMemoryItems = localFallback.WorkspaceMemoryItems,
                RelatedFindingItems = localFallback.RelatedFindingItems,
                RelatedAdrHistoryItems = localFallback.RelatedAdrHistoryItems,
                CitationRefs = localFallback.CitationRefs
                    .Concat(new[] { managed.FallbackReason ?? "Azure Foundry IQ unavailable; local knowledge base fallback was used." })
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList(),
                WorkspaceMemory = localFallback.WorkspaceMemory,
            };
            CacheBundle(cacheKey, result);
            return result;
        }

        result = await _localProvider.RetrieveContextAsync(query, cancellationToken);
        CacheBundle(cacheKey, result);
        return result;
    }

    private void CacheBundle(string cacheKey, FoundryIqContextBundle bundle)
    {
        _cache.Set(cacheKey, bundle, TimeSpan.FromSeconds(30));
    }

    private static string BuildCacheKey(FoundryIqQuery query, string provider)
    {
        var fingerprint = string.Join('|',
            provider,
            query.DiagramName,
            query.ArchitectureDescription,
            string.Join(',', query.SuggestedFrameworks.OrderBy(item => item)),
            string.Join(',', query.SuggestedStandards.OrderBy(item => item)),
            string.Join(',', query.QualityAttributeWeights.OrderBy(item => item.Key).Select(item => $"{item.Key}:{item.Weight}")),
            query.ReviewContext.BusinessDomain,
            query.ReviewContext.TargetUsers,
            query.ReviewContext.ExpectedTraffic,
            query.ReviewContext.DataSensitivity,
            query.ReviewContext.CloudProviderPreference,
            query.ReviewContext.ComplianceNeeds,
            query.ReviewContext.CurrentPainPoints);

        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(fingerprint));
        return $"foundry-iq:{Convert.ToHexString(hash)}";
    }

    private static bool HasUsefulManagedContext(FoundryIqContextBundle bundle)
    {
        return bundle.FrameworkGuidanceItems.Count > 0 ||
               bundle.PrincipleItems.Count > 0 ||
               bundle.TradeoffItems.Count > 0 ||
               bundle.ComplianceItems.Count > 0 ||
               bundle.AdrTemplateItems.Count > 0;
    }
}
