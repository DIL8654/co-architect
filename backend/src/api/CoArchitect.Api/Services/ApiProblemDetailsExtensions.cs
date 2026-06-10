using Microsoft.AspNetCore.Mvc;

namespace CoArchitect.Api.Services;

public static class ApiProblemDetailsExtensions
{
    public static ActionResult ValidationProblemFor(
        this ControllerBase controller,
        string field,
        string message,
        string title = "Validation failed")
    {
        controller.ModelState.Clear();
        controller.ModelState.AddModelError(field, message);
        return controller.ValidationProblem(
            modelStateDictionary: controller.ModelState,
            detail: message,
            statusCode: StatusCodes.Status400BadRequest,
            title: title);
    }

    public static ActionResult NotFoundProblem(
        this ControllerBase controller,
        string detail,
        string title = "Resource not found")
    {
        return controller.Problem(
            detail: detail,
            statusCode: StatusCodes.Status404NotFound,
            title: title);
    }

    public static ActionResult ConflictProblem(
        this ControllerBase controller,
        string detail,
        string title = "Conflict")
    {
        return controller.Problem(
            detail: detail,
            statusCode: StatusCodes.Status409Conflict,
            title: title);
    }
}
