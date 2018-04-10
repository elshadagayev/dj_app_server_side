const express = require("express")
const socketIO = require("socket.io")
const http = require("http")
require("dotenv").config()
const ApiRoutes = require("./app/routes/api-routes")
const SocketRoutes = require('./app/routes/socket-routes')
const cors = require("cors")
const bodyParser = require("body-parser")

process.setMaxListeners(0);

const app = express()
const server = http.createServer(app)
const io = socketIO(server, {'pingInterval': 5000, 'pingTimeout': 5000})
app.use(cors())
app.use(bodyParser.json({
    extended: true
}))

new ApiRoutes(app)
new SocketRoutes(io)

server.listen(process.env.SERVER_PORT, () => {
    console.log("Listening port", process.env.SERVER_PORT)
})