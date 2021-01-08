"use strict";
const {
  sleep,
  mayor,
  notify,
  message,
  mode,
  message_base,
} = require("./utils");

class Game {
  constructor(members, assign, timeLimit = 5) {
    this.members = members;
    this.assign = assign;
    this.next = "prepare";
    this.previous = null;
    this.timeLimit = timeLimit;
  }
  // getter & setter
  get allJobs() {
    return this.members.map((x) => x.job);
  }
  // controll method
  async proceed() {
    switch (this.next) {
      case "prepare":
        return this.prepare();
      case "judge":
        return this._judge();
      case "day":
        return await this.day();
      case "night":
        return await this.night();
      default:
        throw Error("default");
    }
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
    this.previous = this.next;
    this.next = "judge";
    return;
  }
  _judge() {
    const n_alive = this.members.filter((x) => x.alive).length;
    const n_alive_wolf = this.members.filter((x) => x.alive && x.job === "人狼")
      .length;
    if (n_alive_wolf / n_alive >= 0.5) {
      this._broadcast("人狼の勝利です", notify);
      this.next = "done";
    } else if (n_alive_wolf === 0) {
      this._broadcast("市民の勝利です", notify);
      this.next = "done";
    } else {
      this.next = this.previous === "day" ? "night" : "day";
    }
    this.previous = "judge";
    return;
  }
  async day() {
    this._broadcast("さてさて昼が来たぞ。", mayor);
    this._broadcast(
      `日が沈むまでの${this.timeLimit}秒間で人狼を暴くのじゃ。`,
      mayor
    );
    await this._chat();
    this._broadcast(
      "話し合いは十分だろう。さあ人狼を始末するのじゃ。",
      mayor
    );
    const alive_members = this.members.filter((x) => x.alive);
    const alive_ids = alive_members.map((x, i) => i);
    const res = await this._waitForChoice("誰が人狼だと思いますか。");
    const victim = mode(res);
    this._kill(victim);
    this.previous = this.next;
    this.next = "judge";
    return;
  }
  async night() {
    this._broadcast("夜が来たぞ。どうも嫌な予感がするわい。", mayor);
    this._broadcast(
      `日が昇るまで${this.timeLimit}秒ほど用心するのじゃ。`,
      mayor
    );
    await this._chat(["人狼"]);
    this._broadcast("もう少しの辛抱じゃ。", mayor);
    const res = await this._waitForChoice(
      "誰を襲いますか。",
      ["人狼"],
      [true],
      ["市民", "霊媒師", "占い師", "狩人"],
      [true]
    );
    const victim = mode(res);
    this._kill(victim);
    this.previous = this.next;
    this.next = "judge";
    return;
  }
  // utils
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
  _startChat(job = null) {
    const members = this._filterMembers(job);
    members.map((x) =>
      x.socket.on("clientMessage", (msg) => {
        if (msg.match(/[^0-9]/))
          members.map((y) => message_base(y.socket, `${x.name}「${msg}`));
      })
    );
  }
  _stopChat() {
    this.members.map((x) => x.socket.removeAllListeners("clientMessage"));
  }
  async _chat(job) {
    this._startChat(job);
    await sleep(this.timeLimit);
    this._stopChat();
  }
  _choice(prompt, subject, objects) {
    const validId = objects.map((x, i) => i);
    message(subject.socket, prompt);
    objects.map((x, i) => message(subject.socket, `${i}: ${x.name}`));
    return new Promise((resolve, reject) => {
      subject.socket.on("clientMessage", (msg) => {
        if (validId.indexOf(Number(msg)) !== -1) {
          message(subject.socket, "投票を受け付けました。");
          subject.socket.removeAllListeners("clientMessage");
          resolve(this.members[Number(msg)]);
        }
      });
    });
  }
  async _waitForChoice(prompt, jobS, aliveS, jobO, aliveO) {
    const subjects = this._filterMembers(jobS, aliveS);
    const objects = this._filterMembers(jobO, aliveO);
    const choices = await Promise.all(
      subjects.map((x) => this._choice(prompt, x, objects))
    );
    return choices;
  }
}

module.exports = Game;
