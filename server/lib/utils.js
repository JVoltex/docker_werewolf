"use strict";
// this module should not depend on any othe modules
module.exports.sleep = (sec = 1) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve("time"), sec * 1000);
  });
};

const message_base = (socket, msg, type = "plain") => {
  socket.emit("serverMessage", {
    type: type,
    text: msg,
  });
};
module.exports.message_base = message_base

module.exports.mayor = (socket, msg) => {
  message_base(socket, `村長「${msg}`, "plain")
};

module.exports.notify = (socket, msg) => {
  message_base(socket, `${msg}`, "important")
};

module.exports.message = (socket, msg) => {
  message_base(socket, `『${msg}`, "plain")
};

module.exports.mode = (ary) => {
  let mode = null;
  let count = 0;
  for (const i of new Set(ary)) {
    const c = ary.filter((x) => x === i).length;
    if (count < c) {
      mode = i;
      count = c;
    }
  }
  return mode;
};

