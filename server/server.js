const { GameServer, playGame, inputAssign } = require("./lib/controller");

const playGameOnce = async (jobs, port, staticDir="../client/out/") => {
  const assign = await inputAssign(jobs)
  const server = new GameServer(staticDir, port)
  server.start();
  await playGame(assign, server);
  server.close()
}

const jobs = ["人狼", "占い師", "霊媒師", "狩人", "市民"]
playGameOnce(jobs, 3000)
