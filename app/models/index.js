const mongoose = require("mongoose")

try {
    mongoose.connect(process.env.MONGODB)
    mongoose.connection.on('open', () => {
        console.log("Connected to the MongoDB")
    })
} catch(E) {
    console.log("Could not connect to the MongoDB. Error", E, ". Server has been stopped")
    process.exit();
}

const fs = require("fs")
const db = {}

const files = fs.readdirSync(__dirname)

files.forEach(el => {
    if(el === 'index.js')
        return;
    db[el.split('.js')[0]] = require(__dirname + "/" + el)(mongoose)
})

module.exports = db