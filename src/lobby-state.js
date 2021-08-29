class LobbyState {
  name;
  key;
  language;
  slots;
  drawingID;
  myID;
  ownerID;
  round;
  roundMax;
  time;
  timeMax;
  useCustomWordsExclusive;
  inGame;
  players;

  constructor(data) {
    Object.assign(this, data);

    this.players = new Map();

    for(const player of data.players) {
      this.players.set(player.id, player);
    }
  }

  connectSynchronizationEvents(socket) {
    socket.on("lobbyLanguage", data => this.language = data);
    socket.on("lobbyRounds", data => this.roundMax = data);
    socket.on("lobbyDrawTime", data =>  this.timeMax = data);
    socket.on("lobbyCustomWordsExclusive", data => this.useCustomWordsExclusive = data);
    socket.on("lobbyPlayerConnected", data => this.players.set(data.id, data));
    socket.on("lobbyPlayerDisconnected", data => this.players.delete(data));
    socket.on("lobbyPlayerGuessedWord", data => this.players.get(data).guessedWord = true);
    socket.on("lobbyPlayerDrawing", data => this.drawingID = data);
    socket.on("lobbyOwnerChanged", data => this.ownerID = data);
    socket.on("lobbyRound", data => this.round = data);
    socket.on("lobbyReveal", () => { /* todo */ });
  }
}

module.exports = LobbyState;
