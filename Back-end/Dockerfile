# Dựa trên SDK .NET
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Copy toàn bộ solution và các project vào container
COPY SEP490_G19/ ./SEP490_G19/

# Di chuyển vào project API
WORKDIR /src/SEP490_G19/BallSport.API

# Restore và publish
RUN dotnet restore
RUN dotnet publish -c Release -o /app

# ---- Runtime stage ----
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app ./
ENTRYPOINT ["dotnet", "BallSport.API.dll"]
