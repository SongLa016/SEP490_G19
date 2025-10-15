# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy toàn bộ backend vào image
COPY Back-end/SEP490_G19/BallSport.Application ./BallSport.Application
COPY Back-end/SEP490_G19/BallSport.Infrastructure ./BallSport.Infrastructure
COPY Back-end/SEP490_G19/BallSport.API ./BallSport.API

# Restore và publish API
WORKDIR /src/BallSport.API
RUN dotnet restore ./BallSport.API.csproj
RUN dotnet publish ./BallSport.API.csproj -c Release -o /app

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "BallSport.API.dll"]
