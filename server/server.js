const { GameServer, playGame } = require("./lib/controller");
const assign = {
  人狼: 1,
  市民: 1,
  狩人: 1,
  占い師: 1,
  霊媒師: 1,
};

const playGameOnce = async (assign, port, staticDir="../client/out/") => {
  const server = new GameServer(staticDir, port)
  server.start();
  await playGame(assign, server);
  server.close()
}

playGameOnce(assign, 3000)
