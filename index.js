const express = require("express")
require("dotenv").config()
const ApiRoutes = require("./app/routes/api-routes")
const cors = require("cors")
const bodyParser = require("body-parser")

const app = express()
app.use(cors())
app.use(bodyParser.json({
    extended: true
}))

new ApiRoutes(app)

app.listen(process.env.SERVER_PORT, () => {
    console.log("Listening port", process.env.SERVER_PORT)
})