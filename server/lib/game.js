"use strict";
const {
  sleep,
  mayor,
  note,
  info,
  plainMessage,
  mode,
  clickable,
  informVote,
  randomSort,
  informRanking,
  getRandomIntInclusive,
} = require("./utils");
const conf = require('config');

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
  _configIsRankingMode() {
    return ["instant-ranking", "pre-ranking"].includes(conf.mode);
  }
  async prepare() {
    this.current = this.next;

    // 役職割り振り
    let jobs = [];
    for (const [k, v] of Object.entries(this.assign)) {
      for (let i = 0; i < v; i++) jobs.push(k);
    }
    jobs = randomSort(jobs);
    for (const i of this.members) {
      i.job = jobs.pop();
    }

    if (this._configIsRankingMode()) {

      // 役職が極端なランクになったらやり直す
      // prohibitExtremeRankは基本的に1役職だけtrueとすることを想定(trueが複数だと順位づけが複雑になるので)
      for (const [k, v] of Object.entries(this.assign)) {
        if (!conf.rankingModeSetting.prohibitExtremeRank[k]) {
          continue;
        }

        const membersOfJob = this.members.filter(m => m.job === k);
        for (const member of membersOfJob.filter(m => this._isExtremeRank(m.rank))) {

          let tmpRanks = Array.from(Array(this.members.length - 1), (v, k) => k);
          tmpRanks = randomSort(tmpRanks);
          for (const tmpRank of tmpRanks.filter(tr => !this._isExtremeRank(tr))) {
            const tmpRankMember = this.members.find(m => m.rank === tmpRank);
            if (tmpRankMember.job === member.job) {
              continue;
            }

            const jobSwp = tmpRankMember.job;
            tmpRankMember.job = member.job;
            member.job = jobSwp;
            break;
          }

          console.log(this.members);
        }
      }
      // 役職ヒント
      for (const [k, v] of Object.entries(this.assign)) {
        if (!conf.rankingModeSetting.jobHint.includes(k)) {
          continue;
        }
        const ranksOfJob = this.members.filter(m => m.job === k).map(m => m.rank);
        this._broadcast(k + `は次の順位の人です：${ranksOfJob.map(r => r + 1)}`, note);
      }

      // membersの順序でプレイヤに表示されるので、どこかでランク順になってることを懸念してランダムにしておく。
      this.members = randomSort(this.members);
    }

    this.members.map((x) => note(x.socket, `あなたは【${x.job}】です。`));
    const n_alive_wolf = this._filterMembers((x) => x.alive && x.job === "人狼")
    n_alive_wolf.map((x) => note(x.socket, `${n_alive_wolf.map((x) => x.name).join()}が仲間ですよ。`));
    this._sendMemberInfo();
    this.next = this.judge;
    return;
  }

  _isExtremeRank(rank) {
    return (rank === 0) || (rank === (this.members.length - 1));
  }


  async judge() {
    const prev = this.current;
    this.current = this.next;
    const n_alive = this._filterMembers((x) => x.alive).length;
    const n_alive_wolf = this._filterMembers((x) => x.alive && x.job === "人狼")
      .length;
    if (n_alive_wolf / n_alive >= 0.5) {
      this._broadcastEndOfGame("人狼の勝利です");
      this.next = null;
    } else if (n_alive_wolf === 0) {
      this._broadcastEndOfGame("市民の勝利です");
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
    await this._decide_executed();
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
    this._broadcast("もう少しの辛抱じゃ", mayor);
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

  async _decide_executed() {
    this._broadcast("話し合いは十分だろう。さあ人狼を始末するのじゃ。", mayor);
    let res = await this._waitForChoices(
      "誰が人狼だと思いますか。",
      (x) => x.alive,
      (x) => x.alive,
      true,
      true
    );

    console.log("Members:");
    console.log(this.members);

    let executed = this._mode(res);
    if (executed.length >= this._nof_alive()) {
      console.log("全員同票");
      this._broadcast("全員同表なのでわしが決めるぞ。", mayor);
    }
    else if (executed.length > 1) {
      console.log("決戦投票");
      this._broadcast("決まらなかったので決選投票を行うぞ。", mayor);
      res = await this._waitForChoices(
        "誰が人狼だと思いますか。",
        (x) => x.alive & !executed.includes(x),
        (x) => x.alive & executed.includes(x),
        true,
        true
      );
      executed = this._mode(res);

      if (executed.length > 1) {
        this._broadcast("決選投票でも決まらなかったのでわしが決めるぞ。", mayor);
      }
    }
    // 全員に票が入り同表ケース(決選投票不可能)と、決選投票で決まらないケースはランダムに選択
    executed = randomSort(executed);

    this._kill(executed[0]);
    return;
  }

  _nof_alive() {
    console.log("nof alive" + this._filterMembers((x) => x.alive).length);
    return this._filterMembers((x) => x.alive).length;
  }

  _broadcastEndOfGame(msg) {
    this._broadcast(msg, note);
    if (this._configIsRankingMode()) {
      let rankingMsg = this._getRankingMsg();
      this._broadcast(rankingMsg, informRanking);
    }
  }

  _getRankingMsg() {
    let sortedMembers = this.members.slice();
    sortedMembers.sort((a, b) => a.rank - b.rank);
    return sortedMembers.map((member, i) => (i + 1) + ": " + member.name + " (" + member.score + ")");
  }

  _mode(ary) {
    let res = [];
    let count = 0;
    for (const i of new Set(ary)) {
      const c = ary.filter((x) => x === i).length;
      if (count <= c) {
        if (count < c) {
          res = [];
        }
        res.push(i);
        count = c;
      }
    }
    return res;
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
          }); // only to wolf
          this._filterMembers((x) => x.job !== "人狼").map((x) => {
            plainMessage(x.socket, `？？「ガルルル`);
          });
        });
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
  _waitForSingleChoice(prompt, subject, objects, showMemberStateOfChoice = false) {
    objects = objects.filter((x) => x !== subject);
    const validId = objects.map((x, i) => i);
    // when there is no choice
    if (objects.length === 0) {
      info(subject.socket, "少々お待ちください...");
      return Promise.resolve(null);
    }
    // when there are some choices
    info(subject.socket, `${prompt}（半角数字）`);
    objects.map((x, i) => clickable(subject.socket, `${i}: ${x.name}`, i));
    informVote(subject.socket, objects.map((x, i) => i));
    
    return new Promise((resolve, reject) => {
      subject.socket.on("clientMessage", (msg) => {
        if (validId.indexOf(Number(msg)) !== -1) {
          info(subject.socket, "選択を受け付けました。");
          subject.voted = true;
          if (showMemberStateOfChoice) {
            this._sendMemberInfo();
          }
          if (this.current === this.night)
            subject.nightAction(objects[Number(msg)]);
          resolve(objects[Number(msg)]);
        }
      });
    }).finally(() => {
      subject.socket.removeAllListeners("clientMessage");
    });
  }
  async _waitForChoices(
    prompt,
    filterFuncS,
    filterFuncO,
    broadcast,
    showMemberStateOfChoice = false
  ) {
    const subjects = this._filterMembers(filterFuncS);
    const objects = this._filterMembers(filterFuncO);
    const choices = await Promise.all(
      subjects.map((x) => this._waitForSingleChoice(prompt, x, objects, showMemberStateOfChoice))
    );

    subjects.map((x) => { x.voted = false });
    if (showMemberStateOfChoice) {
      this._sendMemberInfo();
    }

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
        (x) => x.job === "人狼" && x.alive,
        (x) => x.alive && x.job !== "人狼"
      ),
      this._waitForChoices(
        "誰を守りますか。",
        (x) => x.job === "狩人" && x.alive,
        (x) => x.alive
      ),
      this._waitForChoices(
        "誰を占いますか。",
        (x) => x.job === "占い師" && x.alive,
        (x) => x.alive
      ),
      this._waitForChoices(
        "誰の霊と語りますか。",
        (x) => x.job === "霊媒師" && x.alive,
        (x) => !x.alive
      ),
    ]);
    return res;
  }
}

module.exports = Game;
