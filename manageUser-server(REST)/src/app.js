const express = require("express")
const app = express()
const mongoose = require("mongoose")
const bcrypt =  require("bcrypt")
const UsrSchema = require("./db/userSchema")

var userCon = mongoose.createConnection("mongodb://127.0.0.1:27017/userDB")

app.use(express.json())

app.get("/verifyInsignia/:insignia", async (req,res) => {
    try{
        const insignia = req.params.insignia
        const User = userCon.model("UserList", UsrSchema)
        const result = await User.countDocuments({userInsignia : insignia})
        if(result == 0){
            res.json({code:1})
        } else if(result > 0){
            res.json({code:2})
        }
    } catch (e) {
        console.warn(e)
        res.json({code:0})
    }
})

app.post("/createUser", async (req,res)=> {
    try {
        const {uid, avatar, userName,userInsignia, email, password} = req.body
        const User = userCon.model("UserList", UsrSchema)
        const hashedPwd = await hashPassword(password)
        const data = {
            uid : uid,
            avatar :avatar , 
            userName : userName,
            userInsignia: userInsignia,
            standPoint : "",
            email : email,
            password : hashedPwd
        }
        const userInstance = User(data)
        await userInstance.save()
        res.json({code:1})
    } catch (e) {
        console.warn(e)
        res.json({code:0})
    }

})

app.post("/updateImage",async(req,res)=>{
    try{
        const {uid,url} = req.body
        const User = userCon.model("UserList", UsrSchema)
        await User.updateOne({uid:uid},{avatar:url})
        res.json({code:1})
    } catch(e){
        console.log(e)
        res.json({code:0})
    }
})

app.post("/updateStandpoint",async(req,res)=>{
    try{
        const {uid,standPoint} = req.body
        const User = userCon.model("UserList", UsrSchema)
        await User.updateOne({uid:uid},{standPoint:standPoint})
        res.json({code:1})
    } catch(e){
        console.log(e)
        res.json({code:0})
    }
})


async function hashPassword(pwd) {
    const salt = await bcrypt.genSalt(11);
    const hash = await bcrypt.hash(pwd,salt)
    return hash;
}

app.listen(8005, ()=>{
    console.log("Listening on port 8005")
})
