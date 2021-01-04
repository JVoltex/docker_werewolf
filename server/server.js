const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.use(express.static("../client/out"));

const assign = {
  werewolf: 1,
  other: 2,
};

function waitForMember(n) {
  const members = [];
  return new Promise((resolve, reject) => {
    io.on("connection", (socket) => {
      socket.on("clientMemberJoin", (name) => {
        socket.on("clientMessage", (msg) => {
          io.emit("serverMessage", `${name}「${msg}`);
        }); //broadcast
        members.push({
          socket: socket,
          name: name,
          job: null,
          alive: true,
          rand: Math.random(),
        });
        io.emit(
          "serverMemberJoin",
          members.map((x) => x.name)
        );
        io.emit("serverMessage", `『${name}が入室しました`);
        console.log(`clientMemberJoin: ${name}`);
        if (members.length === n) {
          resolve(members);
        }
      });
    });
  });
}

class Game {
  constructor(members, assign) {
    this.members = members;
    this.assign = assign;
    this.status = "prepare";
  }
  async proceed() {
    switch (this.status) {
      case "prepare":
        return this.prepare();
      case "exit":
        return this.exit();
      case "day":
        return await this.day();
      default:
        throw Error("default");
    }
  }
  _broadcast(msg) {
    this.members.map((x) => x.socket.emit("serverMessage", msg));
  }
  async day() {
    this._broadcast("『夜が明けましたが人狼の気配が消えません。")
    this._broadcast("『誰が人狼だと思いますか。")
    const alive_members = this.members.filter((x) => x.alive)
    const res = await Promise.all(alive_members.map(x => this._vote(x)))
    console.log(res)
    this.status = "exit"
    return this.status
  }
  night() {
    this._broadcast("『夜が来ました。")
    this._broadcast("『誰を襲いますか。")
  }
  async _vote(member) {
    const alive_members = this.members.filter((x) => x.alive)
    member.socket.emit("serverMessage", `『選択してください`)
    alive_members.map((x, i) => {
      member.socket.emit("serverMessage", `『${i}: ${x.name}`)
    })
    member.socket.on("clientVote", (msg) => {
      console.log("on clientVote")
      member.socket.emit("serverMessage", "受け付けました")
      return msg
    })
  }
  prepare() {
    const jobs = [];
    this.members.sort((a, b) => a.rand - b.rand);
    for (const [k, v] of Object.entries(assign)) {
      for (let i = 0; i < v; i++) {
        jobs.push(k);
      }
    }
    for (const i of this.members) {
      i.job = jobs.pop();
    }
    this.members.map((x) => console.log(x.name));
    this.members.map((x) => console.log(x.job));
    this.status = "day"
    return this.status;
  }
  exit() {
    this._broadcast("『ゲームが終了しました")
    this.status = "done"
    return this.status
  }
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
