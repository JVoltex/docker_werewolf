const { createServer, playGame } = require("./lib/controller");
const assign = {
  人狼: 1,
  市民: 2,
};

const playGameOnce = async (assign, port, static_dir="../client/out/") => {
  const server = createServer(static_dir, port)
  server.http.listen(port);
  await playGame(assign, server.ws);
  server.http.close()
  server.ws.close()
}

playGameOnce(assign, 3000)
