const connect = require("./db/connect")
const ChatSchema = require("./db/chatSchema")
const mongoose = require("mongoose")
const io = require("socket.io")(3000)

console.log("SOCKET SERVER STARTING..")


io.on("connection",socket=> {

    console.log("Connected:"+socket.id)
    console.log(socket.id)

    socket.on("sentMessage",async(message,chatId)=>{
        try {
            //console.log(message)
            socket.broadcast.to(chatId).emit("receiveMessage",message)
            const Chat = new mongoose.model(chatId,ChatSchema)
            const msgData = {
                text : message.text,
                email : message.email,
                user : message.user,
                avatar : message.avatar,
                uid : message.uid,
                createdAt : ~~(+new Date()/1000)
            }
            console.log(msgData)
            const chat = new Chat(msgData)
            await chat.save()
            console.log("Saved succesfully")
        }
        catch(e){
            console.warn(e)
        }
    })

    socket.on("joinRoom", (roomId)=>{
        console.log("Joining:"+roomId)
        socket.join(roomId)
    })

    socket.on("disconnectSocket",()=>{
        console.log("Disconnecting")
        socket.disconnect()
    })

})
