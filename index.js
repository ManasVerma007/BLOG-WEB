const express =require("express")
const path= require("path")
const app= express()
const userRoute = require("./routes/user");
const blogRoute = require("./routes/blog");
const mongoose = require("mongoose");

const Blog = require("./models/blog");
const cookieParser = require("cookie-parser");
const {
    checkForAuthenticationCookie,
  } = require("./middlewares/authentication");

const PORT=8000

mongoose
.connect("mongodb://127.0.0.1:27017/blog-app")
.then((e)=>{
    console.log("Mongodb Connected")
})

app.set("view engine", "ejs")
app.set("views", path.resolve("./views")) 
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
app.use(express.static(path.resolve("./public")));

app.get("/", async (req, res) => {
  const allBlogs = await Blog.find({});
  res.render("home", {
    user: req.user,
    blogs: allBlogs,
  });
});

app.use(express.urlencoded({ extended: false }));
app.use("/user", userRoute);
app.use("/blog", blogRoute);
app.listen(PORT, ()=> console.log(`server has started at PORT ${PORT}`)) 