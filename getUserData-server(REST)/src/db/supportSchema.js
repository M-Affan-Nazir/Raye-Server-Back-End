const mongoose = require("mongoose")

const supportSchema = new  mongoose.Schema({
    uid : {
        type:String
    }
})

module.exports = supportSchema