# 1. Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy toàn bộ project
COPY BallSport.API ./BallSport.API
COPY BallSport.Application ./BallSport.Application
COPY BallSport.Infrastructure ./BallSport.Infrastructure

# Restore
WORKDIR /src/BallSport.API
RUN dotnet restore

# Publish
RUN dotnet publish -c Release -o /app

# 2. Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .

# ⚡ Khai báo PORT cho Render (rất quan trọng)
ENV ASPNETCORE_URLS=http://+:8080

# ⚡ Chạy API
ENTRYPOINT ["dotnet", "BallSport.API.dll"]
