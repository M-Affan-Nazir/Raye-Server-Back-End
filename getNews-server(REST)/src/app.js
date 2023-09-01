const express = require("express");
const fetch = require('node-fetch');
const app = express()

let news = []
let nextUpdateTime = 0;

const newsApi = "https://newsapi.org/v2/top-headlines?sources=engadget,wired,business-insider,bbc-news,cnn,&language=en&apiKey=d4d0a792d5814488afdf8e0f01d229b3"
const gnews1 =  "https://gnews.io/api/v4/top-headlines?&q=pakistan&token=adee1a8f266d2abc2f9926fe185a0137"
const gnews2 =  "https://gnews.io/api/v4/top-headlines?topic=world&lang=en&token=adee1a8f266d2abc2f9926fe185a0137"
 
const updateTime = () => {
    //console.log("Updating Next Time")
    nextUpdateTime = Date.now() + 18000000
}

const newsFetch = async() => {
    news = []
    const fetch1 = await fetch(gnews1)
    const gnDataraw1 = await fetch1.json()
    const gnData1 = gnDataraw1.articles
   // gnData1?.map(x=>{
   if(gnData1){
       gnData1.map(x=>{
              news.push({
                title:x.title,
                description:x.description,
                url:x.url,
                image:x.image,
            })
        })
   }
    
    const fetch2 = await fetch(gnews2)
    const gnDataraw2 = await fetch2.json()
    const gnData2 = gnDataraw2.articles
    //gnData2?.map(x=>{
    if(gnData2){
        gnData2.map(x=>{
              news.push({
                title:x.title,
                description:x.description,
                url:x.url,
                image:x.image
            })
        })
    }
    
    const fetch3 = await fetch(newsApi)
    const newsApiRaw = await fetch3.json()
    const newsApiData = newsApiRaw.articles
    //newsApiData?.map(x=>{
    if(newsApiData){
        newsApiData.map(x=>{
            news.push({
                title:x.title,
                description:x.description,
                url:x.url,
                image:x.urlToImage
            })
        }) 
    }
}

app.get("/getNews", async (req,res) => {
    if(Date.now() >= nextUpdateTime){
        updateTime()
        await newsFetch()
        res.send(news)
    }
    else {
        //console.log("Sending already present")
        res.send(news)
    }
})

app.listen(8003, ()=> {
    console.log("Listening on port 8003")
})
