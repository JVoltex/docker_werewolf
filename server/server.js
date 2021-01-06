const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const Game = require("./lib/game")
const Member = require("./lib/member")

app.use(express.static("../client/out"));

const assign = {
  人狼: 1,
  市民: 2,
};

function waitForMember(n) {
  const members = [];
  return new Promise((resolve, reject) => {
    io.on("connection", (socket) => {
      socket.on("clientMemberJoin", (name) => {
        members.push({
          socket: socket,
          name: name,
          job: null,
          alive: true,
          rand: Math.random(),
        });
        io.emit(
          "serverMemberJoin",
          members.map((x) => {
            return { name: x.name, alive: true };
          })
        );
        socket.emit("serverMessage", {
          type: "plain",
          text: `村長「ようこそ${name}さん。`,
        });
        socket.emit("serverMessage", {
          type: "plain",
          text: `村長「皆が揃うまでしばし待たれよ。`,
        });
        console.log(`clientMemberJoin: ${name}`);
        if (members.length === n) {
          members.map((x) => x.socket.removeAllListeners("clientMemberJoin"));
          resolve(members);
        }
      });
    });
  });
}


async function playGame(assign) {
  const n = Object.values(assign).reduce((sum, n) => (sum += n), 0);
  const members = await waitForMember(n);
  const game = new Game(members, assign);
  while (game.status !== "done") {
    await game.proceed();
  }
  server.close();
  io.close();
}

server.listen(3000);
playGame(assign);
