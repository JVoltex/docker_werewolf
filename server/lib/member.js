"use strict";
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
}
module.exports = Member;
