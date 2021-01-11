"use strict";
// this module should not depend on any other local modules
const readline = require("readline");

module.exports.sleep = (sec = 1) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, sec * 1000);
  });
};

const plainMessage = (socket, msg, type = "plain", value) => {
  socket.emit("serverMessage", {
    type: type,
    text: msg,
    value: value,
  });
};
module.exports.plainMessage = plainMessage;

module.exports.mayor = (socket, msg) => {
  plainMessage(socket, `村長「${msg}`, "plain");
};

module.exports.note = (socket, msg) => {
  plainMessage(socket, `${msg}`, "notification");
};

module.exports.info = (socket, msg) => {
  plainMessage(socket, `『${msg}`, "plain");
};

module.exports.clickable = (socket, msg, value) => {
  plainMessage(socket, `『${msg}`, "clickable", value);
};

module.exports.mode = (ary) => {
  let mode;
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

module.exports.randomSort = (ary) => {
  const aryWithRand = [];
  for (let i = 0; i < ary.length; i++) {
    aryWithRand.push({ value: ary[i], rand: Math.random() });
  }
  aryWithRand.sort((a, b) => a.rand - b.rand);
  return aryWithRand.map((x) => x.value);
};

module.exports.inputNonNegativeInteger = (prompt) => {
  console.log(prompt);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.setPrompt("");
  return new Promise((resolve, reject) => {
    rl.on("line", (input) => {
      const n = Number(input);
      if (Number.isInteger(n) && 0 <= n && input !== "") {
        resolve(n);
      } else {
        console.log("0以上の整数を半角で入力してください。");
      }
    });
  }).finally(() => {
    rl.close();
  });
};
