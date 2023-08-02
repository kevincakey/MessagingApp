const express = require("express");
const multer = require("multer");
const router = express.Router();
const Room = require("../model/room");
// TODO: add rest of the necassary imports
const User = require("../model/user");
const Message = require("../model/messages");

module.exports = router;

// Set up Multer for handling file uploads
const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: function (req, file, cb) {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage });

router.get("/all", async (req, res) => {
  //console.log("in all");
  try {
    const { username } = req.query;

    // TODO: Retrieve the rooms associated with the specified user from the database
    const user = await User.findOne({ username });

    if (!user) {
      // User not found
      return res.status(404).json({ error: "User not found" });
    }

    // Retrieve the rooms based on the user's room IDs
    const rooms = await Room.find({ _id: { $in: user.rooms } });

    res.json(rooms);
  } catch (error) {
    console.error("Error retrieving rooms:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/create", async (req, res) => {
  // TODO: write necassary codesn to Create a new room
  const { session } = req;
  const { name } = req.body;
  const username = req.body.userName;

  const existingRooms = await Room.find({ name });
  if (existingRooms.length > 0) {
    return res
      .status(409)
      .json({ error: "Room with the same name already exists" });
  }

  const room = new Room({ name });
  await room.save();
  //start adding to user
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  user.rooms.push(room);
  await user.save();

  //end adding to user
  session.authenticated = true;
  res.json({ msg: "roomAdded", status: true, room });
});

router.get("/:name", async (req, res) => {
  try {
    const roomName = req.params.name;

    // TODO: Retrieve the room from the database based on the name
    const room = await Room.findOne({ name: roomName });

    if (room) {
      res.send(room);
    } else {
      res.status(404).send("Room not found");
    }
  } catch (error) {
    console.error("Error retrieving room:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/join", async (req, res) => {
  try {
    const roomName = req.body.roomToJoin;
    const { username } = req.session;

    // TODO: Retrieve the user from the database
    const user = await User.findOne({ username });

    if (!user) {
      // User not found
      return res.status(404).json({ error: "User not found" });
    }

    // TODO: Check if the user is already in the specified room
    if (user.rooms.includes(roomName)) {
      return res.status(400).json({ error: "User is already in the room" });
    }

    const unorderedRoom = await Room.findOne({ name: roomName });
    if (!unorderedRoom) {
      // Room not found
      return res.status(404).json({ error: "Room not found" });
    }

    const { _id, name, createdAt, updatedAt } = unorderedRoom;
    const __v = 0;
    const room = { _id, name, createdAt, updatedAt, __v };
    // TODO: Add the room to the user's rooms array
    user.rooms.push(room);
    await user.save();

    res.json({ msg: "Room joined successfully", status: true, room });
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/leave", async (req, res) => {
  // TODO: write necassary codes to delete a room
  try {
    const roomName = req.body.roomToLeave;
    const { username } = req.session;

    // TODO: Retrieve the user from the database
    const user = await User.findOne({ username });

    if (!user) {
      // User not found
      return res.status(404).json({ error: "User not found" });
    }

    // TODO: Check if the user is already in the specified room

    const unorderedRoom = await Room.findOne({ name: roomName });
    if (!unorderedRoom) {
      // Room not found
      return res.status(404).json({ error: "Room not found" });
    }

    const { _id, name, createdAt, updatedAt } = unorderedRoom;
    const __v = 0;
    const room = { name, _id, createdAt, updatedAt, __v };

    user.rooms = user.rooms.filter((room) => room.name !== roomName);
    await user.save();

    res.json({ msg: "Room left successfully", status: true, room });
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update username endpoint
router.post("/updateName", async (req, res) => {
  try {
    const { user, newName } = req.body;
    const id = user._id;

    const updatedName = await User.findByIdAndUpdate(
      id,
      { name: newName },
      { new: true }
    );

    await Message.updateMany({ sender: id }, { name: newName });
    res.status(200).json(updatedName);
  } catch (error) {
    console.log(error);
  }
});
