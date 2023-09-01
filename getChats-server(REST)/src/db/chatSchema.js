const mongoose = require("mongoose")

const universalChatSchema = new mongoose.Schema({
    text : {
        type:String
    },
    email:{
        type:String
    },
    user:{
        type:String
    },
    avatar:{
        type:String
    },
    uid : {
        type:String
    },
    createdAt:{
        type:Number
    }
})

const ChatSch = universalChatSchema

module.exports = ChatSch
