FROM microsoft/aspnetcore-build:2.0

COPY dapp/server/server.csproj /app/server/server.csproj
WORKDIR /app/server
RUN dotnet restore

COPY dapp/server/Startup.cs /app/server/Startup.cs
WORKDIR /app/server
RUN dotnet build

COPY dapp/client/ /app/client/

EXPOSE 80

ENTRYPOINT ["dotnet", "run"]
