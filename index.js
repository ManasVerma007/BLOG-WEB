require("dotenv").config();
const express =require("express")
const path= require("path")
const app= express()
const userRoute = require("./routes/user");
const blogRoute = require("./routes/blog");
const mongoose = require("mongoose");
const passwordResetRoutes = require("./routes/passwordreset");
const Blog = require("./models/blog");
const cookieParser = require("cookie-parser");
const fileupload=require('express-fileupload');
const methodOverride = require('method-override');


const {
    checkForAuthenticationCookie,
  } = require("./middlewares/authentication");

  const PORT = process.env.PORT || 8000;


mongoose
.connect(process.env.MONGODB)
.then((e)=>{
    console.log("Mongodb Connected")
})
// app.use(fileupload({
//   useTempFiles:true
// }));
app.set("view engine", "ejs")
app.set("views", path.resolve("./views")) 
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
app.use(express.static(path.resolve("./public")));
app.use(methodOverride('_method'));

app.get("/", async (req, res) => {
  const allBlogs = await Blog.find({});
  res.render("home", {
    user: req.user,
    blogs: allBlogs,
  });
});

app.use(express.urlencoded({ extended: false }));
app.use("/user", userRoute);
app.use("/blog/x", blogRoute);
app.use("/password-reset", passwordResetRoutes);
app.listen(PORT, ()=> console.log(`server has started at PORT ${PORT}`)) 