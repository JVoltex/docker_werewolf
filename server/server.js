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
        members.push({
          id: null,
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
          members.map(x => x.socket.removeAllListeners("clientMemberJoin"))
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
      case "night":
        return await this.night();
      default:
        throw Error("default");
    }
  }
  _broadcast(msg) {
    this.members.map((x) => x.socket.emit("serverMessage", msg));
  }
  _broadcast_wolf(msg) {
    this.members
      .filter((x) => x.job === "werewolf")
      .map((x) => x.socket.emit("severMessage", msg));
  }
  _judge() {
    const n_alive = this.members.filter((x) => x.alive).length;
    const n_alive_wolf = this.members.filter(
      (x) => x.alive && x.job === "werewolf"
    ).length;
    if (n_alive_wolf / n_alive >= 0.5) {
      this._broadcast("人狼の勝利です");
      this.status = "exit";
    } else if (n_alive_wolf === 0) {
      this._broadcast("市民の勝利です");
      this.status = "exit";
    } else {
      this.status = this.status === "day" ? "night" : "day";
    }
    return this.status
  }
  async day() {
    this.members.map((x) =>
      x.socket.on("clientMessage", (msg) => {
        if (msg.match(/[^0-9]/)) this._broadcast(msg);
      })
    );
    this._broadcast("『夜が明けましたが人狼の気配が消えません。");
    this._broadcast("『誰が人狼だと思いますか。");
    const alive_members = this.members.filter((x) => x.alive);
    const alive_ids = alive_members.map(x => x.id)
    this.members.map((x) => x.socket.removeAllListeners("clientMessage"));
    const res = await Promise.all(alive_members.map((x) => this._vote(x)));
    this._broadcast("『全員が投票しました");
    let victim = {id: null, n: 0}
    for (const i of alive_ids) {
      let n = res.filter(x => Number(x) === i).length
      if (victim.n <= n) {
        victim = {id: i, n: n}
      }
    }
    this._broadcast(`犠牲者は${this.members[victim.id].name}です`)
    this.members[victim.id].alive = false
    return this._judge();
  }
  night() {
    this.members
      .filter((x) => x.job === "werewolf")
      .map((x) =>
        x.socket.on("clientMessage", (msg) => {
          if (msg.match(/[^0-9]/)) this._broadcast_wolf(msg);
        })
      );
    this._broadcast("『夜が来ました。");
    this._broadcast_wolf("『誰を襲いますか。");
    this.members
      .filter((x) => x.job === "werewolf")
      .map((x) => x.socket.removeAllListeners("clientMessage"));
    return this._judge();
  }
  _vote(member) {
    const alive_members = this.members.filter((x) => x.alive);
    member.socket.emit("serverMessage", `『選択してください`);
    alive_members.map((x) => {
      member.socket.emit("serverMessage", `『${x.id}: ${x.name}`);
    });
    const alive_ids = alive_members.map(x => x.id)
    return new Promise((resolve, reject) => {
      member.socket.on("clientMessage", (msg) => {
        if (alive_ids.indexOf(Number(msg)) >= 0) {
          member.socket.emit("serverMessage", "『投票を受け付けました");
          member.socket.removeAllListeners("clientVote");
          resolve(msg);
        }
      });
    });
  }
  prepare() {
    const jobs = [];
    let id = 0
    this.members.sort((a, b) => a.rand - b.rand);
    for (const [k, v] of Object.entries(assign)) {
      for (let i = 0; i < v; i++) {
        jobs.push(k);
      }
    }
    for (const i of this.members) {
      i.job = jobs.pop();
      i.id = id
      id++
    }
    this.members.map((x) => console.log(x.name));
    this.members.map((x) => console.log(x.job));
    this.members.map((x) =>
      x.socket.emit("serverMessage", `『あなたは${x.job}です。`)
    );
    this.status = "day";
    return this.status;
  }
  exit() {
    this._broadcast("『ゲームが終了しました");
    this.status = "done";
    return this.status;
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
