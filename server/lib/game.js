"use strict";
const {
  sleep,
  mayor,
  note,
  info,
  plainMessage,
  mode,
  randomSort,
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
        this.prepare();
        break;
      case "judge":
        this._judge();
        break;
      case "day":
        await this.day();
        break;
      case "night":
        await this.night();
        break;
      default:
        throw Error("default");
    }
  }
  prepare() {
    let jobs = [];
    for (const [k, v] of Object.entries(this.assign)) {
      for (let i = 0; i < v; i++) jobs.push(k);
    }
    jobs = randomSort(jobs);
    for (const i of this.members) {
      i.job = jobs.pop();
    }
    this.members.map((x) => note(x.socket, `あなたは【${x.job}】です。`));
    this._sendMemberInfo();
    this.previous = this.next;
    this.next = "judge";
    return;
  }
  _judge() {
    const n_alive = this.members.filter((x) => x.alive).length;
    const n_alive_wolf = this.members.filter((x) => x.alive && x.job === "人狼")
      .length;
    if (n_alive_wolf / n_alive >= 0.5) {
      this._broadcast("人狼の勝利です", note);
      this.next = "done";
    } else if (n_alive_wolf === 0) {
      this._broadcast("市民の勝利です", note);
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
      mayor,
      null,
      null,
      true
    );
    const alive_members = this.members.filter((x) => x.alive);
    const res = await this._waitForChoice(
      "誰が人狼だと思いますか。",
      null,
      [true],
      null,
      [true],
      true
    );
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
      mayor,
      ["市民", "占い師", "霊媒師", "狩人"]
    );
    this._broadcast("襲撃対象を相談してください", mayor, ["人狼"]);
    await this._chat(["人狼"]);
    const res = await this._waitForNightChoice();
    const victim = mode(res[0]);
    const protectedMembers = res[1];
    if (protectedMembers.indexOf(victim) === -1) {
      this._kill(victim);
    } else {
      this._broadcast("誰も死にませんでした。", note);
    }
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
    this.members.map((x) => {
      x.receiveMemberInfo(this.members);
    });
  }
  _broadcast(msg, func = info, job, alive) {
    const targets = this._filterMembers(job, alive);
    targets.map((x) => {
      func(x.socket, msg);
    });
  }
  _kill(member) {
    member.alive = false;
    this._broadcast(`【${member.name}】が死亡しました`, note);
    this._sendMemberInfo();
  }
  _startChat(job = null) {
    const members = this._filterMembers(job);
    members.map((x) =>
      x.socket.on("clientMessage", (msg) => {
        if (msg.match(/[^0-9]/))
          members.map((y) => plainMessage(y.socket, `${x.name}「${msg}`));
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
    objects = objects.filter((x) => x !== subject);
    const validId = objects.map((x, i) => i);
    // when there is no choice
    if (objects.length === 0) {
      info(subject.socket, "少々お待ちください...");
      return Promise.resolve(null);
    }
    // when there are some choices
    info(subject.socket, prompt);
    objects.map((x, i) => info(subject.socket, `${i}: ${x.name}`));
    return new Promise((resolve, reject) => {
      subject.socket.on("clientMessage", (msg) => {
        if (validId.indexOf(Number(msg)) !== -1) {
          info(subject.socket, "選択を受け付けました。");
          if (this.next === "night") subject.nightAction(objects[Number(msg)]);
          subject.socket.removeAllListeners("clientMessage");
          resolve(objects[Number(msg)]);
        }
      });
    });
  }
  async _waitForChoice(prompt, jobS, aliveS, jobO, aliveO, broadcast = false) {
    const subjects = this._filterMembers(jobS, aliveS);
    const objects = this._filterMembers(jobO, aliveO);
    const choices = await Promise.all(
      subjects.map((x) => this._choice(prompt, x, objects))
    );
    if (broadcast) {
      for (let i = 0; i < subjects.length; i++) {
        this._broadcast(`${subjects[i].name} -> ${choices[i].name}`);
      }
    }
    return choices;
  }
  async _waitForNightChoice() {
    const res = await Promise.all([
      this._waitForChoice("誰を襲いますか。", "人狼", [true], null, [true]),
      this._waitForChoice("誰を守りますか。", "狩人", [true], null, [true]),
      this._waitForChoice("誰を占いますか。", "占い師", [true], null, [true]),
      this._waitForChoice("誰の霊と語りますか。", "霊媒師", [true], null, [
        false,
      ]),
    ]);
    return res;
  }
}

module.exports = Game;
