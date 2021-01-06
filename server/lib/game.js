"use strict";
const { sleep } = require("./utils");

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
    this.members.map((x) =>
      x.socket.emit("serverMessage", { type: "plain", text: msg })
    );
  }
  _broadcast_wolf(msg) {
    this.members
      .filter((x) => x.job === "人狼")
      .map((x) => x.socket.emit("severMessage", msg));
  }
  _kill(idx) {
    this.members[idx].alive = false;
    this._broadcast(`${this.members[idx].name}が死亡しました`);
    this.members.map((x) =>
      x.socket.emit(
        "serverMemberJoin",
        this.members.map((x) => {
          return { name: x.name, alive: x.alive };
        })
      )
    );
  }
  _judge() {
    const n_alive = this.members.filter((x) => x.alive).length;
    const n_alive_wolf = this.members.filter((x) => x.alive && x.job === "人狼")
      .length;
    if (n_alive_wolf / n_alive >= 0.5) {
      this._broadcast("人狼の勝利です");
      this.status = "exit";
    } else if (n_alive_wolf === 0) {
      this._broadcast("市民の勝利です");
      this.status = "exit";
    } else {
      this.status = this.status === "day" ? "night" : "day";
    }
    return this.status;
  }
  async day() {
    this.members.map((x) =>
      x.socket.on("clientMessage", (msg) => {
        if (msg.match(/[^0-9]/)) this._broadcast(msg);
      })
    );
    this._broadcast("『昼です");
    this._broadcast("『誰が人狼だと思いますか。");
    await sleep();
    this._broadcast("time!");
    this.members.map((x) => x.socket.removeAllListeners("clientMessage"));
    const alive_members = this.members.filter((x) => x.alive);
    const alive_ids = alive_members.map((x, i) => i);
    const res = await Promise.all(alive_members.map((x) => this._vote(x)));
    this._broadcast("『全員が投票しました");
    let victim = { id: null, n: 0 };
    for (const i of alive_ids) {
      let n = res.filter((x) => Number(x) === i).length;
      if (victim.n <= n) {
        victim = { id: i, n: n };
      }
    }
    this._broadcast(`犠牲者は${this.members[victim.id].name}です`);
    //this.members[victim.id].alive = false;
    this._kill(victim.id);
    return this._judge();
  }
  async night() {
    this.members
      .filter((x) => x.job === "人狼")
      .map((x) =>
        x.socket.on("clientMessage", (msg) => {
          if (msg.match(/[^0-9]/)) this._broadcast_wolf(msg);
        })
      );
    this._broadcast("『夜が来ました。");
    this._broadcast_wolf("『誰を襲いますか。");
    await sleep();
    this.members
      .filter((x) => x.job === "人狼")
      .map((x) => x.socket.removeAllListeners("clientMessage"));
    const alive_members = this.members.filter((x) => x.alive);
    const alive_ids = alive_members.map((x, i) => i);
    const res = await Promise.all(alive_members.map((x) => this._vote(x)));
    this._broadcast("『襲撃されました");
    let victim = { id: null, n: 0 };
    for (const i of alive_ids) {
      let n = res.filter((x) => Number(x) === i).length;
      if (victim.n <= n) {
        victim = { id: i, n: n };
      }
    }
    this._broadcast(`犠牲者は${this.members[victim.id].name}です`);
    this.members[victim.id].alive = false;
    return this._judge();
  }
  _vote(member) {
    const alive_members = this.members.filter((x) => x.alive);
    member.socket.emit("serverMessage", {
      type: "plain",
      text: `『選択してください`,
    });
    alive_members.map((x, i) => {
      member.socket.emit("serverMessage", {
        type: "plain",
        text: `『${i}: ${x.name}`,
      });
    });
    const alive_ids = alive_members.map((x, i) => i);
    return new Promise((resolve, reject) => {
      member.socket.on("clientMessage", (msg) => {
        if (alive_ids.indexOf(Number(msg)) >= 0) {
          member.socket.emit("serverMessage", {
            type: "plain",
            text: "『投票を受け付けました",
          });
          member.socket.removeAllListeners("clientMessage");
          resolve(msg);
        }
      });
    });
  }
  prepare() {
    const jobs = [];
    for (const [k, v] of Object.entries(this.assign)) {
      for (let i = 0; i < v; i++) {
        jobs.push({ job: k, rand: Math.random() });
      }
    }
    jobs.sort((a, b) => a.rand - b.rand);
    for (const i of this.members) {
      i.job = jobs.pop().job;
    }
    this.members.map((x) => console.log(x.name));
    this.members.map((x) => console.log(x.job));
    this.members.map((x) =>
      x.socket.emit("serverMessage", {
        type: "important",
        text: `『あなたは${x.job}です。`,
      })
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

module.exports = Game;
