const { GameServer, playGame, inputAssign, inputQuestionnaire} = require("./lib/controller");
const { inputNonNegativeInteger } = require("./lib/utils");

const playGameOnce = async (jobs, port, staticDir="../client/out/") => {
  const questionnaire = await inputQuestionnaire("質問：")
  const assign = await inputAssign(jobs)
  const timeLimit = await inputNonNegativeInteger("相談時間は何秒？：")
  console.log("設定完了です。ブラウザからアクセスしてください。")
  const server = new GameServer(staticDir, port)
  server.start();
  await playGame(assign, timeLimit, server, questionnaire);
  server.close()
}

const jobs = ["人狼", "占い師", "霊媒師", "狩人", "市民"]
playGameOnce(jobs, 3000)
