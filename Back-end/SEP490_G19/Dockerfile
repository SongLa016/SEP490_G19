# =========================
# 1. Build stage
# =========================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy toàn bộ project vào container
COPY BallSport.API ./BallSport.API
COPY BallSport.Application ./BallSport.Application
COPY BallSport.Infrastructure ./BallSport.Infrastructure

# Restore tất cả project (từ BallSport.API.csproj, sẽ tự restore các project reference)
WORKDIR /src/BallSport.API
RUN dotnet restore

# Build & Publish project API
RUN dotnet publish -c Release -o /app --no-restore

# =========================
# 2. Runtime stage
# =========================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copy từ build stage
COPY --from=build /app ./

# Khai báo PORT cho Render hoặc bất kỳ cloud hosting nào
ENV ASPNETCORE_URLS=http://+:8080

# Chạy API
ENTRYPOINT ["dotnet", "BallSport.API.dll"]
