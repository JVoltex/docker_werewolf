"use strict";
const { sleep, mayorSays, notify, message, mode} = require("./utils");

class Game {
  constructor(members, assign, timeLimit = 5) {
    this.members = members;
    this.assign = assign;
    this.status = "prepare";
    this.timeLimit = timeLimit;
  }
  async proceed() {
    switch (this.status) {
      case "prepare":
        return this.prepare();
      case "day":
        return await this.day();
      case "night":
        return await this.night();
      default:
        throw Error("default");
    }
  }
  get allJobs() {
    return this.members.map((x) => x.job);
  }
  _filterMembers(job, alive) {
    if (!job) {
      job = this.allJobs;
    }
    if (!alive) {
      alive = [true, false];
    }
    return this.members.filter((x) => {
      return Math.min(job.indexOf(x.job), alive.indexOf(x.alive)) !== -1;
    });
  }
  _sendMemberInfo() {
    this.members.map((x) =>
      x.socket.emit(
        "serverMemberJoin",
        this.members.map((y) => y.formatForClient())
      )
    );
  }
  _broadcast(msg, func = message, job, alive) {
    const targets = this._filterMembers(job, alive);
    targets.map((x) => {
      func(x.socket, msg);
    });
  }
  _kill(member) {
    member.alive = false;
    this._broadcast(`${member.name}が死亡しました`, notify);
    this._sendMemberInfo();
  }
  _judge() {
    const n_alive = this.members.filter((x) => x.alive).length;
    const n_alive_wolf = this.members.filter((x) => x.alive && x.job === "人狼")
      .length;
    if (n_alive_wolf / n_alive >= 0.5) {
      this._broadcast("人狼の勝利です", notify);
      this.status = "done";
    } else if (n_alive_wolf === 0) {
      this._broadcast("市民の勝利です", notify);
      this.status = "done";
    } else {
      this.status = this.status === "day" ? "night" : "day";
    }
    return this.status;
  }
  _startChat() {
    this.members.map((x) =>
      x.socket.on("clientMessage", (msg) => {
        if (msg.match(/[^0-9]/)) this._broadcast(msg);
      })
    );
  }
  _stopChat() {
    this.members.map((x) => x.socket.removeAllListeners("clientMessage"));
  }
  async _chat() {
    this._startChat();
    await sleep(this.timeLimit);
    this._stopChat();
  }
  async day() {
    this._broadcast("さてさて昼が来たぞ。", mayorSays);
    this._broadcast(
      `日が沈むまでの${this.timeLimit}秒間で人狼を暴くのじゃ。`,
      mayorSays
    );
    await this._chat();
    this._broadcast(
      "話し合いは十分だろう。さあ人狼を始末するのじゃ。",
      mayorSays
    );
    const alive_members = this.members.filter((x) => x.alive);
    const alive_ids = alive_members.map((x, i) => i);
    const res = await this._waitForChoice();
    const victim = mode(res)
    this._kill(victim);
    return this._judge();
  }
  async night() {
    this.members
      .filter((x) => x.job === "人狼")
      .map((x) =>
        x.socket.on("clientMessage", (msg) => {
          if (msg.match(/[^0-9]/)) this._broadcast(msg, message, ["人狼"]);
        })
      );
    this._broadcast("『夜が来ました。");
    this._broadcast_wolf("『誰を襲いますか。", message, ["人狼"]);
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
  _choice(subject, objects) {
    const validId = objects.map((x, i) => i);
    return new Promise((resolve, reject) => {
      subject.socket.on("clientMessage", (msg) => {
        if (validId.indexOf(Number(msg)) !== -1) {
          notify(subject.socket, "投票を受け付けました。");
          subject.socket.removeAllListeners("clientMessage");
          resolve(this.members[Number(msg)]);
        }
      });
    });
  }
  async _waitForChoice(jobS, aliveS, jobO, aliveO) {
    const subjects = this._filterMembers(jobS, aliveS);
    const objects = this._filterMembers(jobO, aliveO);
    this._broadcast("選択してください。", jobS, aliveS);
    objects.map((x, i) => {
      this._broadcast(`${i}: ${x.name}`, message, jobS, aliveS);
    });
    const choices = await Promise.all(
      subjects.map((x) => this._choice(x, objects))
    );
    return choices
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
        if (alive_ids.indexOf(Number(msg)) !== -1) {
          member.socket.emit("serverMessage", {
            type: "plain",
            text: "投票を受け付けました",
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
    this.members.map((x) => console.log(`${x.name}: ${x.job}`)); // debag
    this.members.map((x) => notify(x.socket, `あなたは${x.job}です。`));
    this.status = "day";
    return this.status;
  }
}

module.exports = Game;
