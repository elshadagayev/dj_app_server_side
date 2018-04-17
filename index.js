const express = require("express")
const socketIO = require("socket.io")
const http = require("http")
require("dotenv").config()
const ApiRoutes = require("./app/routes/api-routes")
const HtmlRoutes = require("./app/routes/html-routes")
const SocketRoutes = require('./app/routes/socket-routes')
const cors = require("cors")
const bodyParser = require("body-parser")
const path = require("path")

process.setMaxListeners(0);

const app = express()
const server = http.createServer(app)
const io = socketIO(server, 
{
    'pingInterval': 5000, 
    'pingTimeout': 5000,
})
app.use(cors())
app.use(bodyParser.json({
    extended: true
}))
app.use(express.static(path.join(__dirname, '/client/static')))

new ApiRoutes(app)
new HtmlRoutes(app)
new SocketRoutes(io)

server.listen(process.env.PORT || 5000, () => {
    console.log("Listening port", process.env.PORT || 5000)
})