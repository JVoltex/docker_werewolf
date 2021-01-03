const express = require("express")
const app = express()
const server = require("http").createServer(app)
const io = require("socket.io")(server)

app.use(express.static("../client/out"))

const members = []

io.on("connection", (socket) => {
  console.log("connected")
  socket.on("clientMessage", (msg) => {
    console.log(`clientMessage: ${msg}`)
    io.emit("serverMessage", msg)
  })
  socket.on("clientMemberJoin", (msg) => {
    members.push(msg)
    console.log(`clientMemberJoin: ${msg}`)
    io.emit("serverMemberJoin", members.join("\t"))
    console.log(members)
    io.emit("serverMessage", `${msg} が入室しました`)
  })
})

server.listen(3000)
