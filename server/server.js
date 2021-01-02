const express = require("express")
const app = express()
const server = require("http").createServer(app)
const io = require("socket.io")(server)

app.use(express.static("../client/out"))

io.on("connection", (socket) => {
  console.log("connected")
  socket.on("fromClientChat", (msg) => {
    console.log(`fromClientChat: ${msg}`)
    socket.emit("fromServerBroadcast", msg)
  })
  socket.on("fromClient", (msg) => {
    console.log(`fromClient: ${msg}`)
  })
})

server.listen(3000)
