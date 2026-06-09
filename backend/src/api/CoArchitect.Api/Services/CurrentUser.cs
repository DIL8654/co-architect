namespace CoArchitect.Api.Services;

public sealed record CurrentUser(
    Guid UserId,
    string Email,
    string DisplayName
);
