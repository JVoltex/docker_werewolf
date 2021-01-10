"use strict";
const {message} = require("./utils")

class Member {
  constructor(name, socket) {
    this.name = name;
    this.alive = true;
    this.job = null;
    this.socket = socket;
  }
  formatForClient() {
    return { name: this.name, alive: this.alive };
  }
  formatMemberInfo(member) {
    const res = { name: null, alive: null };
    res.name = member.name;
    res.alive = member.alive;
    if (this.job === "人狼" && member.job === "人狼") {
      res.name = res.name + "（人狼）";
    }
    if (member === this) {
      res.name = res.name + "（あなた）";
    }
    return res;
  }
  receiveMemberInfo(members) {
    this.socket.emit(
      "serverMemberInfo",
      members.map((x) => this.formatMemberInfo(x))
    );
  }
  nightAction(choice) {
    let msg
    switch (this.job) {
      case "霊媒師":
        if (choice.job === "人狼") {
          msg = `【${choice.name}】は人狼です。`
        } else {
          msg = `【${choice.name}】は人狼ではありません。`
        }
        message(this.socket, msg)
        break;
      case "占い師":
        if (choice.job === "人狼") {
          msg = `【${choice.name}】は人狼です。`
        } else {
          msg = `【${choice.name}】は人狼ではありません。`
        }
        message(this.socket, msg)
        break;
    }
  }
}
module.exports = Member;
