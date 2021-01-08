const { GameServer, playGame } = require("./lib/controller");
const assign = {
  人狼: 1,
  市民: 3,
};

const playGameOnce = async (assign, port, staticDir="../client/out/") => {
  const server = new GameServer(staticDir, port)
  server.start();
  await playGame(assign, server);
  server.close()
}

playGameOnce(assign, 3000)
