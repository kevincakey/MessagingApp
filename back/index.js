const express = require("express");
const socketIO = require("socket.io");
const http = require("http");
const cors = require("cors");
const session = require("express-session");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const auth = require("./routes/auth");
const rooms = require("./routes/rooms");
const message = require("./routes/message");

const app = express();
const server = http.createServer(app);

// TODO: add cors to allow cross origin requests
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

dotenv.config();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connect to the database
// TODO: your code here
mongoose.connect(process.env.MONGO_URL); // fix change to own URL?
const database = mongoose.connection;

database.on("error", (error) => console.error(error));
database.once("open", () => console.log("Connected to Database"));

const Messages = require("./model/messages");
// Set up the session
// TODO: your code here
const sessionMiddleware = session({
  resave: false, //Whether to save session to the store on every request
  saveUninitialized: false, //Whether to save uninitialized sessions to the store
  secret: process.env.SESSION_SECRET,
});

app.use(sessionMiddleware);

app.get("/", (req, res) => {
  if (req.session && req.session.authenticated) {
    res.json({ message: "logged in" });
  } else {
    console.log("not logged in");
    res.json({ message: "not logged" });
  }
});

app.use("/api/auth/", auth);

// checking the session before accessing the rooms
app.use((req, res, next) => {
  if (req.session && req.session.authenticated) {
    next();
  } else {
    //next();
    res.status(401).send("Unauthorized");
  }
});
app.use("/api/rooms/", rooms);

app.use((req, res, next) => {
  if (req.session && req.session.authenticated) {
    next();
  } else {
    //next();
    res.status(401).send("Unauthorized");
  }
});
app.use("/api/message/", message);

// app.use((req, res, next) => {
//   if (req.session && req.session.authenticated) {
//     next();
//   } else {
//     //next();
//     res.status(401).send("Unauthorized");
//   }
// });
// app.use("/api/profile/", profile);

// Start the server
server.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});

// TODO: make sure that the user is logged in before connecting to the socket
// TODO: your code here
io.use((socket, next) => {
  console.log("socket io middleware");
  sessionMiddleware(socket.request, {}, next);
});

io.use((socket, next) => {
  if (socket.request.session && socket.request.session.authenticated) {
    next();
  } else {
    console.log("unauthorized");
    next(new Error("unauthorized"));
  }
});

io.on("connection", (socket) => {
  console.log("user connected");
  io.emit("welcome", "welcome to the chatroom");
  // TODO: write codes for the messaging functionality
  // TODO: your code here
  console.log("user connected");

  // socket.on('disconnect', () => {
  //   io.emit('message','user disconnected');
  // });
  socket.on("join_room", (data) => {
    const { username, room } = data;
    console.log(`${username} has joined room ${room}`);
    socket.join(room);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("editMessage", async (message) => {
    try {
      const { messageId, editedMessage, editedReactions } = message;

      // Update the message in MongoDB
      const updatedMessage = await Messages.findByIdAndUpdate(
        messageId,
        { message: { text: editedMessage }, reactions: editedReactions },
        { new: true }
      );
      console.log(updatedMessage);
      // Emit the updated message to all clients in the room
      console.log(updatedMessage.room);
      io.emit("messageUpdated", updatedMessage);
    } catch (error) {
      console.error("Error updating message:", error);
    }
  });

  socket.on("newMessage", async (message) => {
    try {
      const newMessage = new Messages({
        message: message,
        sender: message.sender,
        room: message.room,
        name: message.name,
        reactions: message.reactions,
      });

      console.log("message received:", message);
      console.log("Message:", newMessage);
      // console.log('Message text:', message.text);
      await newMessage.save();
      // Emit the message to all clients in the room
      io.emit("message", message, newMessage._id);
    } catch (error) {
      console.error("Error storing message:", error);
    }
  });
});
