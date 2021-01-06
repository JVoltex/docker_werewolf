"use strict";
// this module is imoprted only by `server.js`
const Member = require("./member");
const Game = require("./game");
const { Server } = require("socket.io");
const express = require("express");
const http = require("http");

const waitForMembers = (n, io) => {
  const members = [];
  return new Promise((resolve, reject) => {
    io.on("connection", (socket) => {
      socket.on("clientMemberJoin", (name) => {
        members.push(new Member(name, socket));
        io.emit(
          "serverMemberJoin",
          members.map((x) => {
            return { name: x.name, alive: true };
          })
        );
        socket.emit("serverMessage", {
          type: "plain",
          text: `村長「ようこそ${name}さん。`,
        });
        socket.emit("serverMessage", {
          type: "plain",
          text: `村長「皆が揃うまでしばし待たれよ。`,
        });
        console.log(`clientMemberJoin: ${name}`);
        if (members.length === n) {
          members.map((x) => x.socket.removeAllListeners("clientMemberJoin"));
          resolve(members);
        }
      });
    });
  });
};

module.exports.createServer = (static_dir, port) => {
  const app = express();
  app.use(express.static(static_dir));
  const httpServer = http.createServer(app);
  const socketServer = new Server(httpServer);
  return {
    http: httpServer,
    ws: socketServer,
  };
};

module.exports.playGame = async (assign, server) => {
  const n = Object.values(assign).reduce((sum, n) => (sum += n), 0);
  const members = await waitForMembers(n, server);
  const game = new Game(members, assign);
  while (game.status !== "done") {
    await game.proceed();
  }
};
