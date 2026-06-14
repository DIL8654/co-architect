using CoArchitect.Api.Controllers;
using CoArchitect.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.RateLimiting;
using Xunit;

namespace CoArchitect.Application.Tests;

public sealed class AnalysisRateLimitingTests
{
    [Fact]
    public void RunAnalysis_UsesExpectedRateLimitingPolicy()
    {
        var method = typeof(DiagramAnalysisController).GetMethod(nameof(DiagramAnalysisController.RunAnalysis));
        Assert.NotNull(method);

        var attribute = method!.GetCustomAttributes(typeof(EnableRateLimitingAttribute), inherit: true)
            .OfType<EnableRateLimitingAttribute>()
            .SingleOrDefault();

        Assert.NotNull(attribute);
        Assert.Equal(AnalysisRateLimiting.PolicyName, attribute!.PolicyName);
    }

    [Fact]
    public void RateLimitingConfiguration_UsesExpectedDefaults()
    {
        Assert.Equal(5, AnalysisRateLimiting.PermitLimit);
        Assert.Equal(TimeSpan.FromMinutes(1), AnalysisRateLimiting.Window);
    }

    [Fact]
    public void CreateProblemDetails_IncludesFriendlyCostSensitiveMessageAndRetryHint()
    {
        var httpContext = new DefaultHttpContext();
        var result = AnalysisRateLimiting.CreateProblemDetails(new FakeProblemDetailsFactory(), httpContext, TimeSpan.FromSeconds(60));

        Assert.Equal(StatusCodes.Status429TooManyRequests, result.Status);
        Assert.Equal(AnalysisRateLimiting.ProblemTitle, result.Title);
        Assert.Contains("cost-sensitive AI analysis", result.Detail, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("60 seconds", result.Detail, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ResolveClientKey_FallsBackWhenRemoteIpIsMissing()
    {
        var httpContext = new DefaultHttpContext();
        Assert.Equal("unknown-client", AnalysisRateLimiting.ResolveClientKey(httpContext));
    }

    private sealed class FakeProblemDetailsFactory : ProblemDetailsFactory
    {
        public override ProblemDetails CreateProblemDetails(
            HttpContext httpContext,
            int? statusCode = null,
            string? title = null,
            string? type = null,
            string? detail = null,
            string? instance = null)
        {
            return new ProblemDetails
            {
                Status = statusCode,
                Title = title,
                Type = type,
                Detail = detail,
                Instance = instance,
            };
        }

        public override ValidationProblemDetails CreateValidationProblemDetails(
            HttpContext httpContext,
            ModelStateDictionary modelStateDictionary,
            int? statusCode = null,
            string? title = null,
            string? type = null,
            string? detail = null,
            string? instance = null)
        {
            return new ValidationProblemDetails(modelStateDictionary)
            {
                Status = statusCode,
                Title = title,
                Type = type,
                Detail = detail,
                Instance = instance,
            };
        }
    }
}
