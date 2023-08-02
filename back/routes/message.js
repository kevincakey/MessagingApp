const express = require("express");
const router = express.Router();
const Message = require("../model/messages");

// Create a new message
router.post("/create", async (req, res) => {
  try {
    const { text, sender, room, name } = req.body;
    const message = new Message({ text, sender, room, name });
    await message.save();
    res.json({ message: "Message created successfully", message });
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Get messages by room
router.get("/room/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    //console.log(roomId);
    const messages = await Message.find({ room: roomId });
    //console.log(messages);
    res.json({ messages });
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Get messages by sender
router.get("/sender/:senderId", async (req, res) => {
  try {
    const { senderId } = req.params;
    const messages = await Message.find({ sender: senderId });
    res.json({ messages });
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).send("Internal Server Error");
  }
});

// TODO: Add other necessary routes for updating or deleting messages

module.exports = router;
