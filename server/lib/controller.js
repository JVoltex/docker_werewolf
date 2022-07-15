"use strict";
// this module is imoprted only by `main.js`
const Member = require("./member");
const Game = require("./game");
const { Server } = require("socket.io");
const express = require("express");
const http = require("http");
const { mayor, inputNonNegativeInteger, inputString, informAssign } = require("./utils");
const conf = require('config');

function registeredMembers(rankingTable) {
  let ret = rankingTable && rankingTable.items.map(item => item.name);
  return ret;
}

const waitForMembers = (n, server, assign, rankingTable) => {
  const members = [];
  return new Promise((resolve, reject) => {
    server.ws.on("connection", (socket) => {
      socket.emit("serverRegisteredMembersInfo", {
        valid: (conf.mode === "pre-ranking"),
        registeredMembers: registeredMembers(rankingTable),
      });
      
      let member = null;
      socket.on("clientMemberJoin", (name) => {
        informAssign(socket, assign);
        member = new Member(name, socket);
        members.push(member);
        members.map((x) => x.receiveMemberInfo(members));
        mayor(socket, `ようこそ【${name}】さん。`);
        mayor(socket, `皆が揃うまでしばし待たれよ。`);
        console.log(`【${name}】さんが入室しました。`);
        if (members.length === n) {
          resolve(members);
        }
      });
      socket.on('disconnect', () => {
        if(!member){return;}
        
        var index = members.indexOf(member);
        members.splice(index, 1);
        console.log(`【${member.name}】さんが退室しました。`);
        members.map((x) => x.receiveMemberInfo(members));
        member = null;
      });
    });
  }).finally(() => {
    members.map((x) => x.socket.removeAllListeners("clientMemberJoin"));
    members.map((x) => x.socket.removeAllListeners("disconnect"));
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
  const members = await waitForMembers(nofmembers, server, assign, rankingTable);

  if(conf.mode === "instant-ranking") {
    // 質問への回答収集
    await waitForAnswers(server, questionnaire, members);
    // rank情報追加(必ず昇順)
    members.sort((a, b) => a.score - b.score);
    let i = 0;
    for(const member of members) {
      member.rank = i++;
    }
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
  let i=0;
  for(const item of rankingTable.items){
    const member = members.find(member => member.name === item.name);
    member.score = item.score;
    member.rank  = i++; 
  }
}