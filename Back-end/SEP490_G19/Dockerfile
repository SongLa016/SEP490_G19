# 1. Dùng SDK để build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 2. Copy tất cả project vào container
COPY BallSport.API ./BallSport.API
COPY BallSport.Application ./BallSport.Application
COPY BallSport.Infrastructure ./BallSport.Infrastructure

# 3. Restore package (chạy trong thư mục API)
WORKDIR /src/BallSport.API
RUN dotnet restore

# 4. Publish API ra folder /app
RUN dotnet publish -c Release -o /app

# 5. Dùng runtime image nhẹ hơn để chạy
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
ENTRYPOINT ["dotnet", "BallSport.API.dll"]
