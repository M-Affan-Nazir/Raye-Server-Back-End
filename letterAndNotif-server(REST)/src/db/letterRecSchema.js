const mongoose = require("mongoose")

const letterRecSchema = new  mongoose.Schema({
    fromUID : {
        type:String
    },
    subject : {
        type:String
    },
    text : {
        type : String
    },
    createdAt : {
        type:Number
    },
    likedByMe:{
        type:String
    },
    readByMe:{
        type:String
    },
    type : {
        type:String
    }
})

module.exports = letterRecSchema