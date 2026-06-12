FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend/src/api/CoArchitect.Api/CoArchitect.Api.csproj ./CoArchitect.Api/
COPY backend/src/api/CoArchitect.Application/CoArchitect.Application.csproj ./CoArchitect.Application/
COPY backend/src/api/CoArchitect.Domain/CoArchitect.Domain.csproj ./CoArchitect.Domain/
COPY backend/src/api/CoArchitect.Infrastructure/CoArchitect.Infrastructure.csproj ./CoArchitect.Infrastructure/

RUN dotnet restore ./CoArchitect.Api/CoArchitect.Api.csproj

COPY backend/src/api/CoArchitect.Api ./CoArchitect.Api
COPY backend/src/api/CoArchitect.Application ./CoArchitect.Application
COPY backend/src/api/CoArchitect.Domain ./CoArchitect.Domain
COPY backend/src/api/CoArchitect.Infrastructure ./CoArchitect.Infrastructure
COPY docs /src/docs

RUN dotnet publish ./CoArchitect.Api/CoArchitect.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
COPY --from=build /src/docs ./docs
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80
ENTRYPOINT ["dotnet", "CoArchitect.Api.dll"]
