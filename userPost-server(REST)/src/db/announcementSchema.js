const mongoose = require("mongoose")

const announcementSchema = new mongoose.Schema({
    title : {
        type : String
    },
    announcement : {
        type : String
    },
    postType : {
        type : String
    },
    createdAt : {
        type : Number
    },  
    likesUID : {  //array contains UIDs of users who liked
        type : [String]
    },
    comments : {
        type : [{  //array contains all the comments 
            uid : String,    //UID of person posting comment
            postedAt : Number,
            comment : String,
            likesUID : [String],  //This Array contains UIDs of all users who liked comment
        }]
    }
})

module.exports = announcementSchema