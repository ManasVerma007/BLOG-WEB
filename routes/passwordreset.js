const router = require("express").Router();
const User = require("../models/user");
const Token = require("../models/token");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const Joi = require("joi");
const { createHmac, randomBytes } = require("crypto");
const passwordComplexity = require("joi-password-complexity");
const bcrypt = require("bcrypt");

// send password link
router.post("/", async (req, res) => {
	try {
		const { email} = req.body;
		console.log(req.body);
		const user = await User.findOne({ email });
		console.log(user);
		if (!user)
			return res
				.status(409)
				.send({ message: "User with given email does not exist!" });

		let token = await Token.findOne({ userId: user._id });
		if (!token) {
			token = await new Token({
				userId: user._id,
				token: crypto.randomBytes(32).toString("hex"),
			}).save();
		}

		const url = `${process.env.BASE_URL}password-reset/pass/${user._id}/${token.token}/`;
		await sendEmail(user.email, "Password Reset", url);
		res
			.status(200)
			.send({ message: "Password reset link sent to your email account" });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
});

// verify password reset link
router.get("/:id/:token", async (req, res) => {
	try {
		const user = await User.findOne({ _id: req.params.id });
		if (!user) return res.status(400).send({ message: "Invalid link" });

		const token = await Token.findOne({
			userId: user._id,
			token: req.params.token,
		});
		if (!token) return res.status(400).send({ message: "Invalid link" });
		//render reset password page
		return res.status(200).render("resetpassword", { id: req.params.id, token: req.params.token });		// res.status(200).send("Valid Url");
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
});

//  set new password
router.post("/:id/:token", async (req, res) => {
	try {
	  const { password } = req.body;
	  console.log(req.body);
	  const user = await User.findOne({ _id: req.params.id });
	  console.log(user);
	  if (!user) return res.status(400).send({ message: "Invalid link" });
  
	  const token = await Token.findOne({
		userId: user._id,
		token: req.params.token,
	  });
	  if (!token) return res.status(400).send({ message: "Invalid link" });
  
	  if (!user.verified) user.verified = true;
  
	  const salt = randomBytes(16).toString();
  
	  const hash = createHmac("sha256", salt);
	  hash.update(password);
	  const hashPassword = hash.digest('hex');
	  console.log(hashPassword);
	  await user.updateOne({ password: hashPassword,salt: salt });

	  await Token.deleteOne({ userId: req.params.id });
  
	  //redirect to sign in page
	  return res.redirect(`/user/signin/`);
	} catch (error) {
	  console.log(error);
	  res.status(500).send({ message: "Internal Server Error" });
	}
  });

module.exports = router;
