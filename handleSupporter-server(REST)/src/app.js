const express = require("express")
const app = express()
const SprtSchema = require("./db/supportSchema")
const UsrSchema = require("./db/userSchema")
const mongoose = require("mongoose")

var supporterCon = mongoose.createConnection("mongodb://127.0.0.1:27017/supporter")
var supportingCon = mongoose.createConnection("mongodb://127.0.0.1:27017/supporting")
var userCon = mongoose.createConnection("mongodb://127.0.0.1:27017/userDB")

app.use(express.json())

app.post("/support", async (req,res)=>{
    try {

        const {isfollowingUID, gettingfollowedUID } = req.body
       
        //aik user kai supporter kitnay. Yahan user kai supporter store honay 
        const Supporter = supporterCon.model(gettingfollowedUID,SprtSchema)
        const supporterData = {
            uid : isfollowingUID,
        }
        const sup = new Supporter(supporterData)
        await sup.save()
        //aik user kitnay logon ko support kar raha. Yahan user ki supporting list save hoti
        const Supporting = supportingCon.model(isfollowingUID, SprtSchema)
        const supportingData = {
            uid : gettingfollowedUID
        }
        const supIng = new Supporting(supportingData)
        await supIng.save()
        res.json({code:1})
    } catch (e) {
        console.log(e)
        res.json({code:0})
    }

}) 

app.post("/desupport", async (req,res)=>{
    try{
        //desupport = who to desupport (kis ka supporter kam karna)
        //desupporting = who is desupporting (kis ki supporting kam karni)
        const {desupportUID, desupportingUID} = req.body
        const Supporter = supporterCon.model(desupportUID,SprtSchema)
        await Supporter.deleteOne({uid:desupportingUID})

        const Supporting = supportingCon.model(desupportingUID, SprtSchema)
        await Supporting.deleteOne({uid:desupportUID})
        res.json({code:1})
    } catch(e){
        console.log(e)
        res.json({code:0})
    }
})

app.get("/getSupporters/:uid", async (req,res) => {
    try{
        const uid = req.params.uid
        const Supporter = supporterCon.model(uid,SprtSchema)
        const User = userCon.model("UserList", UsrSchema)
        const supportersList = await Supporter.find()
        let uids = []
        supportersList.map(x => {
            uids.push(x.uid)
        })
        let supportersData = await User.find({'uid':{$in : uids}})
        const sendingArray = []
        supportersData.map(x => {
            const data = {
                uid : x.uid,
                avatar : x.avatar,
                userName : x.userName,
                insignia : x.userInsignia,
                standPoint : x.standPoint
            }
            sendingArray.push(data)
        })
        res.json(sendingArray)

    }catch (e) {
        console.log(e);
    }
})
app.get("/getSupporting/:uid", async (req,res) => {
    try{
        const uid = req.params.uid
        const Supporting = supportingCon.model(uid, SprtSchema)
        const User = userCon.model("UserList", UsrSchema)
        const supportingList = await Supporting.find()
        let uids = []
        supportingList.map(x => {
            uids.push(x.uid)
        })
        let supportingData = await User.find({'uid':{$in : uids}})
        const sendingArray = []
        supportingData.map(x => {
            const data = {
                uid : x.uid,
                avatar : x.avatar,
                userName : x.userName,
                insignia : x.userInsignia,
                standPoint : x.standPoint
            }
            sendingArray.push(data)
        })
        res.json(sendingArray)

    }catch (e) {
        console.log(e);
    }
})



// app.get("/getSupport/:uid/:uidUser", async (req,res)=> {
//     try{
//         const uid = req.params.uid
//         const uidUser = req.params.uidUser
//         const Supporter = supporterCon.model(uid,SprtSchema)
//         const Supporting = supportingCon.model(uid, SprtSchema)
//         const supportersNumber = await Supporter.countDocuments()
//         const supportingNumber = await Supporting.countDocuments()
//         const followingUser = await Supporter.countDocuments({uid : uidUser})
//         const data = {
//             supportersNumber : supportersNumber,
//             supportingNumber : supportingNumber,
//             following : followingUser

//         }
//         res.json(data);
//     }catch(e){
//         console.log(e)
//     }
// })


app.listen(8004, ()=>{
    console.log("Listening on port 8004")
})