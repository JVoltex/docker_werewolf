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

module.exports.mayorSays = (socket, msg) => {
  socket.emit("serverMessage", {
    type: "plain",
    text: `村長「${msg}`,
  });
};

module.exports.notify = (socket, msg) => {
  socket.emit("serverMessage", {
    type: "important",
    text: `${msg}`,
  });
};

module.exports.message = (socket, msg) => {
  socket.emit("serverMessage", {
    type: "plain",
    text: `『${msg}`,
  });
};

module.exports.mode = (ary) => {
  let mode = null;
  let max = 0;
  for (const i of new Set(ary)) {
    const len = ary.filter((x) => x === i).length;
    if (max < len) {
      mode = i;
      max = len;
    }
  }
  return mode;
};

