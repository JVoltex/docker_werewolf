"use strict";
// this module should not depend on any othe modules
module.exports.sleep = (sec = 1) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve("time"), sec * 1000);
  });
};

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
