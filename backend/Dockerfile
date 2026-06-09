FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY src/api/CoArchitect.Api/CoArchitect.Api.csproj ./CoArchitect.Api/
COPY src/api/CoArchitect.Application/CoArchitect.Application.csproj ./CoArchitect.Application/
COPY src/api/CoArchitect.Domain/CoArchitect.Domain.csproj ./CoArchitect.Domain/
COPY src/api/CoArchitect.Infrastructure/CoArchitect.Infrastructure.csproj ./CoArchitect.Infrastructure/

RUN dotnet restore ./CoArchitect.Api/CoArchitect.Api.csproj

COPY src/api/CoArchitect.Api ./CoArchitect.Api
COPY src/api/CoArchitect.Application ./CoArchitect.Application
COPY src/api/CoArchitect.Domain ./CoArchitect.Domain
COPY src/api/CoArchitect.Infrastructure ./CoArchitect.Infrastructure

RUN dotnet publish ./CoArchitect.Api/CoArchitect.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80
ENTRYPOINT ["dotnet", "CoArchitect.Api.dll"]
