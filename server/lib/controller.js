"use strict";
// this module is imoprted only by `main.js`
const Member = require("./member");
const Game = require("./game");
const { Server } = require("socket.io");
const express = require("express");
const http = require("http");
const { mayor, inputNonNegativeInteger, inputString, informAssign } = require("./utils");
const conf = require('config');

const waitForMembers = (n, server, assign) => {
  const members = [];
  return new Promise((resolve, reject) => {
    server.ws.on("connection", (socket) => {
      
      socket.on("clientMemberJoin", (name) => {
        informAssign(socket, assign);
        members.push(new Member(name, socket));
        members.map((x) => x.receiveMemberInfo(members));
        mayor(socket, `ようこそ【${name}】さん。`);
        mayor(socket, `皆が揃うまでしばし待たれよ。`);
        console.log(`【${name}】さんが入室しました。`);
        if (members.length === n) {
          resolve(members);
        }
      });
    });
  }).finally(() => {
    members.map((x) => x.socket.removeAllListeners("clientMemberJoin"));
  });
};

const waitForAnswers = async (server, questionnaire, members) => {
  const prompt = questionnaire;
  const answers = await Promise.all(
    members.map((x) => _waitForAnswer(prompt, x))
  );
  return answers;
};

function _waitForAnswer(prompt, subject) {
  // when there are some choices
  mayor(subject.socket, `${prompt}（半角数字）`);

  return new Promise((resolve, reject) => {
    subject.socket.on("clientMessage", (answer) => {
      if (answer !== "") {
        mayor(subject.socket, "回答を受け付けた。: " + answer);
        subject.score = answer;
        resolve(answer);
      }
    });
  }).finally(() => {
    subject.socket.removeAllListeners("clientMessage");
  });
}

module.exports.GameServer = class GameServer {
  constructor(staticDir, port) {
    const app = express();
    app.use(express.static(staticDir));
    this.http = http.createServer(app);
    this.ws = new Server(this.http);
    this.port = port;
  }
  start() {
    this.http.listen(this.port);
  }
  close() {
    this.http.close();
    this.ws.close();
  }
};

module.exports.playGame = async (assign, timeLimit, server, questionnaire="", rankingTable=undefined) => {
  const nofmembers = Object.values(assign).reduce((sum, n) => (sum += n), 0);
  const members = await waitForMembers(nofmembers, server, assign);

  if(conf.mode === "instant-ranking") {
    // 質問への回答収集
    await waitForAnswers(server, questionnaire, members);
  }
  else if(conf.mode === "pre-ranking") {
    _setScore(members, rankingTable);
  }

  const game = new Game(members, assign, timeLimit);
  while (game.next !== null) {
    await game.proceed();
  }
};

module.exports.inputAssign = async (jobs) => {
  const inputs = [];
  for (const j of jobs) {
    const n = await inputNonNegativeInteger(`【${j}】は何人？：`);
    inputs.push(n);
  }
  const res = {};
  for (let i = 0; i < jobs.length; i++) {
    res[jobs[i]] = inputs[i];
  }
  return res;
};

module.exports.inputQuestionnaire = async (prompt) => {
  const res = await inputString(prompt);
  return res;
}

function _setScore(members, rankingTable) {
  for(const member of members){
    const item = rankingTable.items.find(item => member.name === item.name);
    member.score = item.score;
  }
}