const { Router } = require("express");
const multer = require("multer");
const path = require("path");

const Blog = require("../models/blog");
const Comment = require("../models/comment");

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

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

// upload.single("coverImage") -- middleware 

router.post("/", upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;
  const blog = await Blog.create({
    body,
    title,
    createdBy: req.user._id,
    coverImageURL: `/uploads/${req.file.filename}`,
  });
  return res.redirect(`/blog/x/${blog._id}`);
});

router.get("/:id/edit", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  return res.render("editBlog", {
    user: req.user,
    blog,
  });
});


router.post("/:id/edit", upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;
  const updatedFields = {
    title,
    body,
  };

  if (req.file) {
    updatedFields.coverImageURL = `/uploads/${req.file.filename}`;
  }

  await Blog.findByIdAndUpdate(req.params.id, updatedFields);
  return res.redirect(`/blog/x/${req.params.id}`);
});


router.get("/myblogs/one", async (req, res) => {
  try {
    const userBlogs = await Blog.find({ createdBy: req.user._id }).populate("createdBy");
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
