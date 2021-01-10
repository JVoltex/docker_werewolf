"use strict";
const { info } = require("./utils");

class Member {
  constructor(name, socket) {
    this.name = name;
    this.alive = true;
    this.job = null;
    this.socket = socket;
  }
  receiveMemberInfo(members) {
    this.socket.emit(
      "serverMemberInfo",
      members.map((x) => this._formatMemberInfo(x))
    );
  }
  _formatMemberInfo(member) {
    const res = {};
    res.name = member.name;
    res.alive = member.alive;
    if (this.job === "人狼" && member.job === "人狼" && member !== this) {
      res.name = res.name + "（人狼）";
    }
    if (member === this) {
      res.name = res.name + "（あなた）";
    }
    return res;
  }
  nightAction(choice) {
    let msg;
    switch (this.job) {
      case "霊媒師":
        if (choice.job === "人狼") {
          msg = `【${choice.name}】は人狼です。`;
        } else {
          msg = `【${choice.name}】は人狼ではありません。`;
        }
        break;
      case "占い師":
        if (choice.job === "人狼") {
          msg = `【${choice.name}】は人狼です。`;
        } else {
          msg = `【${choice.name}】は人狼ではありません。`;
        }
        break;
    }
    if (msg) info(this.socket, msg);
  }
}
module.exports = Member;
