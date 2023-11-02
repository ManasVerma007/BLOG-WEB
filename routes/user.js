const { Router } = require("express");
const User = require("../models/user");
const Token = require("../models/token");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const router = Router();

// Render the signin form
router.get("/signin", (req, res) => {
  return res.status(200).render("signin");
});

// Render the signup form
router.get("/signup", (req, res) => {
  return res.status(200).render("signup");
});

// Handle user sign-in
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Attempt to match email and password, and generate a token if successful
    const token = await User.matchPasswordAndGenerateToken(email, password);
    const user = await User.findOne({ email });
    if (!user.verified) {
			let token = await Token.findOne({ userId: user._id });
			if (!token) {
				token = await new Token({
					userId: user._id,
					token: crypto.randomBytes(32).toString("hex"),
				}).save();
				const url = `${process.env.BASE_URL}user/${user.id}/verify/${token.token}`;
				await sendEmail(user.email, "Verify Email", url);
			}

			return res
				.status(400)
				.send({ message: "An Email sent to your account please verify" });
		}

    // Set a cookie with the generated token and redirect to a protected route
    return res.status(200).cookie("token", token).redirect("/blog/x/myblogs/one");
  } catch (error) {
    // Handle errors by rendering the signin form with an error message and a 400 Bad Request status
    return res.status(400).render("signin", {
      error: "Incorrect Email or Password",
    });
  }
});

// Handle user logout
router.get("/logout", (req, res) => {
  // Clear the token cookie and redirect to the homepage with a 302 Found status
  res.clearCookie("token").redirect("/");
});

// Handle user signup
router.post("/signup", async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    // Check if a user with the provided email already exists
    var user = await User.findOne({ email });

    if (user) {
      // If user already exists, render the signup form with an error message and a 400 Bad Request status
      return res.status(400).render("signup", {
        error: "Email already exists",
      });
    } else {
      // Create a new user with the provided details and redirect to the homepage with a 302 Found status
      await User.create({
        fullname,
        email,
        password,
      });
      user = await User.findOne({ email });
      const token = await new Token({
        userId: user._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();

      const url = `${process.env.BASE_URL}user/${user.id}/verify/${token.token}`;
      await sendEmail(user.email, "Verify Email", url);
      res
        .status(201)
        .send({ message: "An email has been sent to your account; please verify it." });
    }
  } catch (error) {
    // Handle the error
    console.error(error);
    res.status(500).send({ error: 'An error occurred during signup.' });
  }
});

// create a simple get route to render the verify email page
router.get("/:id/verify/:token", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) return res.status(400).send({ message: "Invalid link" });
    const token1 = await Token.findOne({userId: req.params.id});
    console.log(req.params.token)
    console.log(token1)
    if (!token1) return res.status(400).send({ message: "Invalid link" });

    await User.updateOne({ _id: user._id }, { verified: true });
    await Token.deleteOne({ userId: req.params.id });
    //render th e verify email page
    return res.status(200).render("verifyemail");
    // res.status(200).send("Your account has been verified");
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;
