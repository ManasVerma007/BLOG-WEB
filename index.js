const express =require("express")
const path= require("path")
const app= express()
const userRoute = require("./routes/user");
const mongoose = require("mongoose");

const PORT=8000

mongoose
.connect("mongodb://127.0.0.1:27017/blog-app")
.then((e)=>{
    console.log("Mongodb Connected")
})

app.set("view engine", "ejs")
app.set("views", path.resolve("./views")) 

app.get("/", (req,res)=>{
    res.render("home")
})

app.use(express.urlencoded({ extended: false }));
app.use("/user", userRoute);
app.listen(PORT, ()=> console.log(`server has started at PORT ${PORT}`)) 