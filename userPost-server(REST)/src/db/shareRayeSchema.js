const mongoose = require("mongoose")

const shareRayeSchema = new mongoose.Schema({
    postType : {
        type : String
    },
    uidOfUser : {
        type : String
    },
    postID : {
        type : String
    },
    createdAt : {
        type : Number
    },  

})

module.exports = shareRayeSchema