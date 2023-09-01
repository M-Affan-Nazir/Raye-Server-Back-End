const express = require("express")
const app = express()
const mongoose = require("mongoose")
const letterRecSchema = require("./db/letterRecSchema")
const letterSentSchema = require("./db/letterSentSchema")
const UsrSchema = require("./db/userSchema")
const jwt = require("jsonwebtoken")

var userCon = mongoose.createConnection("mongodb://127.0.0.1:27017/userDB")
var letterCon = mongoose.createConnection("mongodb://127.0.0.1:27017/letter")

const User = userCon.model("UserList", UsrSchema)

app.use(express.json())


app.post("/postLetter", verifyToken, async (req,res)=>{
    try{
        const decodedUid = req.decodedUID
        const toUID = req.body.toUID
        const subject = req.body.subject
        const text = req.body.text
        const createdAt = Math.floor(Date.now()/1000)
        if(toUID != decodedUid){
            letterCon.models = {}
            const LetterRef = letterCon.model(toUID, letterRecSchema)
            const recData = {
                fromUID : decodedUid,
                subject : subject,
                text : text,
                createdAt : createdAt,
                likedByMe : "false",
                readByMe : "false",
                type : "receive"
            }
            const saveLetter = LetterRef(recData)
            const theId = saveLetter._id
            await saveLetter.save()
            letterCon.models = {}
            const LetterRef2 = letterCon.model(decodedUid, letterSentSchema)
            const sentData = {
                sentToUid : toUID,
                theId : theId,
                type : "sent",
                createdAt : createdAt
            }
            const saveLetterSent = LetterRef2(sentData)
            await saveLetterSent.save()
            res.json("success")
        }
        else{
            res.json("Cant Send To Your Own Self")
        }
    }
    catch(e){
        console.log(e)
    }
})


app.post("/getReceivedLetter", verifyToken, async (req,res)=>{
    try{
        const finalizedLetters = []
        const decodedUid = req.decodedUID
        letterCon.models = {}
        const LetterRef = letterCon.model(decodedUid, letterRecSchema)
        const foundLetters = await LetterRef.find({type : "receive"}).sort({createdAt : -1})
        for(let letter of foundLetters){
            const userData = await getUserData(letter.fromUID)
            const creationMessage = getCreationTimeMessage(letter.createdAt)
            const finalized = {...letter._doc,userData:userData,creationMessage:creationMessage}
            finalizedLetters.push(finalized)
        }
        res.json(finalizedLetters)
        await LetterRef.updateMany({readByMe : "false"},{$set:{readByMe:"true"}})
    }
    catch(e){
        console.log(e)
    }
})

app.post("/getSentLetter", verifyToken, async (req,res)=>{
    try{
        const finalizedLetters = []
        const decodedUid = req.decodedUID
        letterCon.models = {}
        const LetterRef = letterCon.model(decodedUid, letterSentSchema)
        const foundLetters = await LetterRef.find({type : "sent"}).sort({createdAt : -1})
        for(let letter of foundLetters){
            const userData = await getUserData(letter.sentToUid)
            letterCon.models = {}
            const LetterRef2 = letterCon.model(letter.sentToUid, letterSentSchema)
            const creationMessage = getCreationTimeMessage(letter.createdAt)
            const theLetter = await LetterRef2.find({_id:letter.theId})
            const finalized = {...theLetter[0]._doc,sentCollection_id:letter._id,userData:userData,creationMessage:creationMessage}
            finalizedLetters.push(finalized)
        }
        res.json(finalizedLetters)
    }
    catch(e){
        console.log(e)
    }
})








app.listen(8012, ()=>{
    console.log("Listening on port 8012")
})














async function verifyToken(req,res,next) {
    try {
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

async function getUserData(userUid){
    const foundUser = await User.findOne({uid:userUid})
    const data = {
        uid: foundUser.uid,
        avatar : foundUser.avatar,
        userName: foundUser.userName,
        userInsignia: foundUser.userInsignia,
        standPoint : foundUser.standPoint
    }
    return data;
}

function getCreationTimeMessage(epochCreatedSeconds){
    let creationTimeMessage;
    const secondsAgo = Math.floor(Date.now()/1000) - epochCreatedSeconds
    if(secondsAgo < 60 ){
        creationTimeMessage = secondsAgo + " Seconds Ago"
    }
    else if((secondsAgo / 60) < 60){
        creationTimeMessage = Math.floor( (secondsAgo / 60) )+ " Minutes Ago"
    }
    else if((secondsAgo / (60*60)) < 24){
        creationTimeMessage = Math.floor((secondsAgo / (60*60))) + " Hours ago"
    }
    else if((secondsAgo / (60*60*24)) < 30 ){
        creationTimeMessage = Math.floor(secondsAgo / (60*60*24))+ " Days Ago"
    }
    else if((secondsAgo / (60*60*24*30)) < 12 ){
        creationTimeMessage = Math.floor(secondsAgo / (60*60*24*30)) + " Months Ago"
    }
    else{
        creationTimeMessage = Math.floor(secondsAgo / (60*60*24*30*12)) + " Years Ago"
    }
    return creationTimeMessage
}