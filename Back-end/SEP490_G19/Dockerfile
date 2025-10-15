# ==============================
# Build stage
# ==============================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy tất cả các project vào container
COPY BallSport.Application ./BallSport.Application
COPY BallSport.Infrastructure ./BallSport.Infrastructure
COPY BallSport.API ./BallSport.API

# Restore và build API
WORKDIR /src/BallSport.API
RUN dotnet restore BallSport.API.csproj
RUN dotnet publish BallSport.API.csproj -c Release -o /app

# ==============================
# Runtime stage
# ==============================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "BallSport.API.dll"]
