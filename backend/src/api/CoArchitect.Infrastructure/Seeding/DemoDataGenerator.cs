using CoArchitect.Domain.Entities;
using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Models;

namespace CoArchitect.Infrastructure.Seeding;

public static class DemoDataGenerator
{
    public static readonly Guid OrganizationId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid PoorDiagramId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    public static readonly Guid MediumDiagramId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    public static readonly Guid EnterpriseDiagramId = Guid.Parse("55555555-5555-5555-5555-555555555555");

    public static readonly Guid OwnerUserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    public static readonly Guid WriterUserId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    public static readonly Guid CommenterUserId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    public static readonly Guid ReaderUserId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private static readonly DateTime SeedBase = new DateTime(2026, 4, 1, 9, 0, 0, DateTimeKind.Utc);

    public static IReadOnlyList<Organization> Organizations { get; } = new[] { CreateOrganization() };
    public static IReadOnlyList<Workspace> Workspaces { get; } = new[] { CreateWorkspace() };
    public static IReadOnlyList<ArchitectureDiagram> Diagrams { get; } = new[]
    {
        CreatePoorArchitectureDiagram(),
        CreateMediumArchitectureDiagram(),
        CreateEnterpriseArchitectureDiagram(),
    };
    public static IReadOnlyList<AgentAnalysisRun> AnalysisRuns { get; } = new[]
    {
        CreateAnalysisRun(PoorDiagramId, WorkspaceId, SeedBase.AddDays(1)),
        CreateAnalysisRun(MediumDiagramId, WorkspaceId, SeedBase.AddDays(2)),
        CreateAnalysisRun(EnterpriseDiagramId, WorkspaceId, SeedBase.AddDays(3)),
    };

    public static bool TryGetScenario(Guid diagramId, out DemoScenario scenario)
    {
        if (diagramId == PoorDiagramId)
        {
            scenario = DemoScenario.Poor;
            return true;
        }

        if (diagramId == MediumDiagramId)
        {
            scenario = DemoScenario.Medium;
            return true;
        }

        if (diagramId == EnterpriseDiagramId)
        {
            scenario = DemoScenario.Enterprise;
            return true;
        }

        scenario = DemoScenario.Medium;
        return false;
    }

    public static AgentAnalysisResult CreateAnalysisResult(Guid diagramId, string? diagramContent = null)
    {
        var scenario = ResolveScenario(diagramId, diagramContent);
        return scenario switch
        {
            DemoScenario.Poor => BuildPoorAnalysis(diagramId),
            DemoScenario.Medium => BuildMediumAnalysis(diagramId),
            DemoScenario.Enterprise => BuildEnterpriseAnalysis(diagramId),
            _ => BuildMediumAnalysis(diagramId),
        };
    }

    private static DemoScenario ResolveScenario(Guid diagramId, string? diagramContent)
    {
        if (TryGetScenario(diagramId, out var scenario))
        {
            return scenario;
        }

        var content = (diagramContent ?? string.Empty).ToLowerInvariant();

        if (content.Contains("multi-region") || content.Contains("enterprise") || content.Contains("zero trust"))
        {
            return DemoScenario.Enterprise;
        }

        if (content.Contains("monolith") || content.Contains("single vm") || content.Contains("local files"))
        {
            return DemoScenario.Poor;
        }

        return DemoScenario.Medium;
    }

    private static Organization CreateOrganization()
    {
        var members = new List<OrganizationUser>
        {
            new()
            {
                Id = Guid.Parse("10000000-0000-0000-0000-000000000001"),
                OrganizationId = OrganizationId,
                UserId = OwnerUserId,
                AddedByUserId = OwnerUserId,
                Role = OrganizationRole.Owner,
                JoinedAt = SeedBase.AddDays(-42)
            },
            new()
            {
                Id = Guid.Parse("10000000-0000-0000-0000-000000000002"),
                OrganizationId = OrganizationId,
                UserId = WriterUserId,
                AddedByUserId = OwnerUserId,
                Role = OrganizationRole.Writer,
                JoinedAt = SeedBase.AddDays(-28)
            },
            new()
            {
                Id = Guid.Parse("10000000-0000-0000-0000-000000000003"),
                OrganizationId = OrganizationId,
                UserId = CommenterUserId,
                AddedByUserId = OwnerUserId,
                Role = OrganizationRole.Commenter,
                JoinedAt = SeedBase.AddDays(-18)
            },
            new()
            {
                Id = Guid.Parse("10000000-0000-0000-0000-000000000004"),
                OrganizationId = OrganizationId,
                UserId = ReaderUserId,
                AddedByUserId = OwnerUserId,
                Role = OrganizationRole.Reader,
                JoinedAt = SeedBase.AddDays(-8)
            },
        };

        var workspaces = new List<Workspace> { CreateWorkspace() };

        return new Organization
        {
            Id = OrganizationId,
            Name = "Contoso Architecture Team",
            CreatedAt = SeedBase.AddDays(-60),
            UpdatedAt = SeedBase.AddDays(-2),
            Members = members,
            Workspaces = workspaces,
        };
    }

    private static Workspace CreateWorkspace()
    {
        var diagrams = new List<ArchitectureDiagram>
        {
            CreatePoorArchitectureDiagram(),
            CreateMediumArchitectureDiagram(),
            CreateEnterpriseArchitectureDiagram(),
        };

        return new Workspace
        {
            Id = WorkspaceId,
            TenantId = OrganizationId,
            Name = "Enterprise SaaS Platform",
            CreatedAt = SeedBase.AddDays(-35),
            UpdatedAt = SeedBase.AddDays(-1),
            Diagrams = diagrams,
        };
    }

    private static ArchitectureDiagram CreatePoorArchitectureDiagram()
    {
        return new ArchitectureDiagram
        {
            Id = PoorDiagramId,
            WorkspaceId = WorkspaceId,
            UploadedByUserId = WriterUserId,
            Name = "Poor Architecture",
            OriginalFileName = "poor-architecture.drawio",
            Description = "Single-region monolith with local file storage, direct database access, and no explicit failover or security boundary.",
            ReviewContext = new ArchitectureReviewContext
            {
                BusinessDomain = "B2B SaaS",
                TargetUsers = "External customer tenants and support engineers",
                ExpectedTraffic = "Moderate daytime traffic with peak month-end reporting",
                DataSensitivity = "Customer operational data with tenant separation concerns",
                CloudProviderPreference = "Cloud-neutral",
                ComplianceNeeds = "Basic auditability and tenant isolation",
                CurrentPainPoints = "No monitoring, weak secrets management, and single-region risk",
            },
            FrameworkSelection = new FrameworkSelectionResult
            {
                Mode = FrameworkSelectionMode.AutoDetect,
                DetectedCloudProvider = "Cloud-neutral",
                ConfidenceScore = 0.76,
                SelectedFrameworks = new List<ReviewFramework> { ReviewFramework.Iso25010, ReviewFramework.OwaspAsvs },
                SelectionRationale = new List<string>
                {
                    "ISO/IEC 25010 was chosen as the cloud-neutral quality baseline.",
                    "OWASP ASVS was added because the SaaS platform exposes APIs and tenant-sensitive data."
                }
            },
            QualityAttributeWeights = DefaultWeights(),
            UploadedAt = SeedBase.AddDays(-7),
        };
    }

    private static ArchitectureDiagram CreateMediumArchitectureDiagram()
    {
        return new ArchitectureDiagram
        {
            Id = MediumDiagramId,
            WorkspaceId = WorkspaceId,
            UploadedByUserId = CommenterUserId,
            Name = "Medium Architecture",
            OriginalFileName = "medium-architecture.drawio",
            Description = "Three-tier SaaS platform with app services, managed database, blob storage, and a queue-based background worker layer.",
            ReviewContext = new ArchitectureReviewContext
            {
                BusinessDomain = "B2B SaaS",
                TargetUsers = "Operations teams and external customers",
                ExpectedTraffic = "Steady daily traffic with periodic batch spikes",
                DataSensitivity = "Tenant data and internal support workflows",
                CloudProviderPreference = "Azure",
                ComplianceNeeds = "SOC 2 style controls and audit logging",
                CurrentPainPoints = "Need better observability and stronger platform guardrails",
            },
            FrameworkSelection = new FrameworkSelectionResult
            {
                Mode = FrameworkSelectionMode.AutoDetect,
                DetectedCloudProvider = "Azure",
                ConfidenceScore = 0.91,
                SelectedFrameworks = new List<ReviewFramework> { ReviewFramework.AzureWellArchitected, ReviewFramework.Iso25010, ReviewFramework.OwaspAsvs },
                SelectionRationale = new List<string>
                {
                    "Azure Well-Architected was selected because Azure platform services are implied in the description.",
                    "ISO/IEC 25010 was included for maintainability and broader product quality review.",
                    "OWASP ASVS was included because the system exposes APIs and tenant-sensitive workflows."
                }
            },
            QualityAttributeWeights = DefaultWeights(),
            UploadedAt = SeedBase.AddDays(-5),
        };
    }

    private static ArchitectureDiagram CreateEnterpriseArchitectureDiagram()
    {
        return new ArchitectureDiagram
        {
            Id = EnterpriseDiagramId,
            WorkspaceId = WorkspaceId,
            UploadedByUserId = OwnerUserId,
            Name = "Enterprise Architecture",
            OriginalFileName = "enterprise-architecture.drawio",
            Description = "Globally distributed SaaS platform with zero-trust edge access, multi-region failover, event-driven services, and centralized governance.",
            ReviewContext = new ArchitectureReviewContext
            {
                BusinessDomain = "Enterprise platform",
                TargetUsers = "Global customers, partner integrations, and internal platform teams",
                ExpectedTraffic = "High global traffic with continuous regional demand",
                DataSensitivity = "PII and regulated enterprise operational data",
                CloudProviderPreference = "Azure",
                ComplianceNeeds = "Security, resiliency, and regulated workload governance",
                CurrentPainPoints = "Balancing platform leverage with team autonomy and cost control",
            },
            FrameworkSelection = new FrameworkSelectionResult
            {
                Mode = FrameworkSelectionMode.AutoDetect,
                DetectedCloudProvider = "Azure",
                ConfidenceScore = 0.93,
                SelectedFrameworks = new List<ReviewFramework> { ReviewFramework.AzureWellArchitected, ReviewFramework.Iso25010, ReviewFramework.OwaspAsvs },
                SelectionRationale = new List<string>
                {
                    "Azure Well-Architected was selected because the platform appears Azure-oriented and enterprise-scale.",
                    "ISO/IEC 25010 was included to balance maintainability and product quality concerns.",
                    "OWASP ASVS was included because the platform handles external users and sensitive data."
                }
            },
            QualityAttributeWeights = DefaultWeights(),
            UploadedAt = SeedBase.AddDays(-2),
        };
    }

    private static List<QualityAttributeWeight> DefaultWeights()
    {
        return new List<QualityAttributeWeight>
        {
            new() { Key = "security", Label = "Security", Weight = 25 },
            new() { Key = "availability", Label = "Availability", Weight = 20 },
            new() { Key = "scalability", Label = "Scalability", Weight = 15 },
            new() { Key = "cost", Label = "Cost", Weight = 10 },
            new() { Key = "maintainability", Label = "Maintainability", Weight = 10 },
            new() { Key = "compliance", Label = "Compliance", Weight = 10 },
            new() { Key = "deliverySpeed", Label = "Delivery Speed", Weight = 10 },
        };
    }

    private static AgentAnalysisRun CreateAnalysisRun(Guid diagramId, Guid workspaceId, DateTime requestedAt)
    {
        return new AgentAnalysisRun
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            ArchitectureDiagramId = diagramId,
            Status = AnalysisRunStatus.Completed,
            RequestedAt = requestedAt,
            StartedAt = requestedAt.AddMinutes(2),
            CompletedAt = requestedAt.AddMinutes(7),
            Suggestions = new List<AgentSuggestion>()
        };
    }

    private static AgentAnalysisResult BuildPoorAnalysis(Guid diagramId)
    {
        return new AgentAnalysisResult
        {
            ArchitectureDiagramId = diagramId,
            RequestedAt = SeedBase.AddDays(1).AddHours(1),
            CompletedAt = SeedBase.AddDays(1).AddHours(1).AddMinutes(6),
            Evidence = new List<EvidenceItem>
            {
                new() { Summary = "Application, API, and database share a single failure domain.", Details = "The diagram shows no horizontal separation or regional redundancy.", },
                new() { Summary = "Secrets appear embedded in the application runtime.", Details = "No managed secret store or identity boundary is shown for credentials.", },
                new() { Summary = "Operational visibility is absent.", Details = "No monitoring, tracing, or alerting components are represented.", },
            },
            MissingControls = new List<MissingControl>
            {
                new() { Name = "Managed secrets and identity", Description = "Use Azure Key Vault and managed identities instead of embedded secrets.", Dimension = ArchitectureDimension.Security },
                new() { Name = "Multi-region failover", Description = "Add zone-redundant or multi-region failover to remove the single point of failure.", Dimension = ArchitectureDimension.ReliabilityAvailability },
                new() { Name = "Cache and scale-out layer", Description = "Introduce Redis caching and horizontal scale for burst traffic.", Dimension = ArchitectureDimension.ScalabilityPerformance },
                new() { Name = "Monitoring and alerting", Description = "Add Application Insights, Log Analytics, and actionable alerts.", Dimension = ArchitectureDimension.OperationalExcellence },
                new() { Name = "Tenant isolation controls", Description = "Enforce tenant-scoped data access and isolate shared resources.", Dimension = ArchitectureDimension.DataTenantIsolation },
                new() { Name = "Governance and policy guardrails", Description = "Use Azure Policy and change control to prevent drift.", Dimension = ArchitectureDimension.ComplianceGovernance },
            },
            Recommendations = new List<Recommendation>
            {
                new() { Description = "Move secrets to Azure Key Vault and replace direct credential usage with managed identity.", Severity = SuggestionSeverity.Critical },
                new() { Description = "Add a standby region with tested failover and backup restore drills.", Severity = SuggestionSeverity.High },
                new() { Description = "Introduce a cache tier and queue-based background processing for load spikes.", Severity = SuggestionSeverity.High },
                new() { Description = "Enable App Insights, distributed tracing, and alert routing before broader release.", Severity = SuggestionSeverity.Medium },
                new() { Description = "Formalize tenant isolation and policy-as-code guardrails to reduce blast radius.", Severity = SuggestionSeverity.Medium },
            },
            Tradeoffs = new List<Tradeoff>
            {
                new()
                {
                    Summary = "Use Redis Cache",
                    Pros = new List<string> { "Faster reads", "Lower database load" },
                    Cons = new List<string> { "Additional operational complexity", "Cache invalidation risk" },
                },
                new()
                {
                    Summary = "Keep a single-region deployment",
                    Pros = new List<string> { "Simpler operations", "Lower short-term cost" },
                    Cons = new List<string> { "Poor resilience", "Long recovery time after an outage" },
                },
            },
            DimensionMaturitySuggestions = BuildSuggestions(new[] { 1, 1, 1, 0, 0, 0, 0, 0 }),
        };
    }

    private static AgentAnalysisResult BuildMediumAnalysis(Guid diagramId)
    {
        return new AgentAnalysisResult
        {
            ArchitectureDiagramId = diagramId,
            RequestedAt = SeedBase.AddDays(2).AddHours(1),
            CompletedAt = SeedBase.AddDays(2).AddHours(1).AddMinutes(6),
            Evidence = new List<EvidenceItem>
            {
                new() { Summary = "Core application services are separated from the database tier.", Details = "The diagram shows a more maintainable separation of concerns than the poor architecture baseline.", },
                new() { Summary = "Background work is queued, but retry and poison-message handling are not explicit.", Details = "Operational resilience is improved, but failure handling is incomplete.", },
                new() { Summary = "Secrets management and governance controls are still implicit.", Details = "The design is close to production, but not yet enterprise-grade.", },
            },
            MissingControls = new List<MissingControl>
            {
                new() { Name = "Managed secrets and identity", Description = "Move to Azure Key Vault and managed identities for the app and background worker.", Dimension = ArchitectureDimension.Security },
                new() { Name = "Autoscaling policy", Description = "Define scale-out rules for app services and background workers based on queue depth and CPU.", Dimension = ArchitectureDimension.ScalabilityPerformance },
                new() { Name = "Disaster recovery drill", Description = "Document recovery objectives and validate restore procedures across environments.", Dimension = ArchitectureDimension.ReliabilityAvailability },
                new() { Name = "Governance baseline", Description = "Add Azure Policy, tagging, and release approvals for shared resources.", Dimension = ArchitectureDimension.ComplianceGovernance },
            },
            Recommendations = new List<Recommendation>
            {
                new() { Description = "Adopt managed identity and Key Vault for all service-to-service credentials.", Severity = SuggestionSeverity.High },
                new() { Description = "Add autoscale rules on app services and queue workers to handle burst traffic.", Severity = SuggestionSeverity.Medium },
                new() { Description = "Introduce a tested disaster recovery playbook and cross-region backups.", Severity = SuggestionSeverity.Medium },
                new() { Description = "Capture governance controls with policy-as-code and mandatory tagging.", Severity = SuggestionSeverity.Medium },
            },
            Tradeoffs = new List<Tradeoff>
            {
                new()
                {
                    Summary = "Use queue-based background processing",
                    Pros = new List<string> { "Smooths traffic spikes", "Decouples request latency from long-running work" },
                    Cons = new List<string> { "Requires retry and poison-message handling", "Harder to trace end-to-end" },
                },
                new()
                {
                    Summary = "Keep managed PaaS instead of containers",
                    Pros = new List<string> { "Faster delivery", "Lower operational overhead" },
                    Cons = new List<string> { "Less runtime flexibility", "Potential platform cost at scale" },
                },
            },
            DimensionMaturitySuggestions = BuildSuggestions(new[] { 3, 3, 3, 2, 2, 2, 2, 3 }),
        };
    }

    private static AgentAnalysisResult BuildEnterpriseAnalysis(Guid diagramId)
    {
        return new AgentAnalysisResult
        {
            ArchitectureDiagramId = diagramId,
            RequestedAt = SeedBase.AddDays(3).AddHours(1),
            CompletedAt = SeedBase.AddDays(3).AddHours(1).AddMinutes(6),
            Evidence = new List<EvidenceItem>
            {
                new() { Summary = "The platform uses zone-aware and multi-region deployment boundaries.", Details = "The design demonstrates strong availability and resilience posture.", },
                new() { Summary = "Governance and security are centrally enforced.", Details = "Identity, policy, and secret management are standardized across the estate.", },
                new() { Summary = "Telemetry and operational automation are explicit.", Details = "Monitoring, alerting, and runbooks support day-two operations.", },
            },
            MissingControls = new List<MissingControl>
            {
                new() { Name = "Cost guardrails", Description = "Add budget alerts and rightsizing reviews for premium-tier components.", Dimension = ArchitectureDimension.CostOptimization },
                new() { Name = "Maintainability automation", Description = "Expand golden-path automation and dependency update workflows.", Dimension = ArchitectureDimension.Maintainability },
            },
            Recommendations = new List<Recommendation>
            {
                new() { Description = "Add budget alerts and reserved-capacity guidance to keep the enterprise footprint efficient.", Severity = SuggestionSeverity.Medium },
                new() { Description = "Automate dependency updates, policy compliance, and release health reporting.", Severity = SuggestionSeverity.Low },
                new() { Description = "Keep validating failover and operational drills to sustain the current maturity level.", Severity = SuggestionSeverity.Low },
            },
            Tradeoffs = new List<Tradeoff>
            {
                new()
                {
                    Summary = "Use global active-active deployment",
                    Pros = new List<string> { "Highest resilience", "Low latency for distributed users" },
                    Cons = new List<string> { "Increased cost", "More complex operational coordination" },
                },
                new()
                {
                    Summary = "Centralize governance and policy",
                    Pros = new List<string> { "Consistent security posture", "Easier auditability" },
                    Cons = new List<string> { "Slower change approvals", "Requires strong platform ownership" },
                },
            },
            DimensionMaturitySuggestions = BuildSuggestions(new[] { 5, 5, 5, 4, 5, 4, 4, 5 }),
        };
    }

    private static List<DimensionMaturitySuggestion> BuildSuggestions(int[] values)
    {
        var dimensions = new[]
        {
            ArchitectureDimension.Security,
            ArchitectureDimension.ReliabilityAvailability,
            ArchitectureDimension.ScalabilityPerformance,
            ArchitectureDimension.OperationalExcellence,
            ArchitectureDimension.DataTenantIsolation,
            ArchitectureDimension.ComplianceGovernance,
            ArchitectureDimension.CostOptimization,
            ArchitectureDimension.Maintainability,
        };

        return dimensions.Select((dimension, index) => new DimensionMaturitySuggestion
        {
            Dimension = dimension,
            CurrentMaturity = Math.Max(0, values[index] - 1),
            SuggestedMaturity = values[index],
            Reason = GetReason(dimension, values[index]),
        }).ToList();
    }

    private static string GetReason(ArchitectureDimension dimension, int maturity)
    {
        return dimension switch
        {
            ArchitectureDimension.Security when maturity >= 5 => "Strong security baseline with managed identity, private connectivity, and central policy enforcement.",
            ArchitectureDimension.ReliabilityAvailability when maturity >= 5 => "Multi-region failover and tested recovery procedures are fully defined.",
            ArchitectureDimension.ScalabilityPerformance when maturity >= 5 => "Capacity is designed for burst traffic with queueing and autoscale.",
            ArchitectureDimension.OperationalExcellence when maturity >= 4 => "Monitoring, runbooks, and release automation reduce operational risk.",
            ArchitectureDimension.DataTenantIsolation when maturity >= 5 => "Tenant isolation boundaries are explicit in data and platform layers.",
            ArchitectureDimension.ComplianceGovernance when maturity >= 4 => "Policy, audit, and retention controls are embedded in the platform.",
            ArchitectureDimension.CostOptimization when maturity >= 4 => "Budgeting, reserved capacity, and rightsizing are managed continuously.",
            ArchitectureDimension.Maintainability when maturity >= 4 => "Service boundaries and deployment automation keep change manageable.",
            _ => "Baseline architecture capability is present but can be strengthened.",
        };
    }

    public enum DemoScenario
    {
        Poor,
        Medium,
        Enterprise,
    }
}
