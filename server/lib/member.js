"use strict";
class Member {
  constructor(name, socket) {
    this.name = name;
    this.alive = true;
    this.job = null;
    this.socket = socket;
  }
  formatForClient() {
    return { name: this.name, alive: this.alive};
  }
  formatMemberInfo(member) {
    const res = {name: null, alive: null}
    res.name = member.name
    res.alive = member.alive
    if (this.job === "人狼" && member.job === "人狼") {
      res.name = res.name + "（人狼）"
    }
    if (member === this) {
      res.name = res.name + "（あなた）"
    }
    return res
  }
  receiveMemberInfo(members) {
    this.socket.emit("serverMemberJoin", members.map(x => this.formatMemberInfo(x)))
  }
}
module.exports = Member;
