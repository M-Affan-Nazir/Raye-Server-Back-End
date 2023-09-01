const mongoose = require("mongoose")

const letterSentSchema = new  mongoose.Schema({
    sentToUid : {
        type:String
    },
    theId : {
        type : String
    },
    type : {
        type:String
    },
    createdAt : {
        type:Number
    }
})

module.exports = letterSentSchema