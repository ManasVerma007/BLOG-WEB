const { Router } = require("express");
// const multer = require("multer");
const path = require("path");
const Blog = require("../models/blog");
const Comment = require("../models/comment");
// const sharp = require("sharp");
// const fs = require("fs");
const router = Router();

require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const fileupload = require("express-fileupload");
router.use(
  fileupload({
    useTempFiles: true,
  })
);
// cloudinary.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.API_KEY,
//   api_secret: process.env.API_SECRET
// });
cloudinary.config({
  cloud_name: "dnbjbsbzs",
  api_key: "234235216497426",
  api_secret: "PrPzz58Dioikd8hjxi8Xla-3JLA",
});
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.resolve(`./public/uploads/`));
//   },
//   filename: function (req, file, cb) {
//     const fileName = `${Date.now()}-${file.originalname}`;
//     cb(null, fileName);
//   },
// });

// const upload = multer({ storage: storage });

router.get("/add-new", (req, res) => {
  return res.render("addBlog", {
    user: req.user,
  });
});

router.get("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  const comments = await Comment.find({ blogId: req.params.id }).populate(
    "createdBy"
  );
  return res.render("blog", {
    user: req.user,
    blog,
    comments,
  });
});

router.post("/comment/:blogId", async (req, res) => {
  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });
  return res.redirect(`/blog/x/${req.params.blogId}`);
});

router.post("/", async (req, res) => {
  try {
    const { title, body } = req.body;
    const file = req.files ? req.files.photo : null;
    let imgUrl = ""; // Initialize imgUrl to an empty string
    let item;

    if (file) {
      console.log(file);
      // const resizedImagePath = file.tempFilePath + "_resized.jpg";
      // await sharp(file.tempFilePath)
      //   .resize(1024, 1024, { withoutEnlargement: true })
      //   .toFile(resizedImagePath);
      // File was uploaded, so handle it
      cloudinary.uploader.upload(
        file.tempFilePath,
        async (err, result) => {
          if (err) {
            // Handle upload error
            console.error(err);
            return res.status(500).send("Error uploading file to Cloudinary");
          }

          // If the upload is successful
          console.log(result);
          imgUrl = result.url; // Set imgUrl to the uploaded image URL
          const obj = {
            coverImageURL: imgUrl,
            title: title,
            body: body,
            createdBy: req.user._id,
          };

          console.log("object us", obj);
          item = await Blog.create(obj);
          res.redirect(`/blog/x/${item._id}`);
        }
      );
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

router.post("/:id/edit", async (req, res) => {
  try {
    const { title, body, removeImage } = req.body;
    let imageremovebool = false;
    //check if the removeImage is a array
    if (removeImage instanceof Array) {
      imageremovebool = removeImage[1];
      //delete image from cloudinary
    }
    const file = req.files ? req.files.photo : null;
    let imgUrl = "";

    if (file) {
      const result = await cloudinary.uploader.upload(file.tempFilePath);
      imgUrl = result.url;
    }
    const blog = await Blog.findById(req.params.id);
    if (imageremovebool) {
      imgUrl = "";
      await cloudinary.uploader.destroy(blog.coverImageURL);
    } else if (imgUrl === "") {
      imgUrl = blog.coverImageURL;
    }
    const updatedFields = {
      title,
      body,
      coverImageURL: imgUrl,
    };

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updatedFields,
      { new: true }
    );
    res.redirect(`/blog/x/${updatedBlog._id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while updating the blog post");
  }
});
router.get("/:id/edit", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  return res.render("editBlog", {
    user: req.user,
    blog,
  });
});

// create an api to delete the blog
router.post("/delete/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (blog.coverImageURL) {
      await cloudinary.uploader.destroy(blog.coverImageURL);
    }
    await Blog.findByIdAndDelete(req.params.id);
    return res.redirect("/blog/x/myblogs/one");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});

// router.post("/:id/edit", upload.single("coverImage"), async (req, res) => {
//   const { title, body } = req.body;
//   const updatedFields = {
//     title,
//     body,
//   };

//   if (req.file) {
//     updatedFields.coverImageURL = `/uploads/${req.file.filename}`;
//   }

//   await Blog.findByIdAndUpdate(req.params.id, updatedFields);
//   return res.redirect(`/blog/x/${req.params.id}`);
// });

router.get("/myblogs/one", async (req, res) => {
  try {
    const userBlogs = await Blog.find({ createdBy: req.user._id }).populate(
      "createdBy"
    );
    return res.render("myBlogs", {
      user: req.user,
      blogs: userBlogs,
    });
  } catch (error) {
    console.error("Error fetching user's blogs:", error);
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
