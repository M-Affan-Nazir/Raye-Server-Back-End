const io = require("socket.io")(3420)
const mongoose = require("mongoose")
const saySomethingSchema = require("./db/saySomethingSchema")
const announcementSchema = require("./db/announcementSchema")
const letterRecSchema = require("./db/letterRecSchema")
const shareSchema =  require("./db/shareRayeSchema")
const UsrSchema = require("./db/userSchema")
const jwt = require("jsonwebtoken")

var postDBCon = mongoose.createConnection("mongodb://127.0.0.1:27017/userPosts")
var userCon = mongoose.createConnection("mongodb://127.0.0.1:27017/userDB")
var letterCon = mongoose.createConnection("mongodb://127.0.0.1:27017/letter")

const User = userCon.model("UserList", UsrSchema)


console.log("SOCKET SERVER STARTING..")

io.on("connection",socket=> {
    console.log("Connected:"+socket.id)

    socket.on("likeUnlikePost", async (key, userUID, postID, likeOrUnlike) => {
        try{
            const meUID = await verifyToken(key)
            if(meUID != null){
                if(likeOrUnlike == "like"){
                    postDBCon.models = {}
                    const UserSaySomethingPost = postDBCon.model(userUID, saySomethingSchema)
                    const post = await UserSaySomethingPost.findOne({_id:postID})
                    if(post){
                        const likes = post.likesUID
                        const index = likes.indexOf(meUID)
                        if(index == -1){
                            const newLikes = likes
                            newLikes.push(meUID)
                            await UserSaySomethingPost.updateOne({_id:postID},{$set : {likesUID : newLikes} })
                        }
                    }
                }
                else{
                    postDBCon.models = {}
                    const UserSaySomethingPost = postDBCon.model(userUID, saySomethingSchema)
                    const post = await UserSaySomethingPost.findOne({_id:postID})
                    if(post){
                        const likes = post.likesUID
                        const index = likes.indexOf(meUID)
                        if(index > -1){
                            let newLikes = likes
                            newLikes = newLikes.filter(x=> x != meUID)
                            await UserSaySomethingPost.updateOne({_id:postID},{$set : {likesUID : newLikes} })
                        }
                    }
                }
            }
        }
        catch(e){
            console.log(e)
        }
    })


    socket.on("addComment" , async (key, text, userUID, postID) => {
        try{
            const meUID = await verifyToken(key)
            if(meUID != null){
                postDBCon.models = {}
                const UserSaySomethingPost = postDBCon.model(userUID, saySomethingSchema)
                const post = await UserSaySomethingPost.findOne({_id:postID})
                if(post){
                    const newComments = post.comments
                    data = {
                        uid : meUID,
                        postedAt : Math.floor(Date.now()/1000),
                        comment : text,
                        likesUID : [],
                    }
                    newComments.push(data)
                    await UserSaySomethingPost.updateOne({_id:postID},{$set : {comments : newComments} })
                }
            }
        }
        catch(e){
            console.log(e)
        }
    })


    socket.on("deleteComment" , async (key, userUID, postID, commentID) => {
        try{
            const meUID = await verifyToken(key)
            if(meUID != null){
                postDBCon.models = {}
                const UserSaySomethingPost = postDBCon.model(userUID, saySomethingSchema)
                const post = await UserSaySomethingPost.findOne({_id:postID})
                if(post){
                    let newComments = post.comments
                    const commentToGetDeleted = newComments.filter(x => x._id == commentID)
                    if(commentToGetDeleted[0] != null){  //if comment not exist, 0th index is null since commentToGetDeleted will be empty array 
                        if(commentToGetDeleted[0].uid == meUID || meUID == userUID ){  //.filter returns array. since only one element matches array will have only 1 element (at [0])
                            newComments = newComments.filter(x => x._id != commentID)
                            await UserSaySomethingPost.updateOne({_id:postID},{$set : {comments : newComments} })
                        } 
                    }
                }
            }
        }
        catch(e){
            console.log(e)
        }
    })



    
    socket.on("share", async (key, postID) => {
        try{
            const decoded = await verifyTokenDouble(key)
            const meUID = decoded.meuid        //ye post share kar raha apni wall pai
            const userUID = decoded.useruid    //iski post share hogi
            if(postID){
                //Check Post exist, save if it exists (use findByID's callback function)
                postDBCon.models = {}
                const posts = postDBCon.model(userUID, saySomethingSchema)
                posts.findById(postID, async (err, _result)=>{
                        if(err){
                            console.log("post not found")  //post not found  
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
                        }
                })
            }
        }
        catch(e){
            console.log(e)
        }
    })


    socket.on("likeUnlikeComment", async(key, userUID, postID, commentID, likeOrUnlike) => {
        try{
            const meUID = await verifyToken(key)
            if(meUID != null){
                if(likeOrUnlike == "like"){
                    postDBCon.models = {}
                    const UserSaySomethingPost = postDBCon.model(userUID, saySomethingSchema)
                    const post = await UserSaySomethingPost.findOne({_id:postID})
                    if(post){
                        let newComments = post._doc.comments
                        let comment = newComments.filter(x => x._id == commentID)[0]
                        console.log(commentID)
                        if(comment != null){
                            newComments =  newComments.filter(x => x._id != commentID)
                            let likesUID = comment.likesUID
                            const index = likesUID.indexOf(meUID)
                            if(index == -1){
                                likesUID.push(meUID)
                                const data = {
                                    uid : comment.uid,
                                    postedAt : comment.postedAt,
                                    comment : comment.comment,
                                    likesUID : likesUID,
                                    _id:comment._id
                                }
                                newComments.push(data)
                                await UserSaySomethingPost.updateOne({_id:postID},{$set : {comments : newComments} })
                            }
                        }
                    }
                }
                else{
                    postDBCon.models = {}
                    const UserSaySomethingPost = postDBCon.model(userUID, saySomethingSchema)
                    const post = await UserSaySomethingPost.findOne({_id:postID})
                    if(post){
                        let newComments = post.comments
                        let comment = newComments.filter(x => x._id == commentID)[0]
                        if(comment != null){
                            newComments =  newComments.filter(x => x._id != commentID)
                            let likesUID = comment.likesUID
                            const index = likesUID.indexOf(meUID)
                            if(index > -1){
                                likesUID = likesUID.filter(x=> x != meUID)
                                const data = {
                                    uid : comment.uid,
                                    postedAt : comment.postedAt,
                                    comment : comment.comment,
                                    likesUID : likesUID,
                                    _id:comment._id
                                }
                                newComments.push(data)
                                await UserSaySomethingPost.updateOne({_id:postID},{$set : {comments : newComments} })
                            }
                        }
                    }
                }
            }

        }
        catch(e){
            console.log(e)
        }
    })

    socket.on("likeUnlikeLetter",async(key,id, likeOrUnlike)=>{
        try{
            const meUID = await verifyToken(key)
            if(meUID != null){
                letterCon.models = {}
                const LetterRef = letterCon.model(meUID, letterRecSchema)
                if(likeOrUnlike == "like"){
                    await LetterRef.updateOne({_id:id},{$set : { likedByMe : "true"} })
                }
                else{
                    await LetterRef.updateOne({_id:id},{$set : { likedByMe : "false"} })
                }
            }
        }
        catch(e){
            console.log(e)
        }
    })

    socket.on("readLetter", async(key,letterID) => {
        try{
            const meUID = await verifyToken(key)
            if(meUID != null){
                letterCon.models = {}
                const LetterRef = letterCon.model(meUID, letterRecSchema)
                await LetterRef.updateOne({_id : letterID },{$set:{readByMe:"read"}})
            }
        }
        catch(e){
            console.log(e)
        }
    })

})















//functions:
async function verifyToken(token) {
    try {
        const decodedUID = jwt.verify(token, "secretKey")
        const foundUser = await User.findOne({uid:decodedUID})
        if(foundUser == null){
            return null
        } else {
            return decodedUID
        }
    } catch(e){
        console.log("error: " + e)
    }
    
}


async function verifyTokenDouble(token) {
    try{
        const decodedKey = jwt.verify(token, "secretKey")
        const meUID = decodedKey.meuid
        const userUID = decodedKey.useruid
        const meFoundUser = await User.findOne({uid:meUID})
        const userFoundUser = await User.findOne({uid:userUID})
        if(meFoundUser == null || userFoundUser == null ){   
            return null        
        }
        else {
            return decodedKey
        }

    }   
    catch(e){
        console.log("error: "+e)
    }
}