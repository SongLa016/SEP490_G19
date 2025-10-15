# Dùng image .NET SDK để build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy tất cả file dự án
COPY . .

# Restore và publish
RUN dotnet restore
RUN dotnet publish -c Release -o /app

# Dùng runtime image nhẹ hơn để chạy
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app .

# Cổng Render mặc định là 10000 hoặc 8080
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "BallSport.API.dll"]
