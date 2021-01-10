"use strict";
// this module should not depend on any other modules
const readline = require("readline");

module.exports.sleep = (sec = 1) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, sec * 1000);
  });
};

const message_base = (socket, msg, type = "plain") => {
  socket.emit("serverMessage", {
    type: type,
    text: msg,
  });
};
module.exports.message_base = message_base;

module.exports.mayor = (socket, msg) => {
  message_base(socket, `村長「${msg}`, "plain");
};

module.exports.notify = (socket, msg) => {
  message_base(socket, `${msg}`, "important");
};

module.exports.message = (socket, msg) => {
  message_base(socket, `『${msg}`, "plain");
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

module.exports.inputNaturalNumber = (prompt) => {
  console.log(prompt);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.setPrompt("");
  return new Promise((resolve, reject) => {
    rl.on("line", (input) => {
      const n = Number(input);
      if (Number.isInteger(n) && 1 <= n) {
        resolve(n);
      } else {
        console.log("1以上の整数を半角で入力してください。");
      }
    });
  }).finally(() => {
    rl.close();
  });
};
