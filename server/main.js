'use strict'
const http = require("http")
const Server = require("socket.io")
const fs = require("fs")

const server = http.createServer((req, res) => {
  fs.readFile("./pages/index.html", (err, data) => {
    return res.end(data)
  })
}).listen(3000)

const io = Server(server)

io.on("connection", socket => {
  console.log("connected")
  socket.emit("fromServer", "connected")
  socket.on("fromClient", (msg) => {
    console.log(`fromClient: ${msg}`)
  })
})

setInterval(() => {
  console.log("test")
  io.emit("fromServer", "interval")
}, 10000)
