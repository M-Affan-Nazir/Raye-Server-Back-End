const express = require("express")
const app = express()
const connect = require("./db/connect")
const ChatSch = require("./db/chatSchema")
const mongoose = require("mongoose")

app.get("/getChats/:id",async (req,res)=>{
    try {
        const Chat = new mongoose.model(req.params.id,ChatSch)
        const chats= await Chat.find().sort({createdAt : -1})
        res.send(chats)
    }
    catch(e){
        console.warn(e)
    }
})


app.listen(8000,()=>{
    console.log("listening on port 8000")
})