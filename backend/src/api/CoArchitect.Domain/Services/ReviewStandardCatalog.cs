using CoArchitect.Domain.Enums;

namespace CoArchitect.Domain.Services;

public static class ReviewStandardCatalog
{
    public static string ToCatalogKey(ReviewStandard standard)
    {
        return standard switch
        {
            ReviewStandard.Iso27001 => "ISO27001",
            ReviewStandard.Gdpr => "GDPR",
            ReviewStandard.Soc2 => "SOC2",
            ReviewStandard.Togaf => "TOGAF",
            ReviewStandard.Safe => "SAFe",
            _ => standard.ToString(),
        };
    }

    public static string ToDisplayLabel(ReviewStandard standard)
    {
        return standard switch
        {
            ReviewStandard.Iso27001 => "ISO 27001",
            ReviewStandard.Gdpr => "GDPR",
            ReviewStandard.Soc2 => "SOC 2",
            ReviewStandard.Togaf => "TOGAF",
            ReviewStandard.Safe => "SAFe",
            _ => standard.ToString(),
        };
    }
}
