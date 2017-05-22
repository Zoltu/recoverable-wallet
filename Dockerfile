FROM microsoft/aspnetcore-build:2.0

RUN npm install -g elm

WORKDIR /app/server
COPY dapp/server/server.csproj /app/server/server.csproj
RUN dotnet restore

WORKDIR /app/server
COPY dapp/server/Startup.cs /app/server/Startup.cs
RUN dotnet build

WORKDIR /app/client
COPY elm-package.json /app/client/elm-package.json
RUN sed -i 's|dapp/client|.|g' elm-package.json
RUN elm-make --yes
COPY dapp/client/index.html /app/client/index.html
COPY dapp/client/ /app/client/
RUN elm-make --yes /app/client/App.elm --output /app/client/app.js

WORKDIR /app/server

EXPOSE 80

ENTRYPOINT ["dotnet", "run"]
