const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    uid : {
        type : String
    },
    avatar : {
        type : String
    },
    userName : {
        type: String
    },
    userInsignia : {
        type : String
    },
    standPoint : {
        type : String
    },
    email : {
        type : String
    },
    password : {
        type : String
    }
})

module.exports = userSchema