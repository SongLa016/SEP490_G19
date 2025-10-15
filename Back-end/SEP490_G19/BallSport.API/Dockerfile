# Dùng image .NET SDK để build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY BallSport.Application ./BallSport.Application
COPY BallSport.Domain ./BallSport.Domain
COPY BallSport.Infrastructure ./BallSport.Infrastructure
COPY BallSport.API ./BallSport.API

WORKDIR /src/BallSport.API
RUN dotnet restore
RUN dotnet publish -c Release -o /app

# Dùng runtime image nhẹ hơn để chạy
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "BallSport.API.dll"]
