const express = require("express")
const app = express()
const SprtSchema = require("./db/supportSchema")
const UsrSchema = require("./db/userSchema")
const saySomethingSchema = require("./db/saySomethingSchema")
const mongoose = require("mongoose")

var supporterCon = mongoose.createConnection("mongodb://127.0.0.1:27017/supporter")
var supportingCon = mongoose.createConnection("mongodb://127.0.0.1:27017/supporting")
var userCon = mongoose.createConnection("mongodb://127.0.0.1:27017/userDB")
var postDBCon = mongoose.createConnection("mongodb://127.0.0.1:27017/userPosts")

app.use(express.json())

app.post("/getUserData", async(req,res)=>{
    try{
        const {uid, uidUser} = req.body

        const Supporter = supporterCon.model(uid,SprtSchema)
        const Supporting = supportingCon.model(uid, SprtSchema)
        postDBCon.models = {}
        const UserSaySomethingPost = postDBCon.model(uid, saySomethingSchema)
        const supportersNumber = await Supporter.countDocuments()
        const supportingNumber = await Supporting.countDocuments()
        const totalPosts = await UserSaySomethingPost.countDocuments()
        const followingUser = await Supporter.countDocuments({uid : uidUser})

        const User = userCon.model("UserList", UsrSchema)
        const foundUser = await User.findOne({uid:uid})

        const data = {
            uid : foundUser.uid,
            avatar: foundUser.avatar,
            userName : foundUser.userName,
            userInsignia : foundUser.userInsignia,
            standPoint : foundUser.standPoint,
            supportersNumber : supportersNumber,
            supportingNumber : supportingNumber,
            following : followingUser,
            totalPosts:totalPosts,

        }

        res.json(data)
    
    }
    catch(e){
        console.log(e)
    }



})


app.listen(8006,()=>{
    console.log("Listening on Port 8006")
})