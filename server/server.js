const express = require("express")
const app = express()
const server = require("http").createServer(app)
const io = require("socket.io")(server)

app.use(express.static("../client/out"))

const members = []
const n_member = 5
const jobs = {
  werewolf: 1,
  fourtune_teller: 1,
  hunter: 1,
  shaman: 1,
  other: 1
}

io.on("connection", (socket) => {
  console.log("connected")
  socket.on("clientMessage", (msg) => {
    console.log(`clientMessage: ${msg}`)
    io.emit("serverMessage", msg)
  })
  socket.on("clientMemberJoin", (msg) => {
    members.push({socket: socket, name: msg})
    console.log(`clientMemberJoin: ${msg}`)
    io.emit("serverMemberJoin", members.map((x) => x.name))
    io.emit("serverMessage", `${msg} が入室しました`)
    // memo: removeLister
  })
})

server.listen(3000)
