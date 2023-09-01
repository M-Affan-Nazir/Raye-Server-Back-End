const express = require("express")
const app = express()
const mongoose = require("mongoose")
const saySomethingSchema = require("./db/saySomethingSchema")
const announcementSchema = require("./db/announcementSchema")
const UsrSchema = require("./db/userSchema")
const SprtSchema = require("./db/supportSchema")

const jwt = require("jsonwebtoken")


var postDBCon = mongoose.createConnection("mongodb://127.0.0.1:27017/userPosts")
var userCon = mongoose.createConnection("mongodb://127.0.0.1:27017/userDB")
var supportingCon = mongoose.createConnection("mongodb://127.0.0.1:27017/supporting")

const User = userCon.model("UserList", UsrSchema)

app.use(express.json())


app.post("/getUserPosts", verifyToken, async (req,res) => {
    try{
        const meUID = req.decodedUID
        const {uid} = req.body  //UID jis ki profile posts nikalni
        postDBCon.models = {}
        const UserSaySomethingPost = postDBCon.model(uid, saySomethingSchema) 
        const Posts = await UserSaySomethingPost.find().sort({createdAt : -1})  //find() gets both "announcement" & "saySomething" (all data in collection)
        const data = await preparePosts(Posts, meUID, uid) //await since woh function khud async hai
        res.json(data)
    }   
    catch(e){
        console.log("Error: "+e)
    }

})

app.post("/getPostLikes", async (req,res) => {
    try{
        const userUID = req.body.userUID
        const postID = req.body.postID
        postDBCon.models = {}
        const PostModel = postDBCon.model(userUID, saySomethingSchema)
        const post = await PostModel.findOne({_id:postID})
        if(post == null){
            res.json({code : "unavailable"})
        }
        else{
            const userDataList = []
            const likesUID = post.likesUID
            for(let uid of likesUID){
                const foundUser = await subGetUserData(uid)
                if(foundUser != null){
                    userDataList.push(foundUser)
                }
            } 
            res.json(userDataList)
        }

    }
    catch(e){
        console.warn(e)
    }
})

app.post("/getPostComments", verifyToken, async (req,res)=>{
    try{
        const meUID = req.decodedUID
        const userUID = req.body.userUID
        const postID = req.body.postID
        postDBCon.models = {}
        const PostModel = postDBCon.model(userUID, saySomethingSchema)
        const post = await PostModel.findOne({_id:postID})
        if(post == null){
            res.json({code : "unavailable"})
        }
        else{
            const organizedCommentsData = []
            const comments = post.comments
            for(let comment of comments){
                let userData;
                let creationMessage;
                let theComment;
                let totalLikes;
                let likedbyMe;

                const likesUID = comment.likesUID 
                const index = likesUID.indexOf(meUID)
                const commentID = comment._id
                userData = await subGetUserData(comment.uid)
                creationMessage = getCreationTimeMessage(comment.postedAt)
                theComment = comment.comment
                totalLikes = likesUID.length
                if(index > -1){
                    likedbyMe = true
                }
                else {
                    likedbyMe = false
                }
                
                const data = {
                    userData : userData,
                    comment:theComment,
                    creationMessage : creationMessage,
                    totalLikes : totalLikes,
                    likedByMe: likedbyMe,
                    commentID : commentID
                }

                organizedCommentsData.push(data)

            }
            res.json(organizedCommentsData)
        }
    }
    catch(e){
        console.log(e)
    }
})


app.post("/getFeed", verifyToken, async (req,res)=>{
    try{
        let feed = await generateFeed()
        feed = shuffle(feed)
        feed = shuffle(feed)
        feed = shuffle(feed)
        feed = await prepareFeed(feed,req.decodedUID)
        res.json(feed)
    }
    catch(e){
        console.warn(e)
    }
})


app.post("/search",verifyToken, async(req,res)=>{
    const search = req.body.search
    const exactFound = await User.find({userInsignia : search})
    if(exactFound[0] != undefined){
        const obj={
            uid: exactFound[0].uid,
            avatar : exactFound[0].avatar,
            userName: exactFound[0].userName,
            userInsignia: exactFound[0].userInsignia,
            standPoint : exactFound[0].standPoint
        }
        res.json([obj])
    }
    else {
        const found = await User.find({$or : [{userName : {$regex : search, $options : "i"}},{userInsignia : {$regex : search, $options : "i"}}]})
        const finalised = prepareUserFromRaw(found)
        res.json(finalised)
    }
})
















app.listen(8010, ()=>{
    console.log("Listening on port 8010")
})








//MiddleWares:
async function verifyToken(req,res,next) {
    try {
        const {key} = req.body
        const decodedUID = jwt.verify(key, "secretKey")
        const foundUser = await User.findOne({uid:decodedUID})
        if(foundUser == null){
            res.json("error")
        } else {
            req.decodedUID = decodedUID
            next()
        }
    } catch(e){
        res.json("error")
    }
    
}

//Functions:

async function preparePosts(posts, meuid, userUID){
    const preparedArray = []
    const userData = await subGetUserData(userUID)
    for(let post of posts){
        if(post.postType == "saySomething"){
            const prepSaySomething = subPrepareSaySomething(post, meuid,userData)
            preparedArray.push(prepSaySomething)
        } 
        else if (post.postType == "announcement") {
            const prepAnnouncement = subPrepareAnnouncement(post,meuid,userData)
            preparedArray.push(prepAnnouncement)
        }
        else if (post.postType == "share") {
            const prepShare = await subPrepareShareRaye(post, meuid, userData)
            preparedArray.push(prepShare)
        }
    }
    
    // await Promise.all(unresolved) //means first fullfill all promises(since .map kai through kafi promises aa sakttay cuz its 'array', and then only proceed)
    //.map isnt promise(async) aware, doesnt stop for await. Use for loop which is async aware

    return preparedArray;
}

function subPrepareSaySomething(post, uid, userData){
    const likes = post.likesUID
    const index = likes.indexOf(uid)
    const totalLikes = likes.length
    const comments = post.comments
    const totalComments = comments.length
    let prepedSaySomethingPost;
    const creationMessage =  getCreationTimeMessage(post._doc.createdAt)
    if(index > -1){
        prepedSaySomethingPost = { ...post._doc, likedByMe : true, totalLikes : totalLikes, userData:userData, creationMessage:creationMessage, totalComments : totalComments}  //._doc ! (OR) use "post._doc.title" & "post._doc.announcement" for getting the title and announcement 
    } 
    else {
        prepedSaySomethingPost = { ...post._doc, likedByMe : false, totalLikes : totalLikes, userData:userData,creationMessage:creationMessage, totalComments : totalComments}
    }
    return prepedSaySomethingPost;
}

function subPrepareAnnouncement(post, uid, userData){
    const likes = post.likesUID
    const index = likes.indexOf(uid)
    const totalLikes = likes.length
    const comments = post.comments
    const totalComments = comments.length
    let prepedAnnouncementPost;
    const creationMessage =  getCreationTimeMessage(post._doc.createdAt)
    if(index > -1){
        prepedAnnouncementPost = {...post._doc, likedByMe:true, totalLikes:totalLikes, userData:userData,creationMessage:creationMessage,totalComments : totalComments}
    } 
    else {
        prepedAnnouncementPost = { ...post._doc, likedByMe:false, totalLikes:totalLikes, userData:userData,creationMessage:creationMessage,totalComments : totalComments }
    }
    return prepedAnnouncementPost;

}

async function subPrepareShareRaye(post, uid, userData){
    const uidOfUser = post._doc.uidOfUser
    const postID = post._doc.postID
    const postUserData = await subGetUserData(uidOfUser)
    let preparedShareRaye
    postDBCon.models = {}
    const Post = postDBCon.model(uidOfUser, saySomethingSchema)
    const shareRayePost = await Post.findOne({_id:postID})
    if(shareRayePost == null){
        preparedShareRaye = {
            userData : userData,
            postUserData : postUserData,
            code:"unavailable",
            postType: "share",
            postID : post._doc._id  //id of post, not of the post that was deleted. jo deleted uski to impossible na
        }
    } else {
        const likes = shareRayePost._doc.likesUID
        const index = likes.indexOf(uid)
        const totalLikes = likes.length
        const comments = shareRayePost._doc.comments
        const totalComments = comments.length
        const creationMessage =  getCreationTimeMessage(shareRayePost._doc.createdAt)
        if(index > -1){
            preparedShareRaye = {
                userData : userData,
                postUserData : postUserData,
                code:"available",
                postType : "share",
                sharedPostData : shareRayePost,
                likedByMe:true, 
                totalLikes:totalLikes,
                creationMessage:creationMessage,
                totalComments : totalComments,
                postID : post._doc._id
            }
        } else {
            preparedShareRaye = {
                userData : userData,
                postUserData : postUserData,
                code:"available",
                postType : "share",
                sharedPostData : shareRayePost,
                likedByMe:false, 
                totalLikes:totalLikes,
                creationMessage:creationMessage,
                totalComments : totalComments,
                postID : post._doc._id
            }
        }
    }
    return preparedShareRaye
}

async function subGetUserData(userUid){
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

function prepareUserFromRaw(array){
    const final = []
    for(i=0;i<array.length-1;i++){
        const obj = {
            uid : array[i].uid,
            avatar : array[i].avatar,
            userName : array[i].userName,
            userInsignia : array[i].userInsignia,
            standPoint : array[i].standPoint
        }
        final.push(obj)
    }
    return final
}







//Generate feed Functions 2.0:
async function generateFeed(){
    let ThePosts = []
    let users = await User.find()  //from general users
    users = users.map(x => x.uid)
    const usersLength = users.length
    for(i=0;i<usersLength;i++){
        const posts = await getPostsFromUserUid(users[i])
        for(i=0;i<posts.length;i++){
            ThePosts.push(posts[i])
        }       
    }
    return ThePosts;
}

async function getPostsFromUserUid(uid){   //0th khud karo
    try{
        let THE_POSTS = []
        postDBCon.models = {}
        const Post = postDBCon.model(uid, saySomethingSchema)
        const totalPosts = await Post.countDocuments()
        const allPosts = await Post.find().sort({createdAt : -1})
        if(totalPosts > 0){
            for(i=0;i<allPosts.length;i++){
                THE_POSTS.push({...allPosts[i]._doc,userUID:uid})
            }
        }
        return THE_POSTS
    }
    catch(e){
        console.log(e)
    }
        
}

function shuffle(array) {
    for(i=0;i<3;i++){
        let currentIndex = array.length,  randomIndex;
        while (currentIndex != 0) {
      
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex--;
    
          [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
        }
    }
  
    return array;
}

async function prepareFeed(posts, meuid){
    const preparedArray = []
    for(let post of posts){
        const userData = await subGetUserData(post.userUID)
        if(post.postType == "saySomething"){
            const prepSaySomething = subPrepareSaySomethingFeed(post, meuid,userData)
            preparedArray.push(prepSaySomething)
        } 
        else if (post.postType == "announcement") {
            const prepAnnouncement = subPrepareAnnouncementFeed(post,meuid,userData)
            preparedArray.push(prepAnnouncement)
        }
        else if (post.postType == "share") {
            const prepShare = await subPrepareShareRayeFeed(post, meuid, userData)
            preparedArray.push(prepShare)
        }
    }
    return preparedArray;
}

function subPrepareSaySomethingFeed(post, uid, userData){
    const likes = post.likesUID
    const index = likes.indexOf(uid)
    const totalLikes = likes.length
    const comments = post.comments
    const totalComments = comments.length
    let prepedSaySomethingPost;
    const creationMessage =  getCreationTimeMessage(post.createdAt)
    if(index > -1){
        prepedSaySomethingPost = { ...post, likedByMe : true, totalLikes : totalLikes, userData:userData, creationMessage:creationMessage, totalComments : totalComments}  //._doc ! (OR) use "post._doc.title" & "post._doc.announcement" for getting the title and announcement 
    } 
    else {
        prepedSaySomethingPost = { ...post, likedByMe : false, totalLikes : totalLikes, userData:userData,creationMessage:creationMessage, totalComments : totalComments}
    }
    return prepedSaySomethingPost;
}

function subPrepareAnnouncementFeed(post, uid, userData){
    const likes = post.likesUID
    const index = likes.indexOf(uid)
    const totalLikes = likes.length
    const comments = post.comments
    const totalComments = comments.length
    let prepedAnnouncementPost;
    const creationMessage =  getCreationTimeMessage(post.createdAt)
    if(index > -1){
        prepedAnnouncementPost = {...post, likedByMe:true, totalLikes:totalLikes, userData:userData,creationMessage:creationMessage,totalComments : totalComments}
    } 
    else {
        prepedAnnouncementPost = { ...post, likedByMe:false, totalLikes:totalLikes, userData:userData,creationMessage:creationMessage,totalComments : totalComments }
    }
    return prepedAnnouncementPost;

}

async function subPrepareShareRayeFeed(post, uid, userData){
    const uidOfUser = post.uidOfUser
    const postID = post.postID
    const postUserData = await subGetUserData(uidOfUser)
    let preparedShareRaye
    postDBCon.models = {}
    const Post = postDBCon.model(uidOfUser, saySomethingSchema)
    const shareRayePost = await Post.findOne({_id:postID})
    if(shareRayePost == null){
        preparedShareRaye = {
            userData : userData,
            postUserData : postUserData,
            code:"unavailable",
            postType: "share",
            postID : post._id  //id of post, not of the post that was deleted. jo deleted uski to impossible na
        }
    } else {
        const likes = shareRayePost.likesUID
        const index = likes.indexOf(uid)
        const totalLikes = likes.length
        const comments = shareRayePost.comments
        const totalComments = comments.length
        const creationMessage =  getCreationTimeMessage(shareRayePost.createdAt)
        if(index > -1){
            preparedShareRaye = {
                userData : userData,
                postUserData : postUserData,
                code:"available",
                postType : "share",
                sharedPostData : shareRayePost,
                likedByMe:true, 
                totalLikes:totalLikes,
                creationMessage:creationMessage,
                totalComments : totalComments,
                postID : post._id
            }
        } else {
            preparedShareRaye = {
                userData : userData,
                postUserData : postUserData,
                code:"available",
                postType : "share",
                sharedPostData : shareRayePost,
                likedByMe:false, 
                totalLikes:totalLikes,
                creationMessage:creationMessage,
                totalComments : totalComments,
                postID : post._id
            }
        }
    }
    return preparedShareRaye
}




//Generate Feed Functions:

// function generateNumber(min,max){  //generate between any 2 numbers
//     return Math.floor(Math.random() * (max -min) + 1) + min
// }

// async function generateMyFeed(req,res,next){
//     try{
//         const feed = await generateFeed(req.decodedUID)
//         res.json(feed)
//     }
//     catch(e){
//         console.log(e)
//     }
// }

// async function generateFeed(uid){
//     try{
//         supportingCon.models = {}
//         const Supporting = supportingCon.model(uid, SprtSchema)  //from supporting
//         const totalSupporting = await Supporting.countDocuments()
//         let userPosts = []
//         if(totalSupporting > 0){
//             let supporting = await Supporting.find()
//             supporting = supporting.map(x => x.uid)
//             const arrayLength = totalSupporting - 1
//             const numberOfSupportersToChoose = generateNumber(1,totalSupporting) // total Mai Sai is dafa kitnay supporting ki posts dikhani
//             for(i=0; i<numberOfSupportersToChoose; i++){
//                 const whichSupportingIndex = generateNumber(0,arrayLength) //konsa index/User
//                 userPosts = await getRandomPostsFromUserUid(supporting[whichSupportingIndex])   
//             }
//             if(Math.random()*10 >= 5 ){
//                 const post2 = await getRandomPostsFromUserUid(supporting[0])
//                 userPosts.push(post2)
//             }
             
//         }
//         let users = await User.find()  //from general users
//         users = users.map(x => x.uid)
//         const usersToSelect = generateNumber(1,users.length)
//         for(i=0;i<usersToSelect;i++){
//             const index = generateNumber(0,users.length-1)
//             const posts = getRandomPostsFromUserUid(users[index])
//             Promise.all([posts]).then(res => res.map(x => userPosts.push(x)))
            
//         }
//         if( Math.random()*10 >=5 ){
//             const post0 = getRandomPostsFromUserUid(users[0])
//             Promise.all([post0]).then(res => res.map(x => userPosts.push(x)))
//         }
//         return removeDuplication(userPosts)

//     }
//     catch(e){
//         console.log(e)
//     }
// }

// async function getRandomPostsFromUserUid(uid){   //0th khud karo
//     try{
//         let THE_POSTS = []
//         postDBCon.models = {}
//         const Post = postDBCon.model(uid, saySomethingSchema)
//         const totalPosts = await Post.countDocuments()
//         const allPosts = await Post.find().sort({createdAt : -1})
//         if(totalPosts > 0){
//             const postsToSelect = generateNumber(1,totalPosts) //kitni posts select karni
//             for(i=0;i<postsToSelect;i++){
//                 const whichPostIndex = generateNumber(0,totalPosts-1)   //konsi Post
//                 THE_POSTS.push({...allPosts[whichPostIndex]._doc,userUID:uid})
//             }
//             if( (Math.random()*10) > 5){   //0th index occurs less frequntly, heres a random check
//                 THE_POSTS.push({...allPosts[0]._doc,userUID:uid})
//             }
//             return THE_POSTS
//         }
//     }
//     catch(e){
//         console.log(e)
//     }
    
// }

// function removeDuplication(ar){
//     let uniqueArray = []
//     for(i=0;i<ar.length-1;i++){
//         const index = uniqueArray.indexOf(ar[i])
//         if(index == -1){
//             uniqueArray.push(ar[i])
//         }
//     }
//     return uniqueArray
// }

// async function prepareFeed(feed){
//     for(let post of feed){
//         if(post.postType == "saySomething"){
//             const prepSaySomething = subPrepareSaySomething(post, meuid,userData)
//             preparedArray.push(prepSaySomething)
//         } 
//         else if (post.postType == "announcement") {
//             const prepAnnouncement = subPrepareAnnouncement(post,meuid,userData)
//             preparedArray.push(prepAnnouncement)
//         }
//         else if (post.postType == "share") {
//             const prepShare = await subPrepareShareRaye(post, meuid, userData)
//             preparedArray.push(prepShare)
//         }
//     }
// }
