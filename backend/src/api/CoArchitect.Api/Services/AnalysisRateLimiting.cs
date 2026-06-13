using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;

namespace CoArchitect.Api.Services;

public static class AnalysisRateLimiting
{
    public const string PolicyName = "RunArchitectureReview";
    public const int PermitLimit = 5;
    public static readonly TimeSpan Window = TimeSpan.FromMinutes(1);
    public const string ProblemTitle = "Architecture review temporarily limited";

    public static string ResolveClientKey(HttpContext httpContext)
    {
        var clientKey = httpContext.Connection.RemoteIpAddress?.ToString();
        return string.IsNullOrWhiteSpace(clientKey) ? "unknown-client" : clientKey;
    }

    public static ProblemDetails CreateProblemDetails(
        ProblemDetailsFactory factory,
        HttpContext httpContext,
        TimeSpan? retryAfter)
    {
        var detail = retryAfter.HasValue
            ? $"This public MVP uses cost-sensitive AI analysis. To keep the service available, please wait about {Math.Max(1, (int)Math.Ceiling(retryAfter.Value.TotalSeconds))} seconds before starting another review."
            : "This public MVP uses cost-sensitive AI analysis. To keep the service available, please wait a minute before starting another review.";

        return factory.CreateProblemDetails(
            httpContext,
            statusCode: StatusCodes.Status429TooManyRequests,
            title: ProblemTitle,
            detail: detail);
    }
}
