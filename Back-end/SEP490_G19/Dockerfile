# =========================
# 1. Build stage
# =========================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY BallSport.API ./BallSport.API
COPY BallSport.Application ./BallSport.Application
COPY BallSport.Infrastructure ./BallSport.Infrastructure

WORKDIR /src/BallSport.API
RUN dotnet restore
RUN dotnet publish -c Release -o /app --no-restore

# =========================
# 2. Runtime stage
# =========================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

COPY --from=build /app ./

ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "BallSport.API.dll"]
