const express = require("express")
const app = express()
const mongoose = require("mongoose")
const saySomethingSchema = require("./db/saySomethingSchema")
const announcementSchema = require("./db/announcementSchema")
const shareSchema =  require("./db/shareRayeSchema")
const UsrSchema = require("./db/userSchema")
const jwt = require("jsonwebtoken")

var postDBCon = mongoose.createConnection("mongodb://127.0.0.1:27017/userPosts")
var userCon = mongoose.createConnection("mongodb://127.0.0.1:27017/userDB")

const User = userCon.model("UserList", UsrSchema)


app.use(express.json())

app.post("/postSaySomething", verifyToken, async (req,res)=> {
    console.log("COnnection!!")
    try{
        const {text} = req.body
        const UID = req.decodedUID
        postDBCon.models = {}  //removes previous models stored in memory
        const UserSaySomethingPost = postDBCon.model(UID, saySomethingSchema)
        const postData = {
            text : text,
            postType : "saySomething",
            createdAt : Math.floor(Date.now()/1000) ,
            likesUID : [],
            comments : []

        }
        const savePost = new UserSaySomethingPost(postData)
        await savePost.save()
        res.json("success")
        console.log("success")
    } catch (e) {
        console.log("Error: "+e)
        res.json("error")
    }
})

app.post("/postAnnouncement", verifyToken, async (req, res)=> {
    try{
        const {title, announcement} = req.body
        const UID = req.decodedUID
        postDBCon.models = {}
        const UserAnnouncementPost = postDBCon.model(UID, announcementSchema)
        const postData = {
            title : title,
            announcement : announcement,
            postType : "announcement",
            createdAt : Math.floor(Date.now()/1000),
            likesUID : [],
            comments : []
        }
        const savePost = new UserAnnouncementPost(postData)
        await savePost.save()
        res.json("success")
    }
    catch(e){
        console.log("Error:"+e)
        res.json("error")
    }
})


app.post("/shareRaye", verifyTokenDouble, async (req,res) => {
    try{
        const meUID = req.meUID
        const userUID = req.userUID
        const {postID} = req.body
        if(postID){
            //Check Post exist, save if it exists (use findByID's callback function)
            postDBCon.models = {}
            const posts = postDBCon.model(userUID, saySomethingSchema)
            posts.findById(postID, async (err, _result)=>{
                    if(err){
                        res.json("error")  //post not found  
                    } else{
                        postDBCon.models = {}
                        const shareRaye = postDBCon.model(meUID, shareSchema)
                        const data = {
                            postType : "share",
                            uidOfUser : userUID,
                            postID : postID,
                            createdAt : Math.floor(Date.now()/1000)
                        }
                        const saveShareRaye = new shareRaye(data)
                        await saveShareRaye.save()
                        res.json("success")
                    }
            })
        }
        else{
            res.json("error")
        }
    }
    catch(e){
        console.log("Error: "+e)
        res.json("error")
    }
} )


app.post("/deletePost", verifyToken, async (req,res) => {
    try {
        const {postID} = req.body
        const UID = req.decodedUID
        postDBCon.models = {}
        const UserSaySomethingPost = postDBCon.model(UID, saySomethingSchema)
        await UserSaySomethingPost.deleteOne({_id : postID})
        res.json("success")
    }
    catch (e) {
        console.log("Error:"+e)
        res.json("error")
    }
})


//TEMP: 
app.get("/getTokenTemp/:uid", (req,res)=> {
    console.log("connection!")
    const token = jwt.sign(req.params.uid, "secretKey")
    res.json(token)
})
app.get("/getTokenTemp2", (req,res)=> {
    const token = jwt.sign("Lw9P9Hq30ad6fKBcHXfAURNNAVF2", "secretKey")
    res.json(token)
})
app.get("/getTokenTemp3", (req,res)=> {
    const token = jwt.sign({
                                meuid : "wTErVKHIzASsSOSpFxMoyyFZjuG3",
                                useruid : "Mx27K59xPZSTNlTxRNDMysfLQTP2"
                            }, "secretKey")
    res.json(token)
})
app.get("/tempDecode/:uid",(req,res)=>{
    const uid = req.params.uid
    const decoded = jwt.verify(uid,"secretKey")
    res.json(decoded)
})


//------


app.listen(8009, ()=>{
    console.log("Listening on port 8009")
})






//MiddleWares:
async function verifyToken(req,res,next) {
    try {
        console.log("NEW XON!")
        const {key} = req.body
        const decodedUID = jwt.verify(key, "secretKey")
        const foundUser = await User.findOne({uid:decodedUID})
        if(foundUser == null){
            res.json("error")
            console.log("error")
        } else {
            req.decodedUID = decodedUID
            next()
        }
    } catch(e){
        res.json("error")
        console.log("error")
    }
    
}

async function verifyTokenDouble(req,res,next) {
    try{
        const {key} = req.body
        const decodedKey = jwt.verify(key, "secretKey")
        const meUID = decodedKey.meuid
        const userUID = decodedKey.useruid
        const meFoundUser = await User.findOne({uid:meUID})
        const userFoundUser = await User.findOne({uid:userUID})
        if(meFoundUser == null || userFoundUser == null ){
            res.json("error")  //user Not Found            
        }
        else {
            req.meUID = meUID
            req.userUID = userUID
            next()
        }

    }   
    catch(e){
        res.json("error") //jwt token is wrong or something else
        console.log("Error: "+e)
    }
}
