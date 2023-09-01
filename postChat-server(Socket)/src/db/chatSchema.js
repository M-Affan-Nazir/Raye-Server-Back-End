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
    createdAt:{
        type:Number
    },
    uid : {
        type:String
    },
    key:{
        type:Number
    }
})

const ChatSchema = universalChatSchema

module.exports = ChatSchema
