const { GameServer, playGame, inputAssign, inputQuestionnaire} = require("./lib/controller");
const { inputNonNegativeInteger } = require("./lib/utils");
const fs = require('fs')
const csv = require('csv')
const conf = require('config');

const jobs = ["人狼", "占い師", "霊媒師", "狩人", "パン屋", "狂人", "市民"];

const playGameOnce = async (jobs, port, staticDir="../client/out/") => {
 
  // process config
  console.log(conf.assign);
  console.log(conf.mode);

  let rankingTable;
  if (conf.mode === "pre-ranking") {
    let rawRankingTable = await readCSV(conf.rankingFileName);
    console.log(rawRankingTable);
  
    const title = rawRankingTable.shift()[0];
    let items = [];
    for (const item of rawRankingTable) {
      const item_ = item.slice(0, 2); 
      console.log(item_);
      const item__ = {
        name: item_[0],
        score: item_[1]
      };
      items.push(item__);
    }
    rankingTable = {
      title: title,
      items: items,
    }
    console.log("rankingTable:");
    console.log(rankingTable);
  }

  let questionnaire = conf.questionnaire;
  let assign        = conf.assign;
  let timeLimit     = conf.timeLimit;

  if (false) {
    questionnaire = await inputQuestionnaire("質問：")
    assign = await inputAssign(jobs)
    timeLimit = await inputNonNegativeInteger("相談時間は何秒？：")
    
  }
  console.log("設定完了です。ブラウザからアクセスしてください。")
  const server = new GameServer(staticDir, port)
  server.start();
  await playGame(assign, timeLimit, server, questionnaire, rankingTable);
  server.close()
}

playGameOnce(jobs, 3000);


async function readCSV(fileName) {
  return new Promise((resolve, reject) => {
      let rankingTable;
      const rs = fs.createReadStream(__dirname + '/' + fileName);
      const ws = csv.parse(function(err, data) {
        console.log("Create write stream");
        rankingTable = data;
      });
      rs.pipe(ws);

      ws.on('end', () => {
          console.log("end of write stream");
          resolve(rankingTable);
      });
  });
}
