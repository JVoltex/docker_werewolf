'use strict'
class Member {
  constructor(name, socket) {
    this.name = name
    this.alive = true
    this.job = null
    this.socket = socket
  }
}
module.exports = Member
