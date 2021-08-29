const io = require("socket.io-client");
const LobbyState = require("./lobby-state");

const BALANCER_SOCKET_URL = "https://skribbl.io:4999";

const getSomeGameServer = userData => new Promise((resolve, reject) => {
  const socket = io(BALANCER_SOCKET_URL, { forceNew: true, reconnection: false });

  socket.on("connect_error", reject);
  socket.on("result", data => {
    if(data.code) {
      resolve(data.host);
    } else {
      reject(data.msg);
    }
  });
  socket.on("connect", () => socket.emit("login", userData))
});

const joinSomeLobby = (captchaToken, gameServer, userData) => new Promise((resolve, reject) => {
  const socket = io(
    gameServer,
    { forceNew: true, query: { captchaToken }, reconnection: false }
  );

  socket.on("connect_error", reject);
  socket.on("disconnect", reason => {
    socket.close();
    reject(reason);
  });

  socket.on("connect", () => {
    socket.emit("userData", userData);

    socket.on("lobbyConnected", lobby => {
      socket.off("disconnect");
      socket.on("disconnect", () => {
        socket.close();
      });

      resolve([socket, new LobbyState(lobby)]);
    });

    socket.on("lobbyDisconnected", () => {
      socket.emit("lobbyLeave");
    });
  });
});

module.exports = { getSomeGameServer, joinLobby: joinSomeLobby };
