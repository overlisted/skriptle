require("dotenv").config();

const { getSomeGameServer, joinLobby } = require("./client");

const defaultUserData = {
  code: "",
  avatar: [2,16,17,-1],
  join: "",
  language: "English",
  createPrivate: false
};

const link = process.env.DISCORD_LINK_ID;
const discordVariants = ["discord", "dicord", "pisscord", "discrod"];
const messages = new Array(4).fill(null).map((it, i) => `${discordVariants[i]}/${link} `.repeat(5));

const maxNameLen = 12;

const log = (instance, actor, separator, message) => {
  console.log(`${instance.padEnd(maxNameLen)} | ${actor.padStart(maxNameLen)}${separator}${message}`);
}

const spamInRandomRoom = async (gameServer, userData, captchaToken) => {
  const simpleLog = message => log(userData.name, "", "=", "=> " + message);

  const [socket, state] = await joinLobby(captchaToken, gameServer, userData);
  simpleLog(`Joined lobby (players: ${Array.from(state.players.values()).map(it => it.name).join(", ")})`);

  socket.on("chat", data => {
    const sender = state.players.get(data.id);
    if (!sender) return;

    const drawing = state.drawingID == data.id;
    const guessed = sender.guessedWord;
    const postfix = drawing ? "->" : guessed ? "->" : "=>";

    log(userData.name, sender.name, " ", `${postfix} ${data.message}`);
  });

  socket.on("lobbySpam", () => simpleLog("Server detected spam"));
  socket.on("restartNotification", data => simpleLog(`Game server will restart in about ${data} seconds`));
  socket.on("lobbyVotekickCurrent", ([requester, toKick, votes, votesRequired]) => {
    simpleLog(`${state.players.get(requester).name} is voting to kick ${state.players.get(toKick).name} (${votes}/${votesRequired})`);
  });
  socket.on("lobbyGameEnd", () => {
    simpleLog("Game ended");
    socket.close();
  });
  socket.on("lobbyChooseWord", data => {
    if (data.id == state.myID) {
      simpleLog("Leaving because it's the player's turn");
      socket.emit("lobbyLeave");
    }
  });
  socket.on("lobbyPlayerConnected", data => simpleLog(`Player ${data.name} joined`));
  socket.on("lobbyPlayerDisconnected", data => simpleLog(`Player ${state.players.get(data).name} left`));

  state.connectSynchronizationEvents(socket);

  await new Promise(resolve => {
    let i = 0;
    const interval = setInterval(() => {
      socket.emit("chat", messages[i]);

      i++;
      if (i > messages.length) {
        clearInterval(interval);

        socket.emit("lobbyLeave");
        socket.close();

        resolve();
      }
    }, 500);
  });
}

const runInstance = async name => {
  const simpleLog = message => log(userData.name, "", "=", "=> " + message);

  const userData = {
    ...defaultUserData,
    name
  };

  try {
    const triedGameServers = [];
    let gameServer;

    const tryNewServer = async () => {
      let newServer;

      do {
        newServer = await getSomeGameServer(userData);
      } while(triedGameServers.includes(newServer));

      gameServer = newServer;
      triedGameServers.push(newServer);
      simpleLog(`Trying game server ${gameServer} (#${triedGameServers.length})`);
    };

    await tryNewServer();

    while (true) {
      try {
        await spamInRandomRoom(gameServer, userData, process.env.CAPTCHA_TOKEN);
      } catch(e) {
        if(e === "io server disconnect") {
          try {
            await tryNewServer();
          } catch {
            log(name, "!!!", "=", `=> ${e}`);

            break;
          }
        } else {
          log(name, "!!!", "=", `=> ${e}`);
        }
      }
    }
  } catch(e) {
    log(name, "!!!", "=", `=> ${e}`);
  }
}

const names = process.env.BOT_NAMES.split(",");

const main = async () => {
  console.log("Starting in 3 seconds");
  console.log(`Instances (${names.length}): ${names.join(", ")}`);

  await new Promise(resolve => setTimeout(resolve, 2500));

  const promises = [];

  for(const name of names) {
    await new Promise(resolve => setTimeout(resolve, 500));

    promises.push(runInstance(name));
  }

  await Promise.all(promises);
}

main();
