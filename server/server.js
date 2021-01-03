const express = require("express")
const app = express()
const server = require("http").createServer(app)
const io = require("socket.io")(server)

app.use(express.static("../client/out"))

io.on("connection", (socket) => {
  console.log("connected")
  socket.on("clientMessage", (msg) => {
    console.log(`clientMessage: ${msg}`)
    socket.emit("serverMessage", msg)
  })
  socket.on("clientMemberJoin", (msg) => {
    console.log(`clientMemberJoin: ${msg}`)
    socket.emit("serverMemberJoin", "someone")
    io.emit("serverMessage", `${msg} が入室しました`)
  })
})

server.listen(3000)
