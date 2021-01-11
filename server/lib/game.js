"use strict";
const {
  sleep,
  mayor,
  note,
  info,
  plainMessage,
  mode,
  clickable,
  randomSort,
} = require("./utils");

class Game {
  constructor(members, assign, timeLimit = 5) {
    this.members = members;
    this.assign = assign;
    this.next = this.prepare;
    this.current = null;
    this.timeLimit = timeLimit;
  }
  // controll method
  async proceed() {
    await this.next();
    return;
  }
  async prepare() {
    this.current = this.next;
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
    this.next = this.judge;
    return;
  }
  async judge() {
    const prev = this.current;
    this.current = this.next;
    const n_alive = this._filterMembers((x) => x.alive).length;
    const n_alive_wolf = this._filterMembers((x) => x.alive && x.job === "人狼")
      .length;
    if (n_alive_wolf / n_alive >= 0.5) {
      this._broadcast("人狼の勝利です", note);
      this.next = null;
    } else if (n_alive_wolf === 0) {
      this._broadcast("市民の勝利です", note);
      this.next = null;
    } else {
      this.next = prev === this.day ? this.night : this.day;
    }
    return;
  }
  async day() {
    this.current = this.next;
    this._broadcast("さてさて昼が来たぞ。", mayor);
    this._broadcast(
      `日が沈むまでの${this.timeLimit}秒間で人狼を暴くのじゃ。`,
      mayor
    );
    await this._chat();
    this._broadcast("話し合いは十分だろう。さあ人狼を始末するのじゃ。", mayor);
    const res = await this._waitForChoices(
      "誰が人狼だと思いますか。",
      (x) => x.alive,
      (x) => x.alive,
      true
    );
    const victim = mode(res);
    this._kill(victim);
    this.next = this.judge;
    return;
  }
  async night() {
    this.current = this.next;
    this._broadcast("夜が来たぞ。どうも嫌な予感がするわい。", mayor);
    this._broadcast(
      `日が昇るまで${this.timeLimit}秒ほど用心するのじゃ。`,
      mayor,
      (x) => x.job !== "人狼"
    );
    this._broadcast(
      `${this.timeLimit}秒で襲撃対象を相談してください`,
      info,
      (x) => x.job === "人狼"
    );
    await this._chat();
    const res = await this._waitForNightChoices();
    const victim = mode(res[0]);
    const protectedMembers = res[1];
    if (protectedMembers.indexOf(victim) === -1) {
      this._kill(victim);
    } else {
      this._broadcast("誰も死にませんでした。", note);
    }
    this.next = this.judge;
    return;
  }
  // utils
  _filterMembers(func) {
    return this.members.filter(func);
  }
  _sendMemberInfo() {
    this.members.map((x) => {
      x.receiveMemberInfo(this.members);
    });
  }
  _broadcast(msg, msgFunc = info, filterFunc) {
    if (!filterFunc) filterFunc = (x) => true;
    const targets = this._filterMembers(filterFunc);
    targets.map((x) => {
      msgFunc(x.socket, msg);
    });
  }
  _kill(member) {
    member.alive = false;
    this._broadcast(`【${member.name}】が死亡しました`, note);
    this._sendMemberInfo();
  }
  _startChat() {
    for (const m of this.members) {
      if (!m.alive) {
        m.socket.on("clientMessage", (msg) => {
          this._filterMembers((x) => !x.alive).map((x) =>
            plainMessage(x.socket, `${m.name}「${msg}`, "dead")
          );
        }); // only to dead
      } else if (m.job === "人狼" && this.current === this.night) {
        m.socket.on("clientMessage", (msg) => {
          this._filterMembers((x) => x.job === "人狼").map((x) => {
            plainMessage(x.socket, `${m.name}「${msg}`);
          });
        }); // only to wolf
      } else if (this.current === this.night) {
        m.socket.on("clientMessage", (msg) => {
          this.members.map((x) => {
            plainMessage(x.socket, `？？「ガヤガヤ`);
          });
        }); // to everyone
      } else {
        m.socket.on("clientMessage", (msg) => {
          this.members.map((x) => {
            plainMessage(x.socket, `${m.name}「${msg}`);
          });
        }); // to everyone
      }
    }
  }
  _stopChat() {
    this.members.map((x) => x.socket.removeAllListeners("clientMessage"));
  }
  async _chat() {
    // have to fix
    this._startChat();
    await sleep(this.timeLimit);
    this._stopChat();
  }
  _waitForSingleChoice(prompt, subject, objects) {
    objects = objects.filter((x) => x !== subject);
    const validId = objects.map((x, i) => i);
    // when there is no choice
    if (objects.length === 0) {
      info(subject.socket, "少々お待ちください...");
      return Promise.resolve(null);
    }
    // when there are some choices
    info(subject.socket, prompt);
    objects.map((x, i) => clickable(subject.socket, `${i}: ${x.name}`, i));
    return new Promise((resolve, reject) => {
      subject.socket.on("clientMessage", (msg) => {
        if (validId.indexOf(Number(msg)) !== -1) {
          info(subject.socket, "選択を受け付けました。");
          if (this.current === this.night)
            subject.nightAction(objects[Number(msg)]);
          resolve(objects[Number(msg)]);
        }
      });
    }).finally(() => {
      subject.socket.removeAllListeners("clientMessage");
    });
  }
  async _waitForChoices(prompt, filterFuncS, filterFuncO, broadcast) {
    const subjects = this._filterMembers(filterFuncS);
    const objects = this._filterMembers(filterFuncO);
    const choices = await Promise.all(
      subjects.map((x) => this._waitForSingleChoice(prompt, x, objects))
    );
    if (broadcast) {
      for (let i = 0; i < subjects.length; i++) {
        this._broadcast(`${subjects[i].name} -> ${choices[i].name}`);
      }
    }
    return choices;
  }
  async _waitForNightChoices() {
    const res = await Promise.all([
      this._waitForChoices(
        "誰を襲いますか。",
        (x) => x.job === "人狼",
        (x) => x.alive
      ),
      this._waitForChoices(
        "誰を守りますか。",
        (x) => x.job === "狩人",
        (x) => x.alive
      ),
      this._waitForChoices(
        "誰を占いますか。",
        (x) => x.job === "占い師",
        (x) => x.alive
      ),
      this._waitForChoices(
        "誰の霊と語りますか。",
        (x) => x.job === "霊媒師",
        (x) => !x.alive
      ),
    ]);
    return res;
  }
}

module.exports = Game;
