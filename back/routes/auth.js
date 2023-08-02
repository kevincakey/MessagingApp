const express = require("express");
const User = require("../model/user");
const router = express.Router();

module.exports = router;

router.post("/login", async (req, res) => {
  const { session } = req;
  const { username, password } = req.body;

  // check if user in database
  const user = await User.findOne({ username });

  if (!user) return res.json({ msg: "Incorrect Username ", status: false });
  else if (user.password !== password)
    return res.json({ msg: "Incorrect Password", status: false });
  else {
    session.authenticated = true;
    session.username = username;
    res.json({ msg: "Logged in", status: true, username, user });
    //console.log("logged in");
  }
});

// Set up a route for the logout page
router.post("/logout", (req, res) => {
  // Clear the session data and redirect to the home page
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      res.status(500).send("Error occurred during logout");
    } else {
      res.status(200).send("Logged out");
      console.log("Logged out");
    }
  });
});

//maybe have a register function? fix
//dont know if this is right
router.post("/register", async (req, res) => {
  const { session } = req;
  const { username, password, name } = req.body;

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.json({ msg: "Username already exists", status: false });
  }

  const user = new User({ username, password, name });
  // user.$isNew;
  await user.save();

  session.authenticated = true;
  session.username = username;
  res.json({ msg: "Registered", status: true });
  console.log("registered");
});
