using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Models;
using CoArchitect.Infrastructure.Settings;

namespace CoArchitect.Infrastructure.Services;

public sealed class HybridFoundryIqKnowledgeProvider : IFoundryIqKnowledgeProvider
{
    private readonly FoundryIqOptions _options;
    private readonly AzureFoundryIqProvider _managedProvider;
    private readonly FileSystemFoundryIqProvider _localProvider;

    public HybridFoundryIqKnowledgeProvider(
        FoundryIqOptions options,
        AzureFoundryIqProvider managedProvider,
        FileSystemFoundryIqProvider localProvider)
    {
        _options = options;
        _managedProvider = managedProvider;
        _localProvider = localProvider;
    }

    public async Task<FoundryIqContextBundle> RetrieveContextAsync(FoundryIqQuery query, CancellationToken cancellationToken)
    {
        if (_options.UseLocalOnly)
        {
            return await _localProvider.RetrieveContextAsync(query, cancellationToken);
        }

        if (_options.PreferManagedFoundry)
        {
            var managed = await _managedProvider.RetrieveContextAsync(query, cancellationToken);
            if (HasUsefulManagedContext(managed) && !managed.FallbackUsed)
            {
                return managed;
            }

            var localFallback = await _localProvider.RetrieveContextAsync(query, cancellationToken);
            return new FoundryIqContextBundle
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
        }

        return await _localProvider.RetrieveContextAsync(query, cancellationToken);
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
