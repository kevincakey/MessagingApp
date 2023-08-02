import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Button } from "@mui/material";
import emoji from "emoji-dictionary";

import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";

import "./Chatroom.css";
import { blue, red } from "@mui/material/colors";

class Chatroom extends React.Component {
  constructor(props) {
    super(props);
    this.socket = io("http://localhost:3001", {
      cors: {
        origin: "http://localhost:3001",
        credentials: true,
      },
      transports: ["websocket"],
    });
    this.state = {
      chats: [],
      newMessage: "",
      room: null,
      editingMessage: "",
      editingIndex: -1,
    };
  }

  componentDidMount() {
    const { user } = this.props;
    // console.log(user);
    this.fetchRoom()
      .then(() => {
        return this.fetchMessages();
      })
      .then(() => {
        // console.log(this.state.chats);

        this.socket.on("message", this.handleNewMessage);
        this.socket.on("messageUpdated", this.handleMessageUpdated);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  fetchRoom() {
    return new Promise((resolve, reject) => {
      const { roomName } = this.props;

      fetch(`${this.props.server_url}/api/rooms/${roomName}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (response.status === 401) {
            throw new Error("Unauthorized");
          }
          return response.json();
        })
        .then((data) => {
          if (data) {
            this.setState({ room: data }, () => {
              // console.log(data);
              // console.log(this.state.room);
              resolve();
            });
          } else {
            console.error("Room not found");
            reject("Room not found");
          }
        })
        .catch((error) => {
          console.error("Error fetching room:", error);
          reject(error);
        });
    });
  }

  fetchMessages() {
    return new Promise((resolve, reject) => {
      const { room } = this.state;
      //console.log(room);

      if (room) {
        fetch(`${this.props.server_url}/api/message/room/${room._id}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((response) => {
            if (response.status === 401) {
              throw new Error("Unauthorized");
            }
            return response.json();
          })
          .then((data) => {
            //console.log(data);
            this.setState({ chats: data.messages }, () => {
              resolve();
            });
          })
          .catch((error) => {
            console.error("Error fetching messages:", error);
            reject(error);
          });
      } else {
        resolve();
      }
    });
  }

  handleChange = (event) => {
    this.setState({ newMessage: event.target.value });
  };

  handleSubmit = (event) => {
    event.preventDefault();
    const { newMessage, chats, room } = this.state;
    const { username, user } = this.props;

    if (newMessage.trim() !== "") {
      const message = {
        text: newMessage,
        sender: user,
        name: user.name,
        room: room._id,
        reactions: {
          thumbsUp: 0,
          thumbsDown: 0,
        },
      };

      //console.log(message);
      // Emit the newMessage event to the server
      this.socket.emit("newMessage", message);

      // Clear the input field after sending the message
      this.setState({ newMessage: "" });
    }
  };

  handleNewMessage = (message, messageId) => {
    const tempMessage = {
      _id: messageId,
      message: {
        text: message.text,
      },
      room: message.room,
      sender: message.sender._id,
      name: message.name,
      reactions: message.reactions,
    };

    if (tempMessage.room !== this.state.room._id) return;
    // console.log(tempMessage);
    const { chats } = this.state;
    const updatedChats = [...chats, tempMessage];
    this.setState({ chats: updatedChats });
    // console.log(this.state.chats);
  };

  handleMessageUpdated = (updatedMessage) => {
    const { chats } = this.state;
    const updatedChats = chats.map((chat) => {
      if (chat._id === updatedMessage._id) {
        //console.log(updatedMessage._id);
        return {
          ...chat,
          message: {
            ...chat.message,
            text: updatedMessage.message.text,
          },
          reactions: updatedMessage.reactions,
        };
      }
      return chat;
    });
    this.setState({ chats: updatedChats });
  };

  handleLeave = () => {
    this.props.changeScreen("lobby");
  };

  handleEdit = (index) => {
    this.setState({ editingMessage: this.state.chats[index].message.text });
    this.setState({ editingIndex: index });
  };

  handleReact = (index, emoji) => {
    const tempChats = [...this.state.chats];
    const thumbsUp = tempChats[index].reactions.thumbsUp;
    const thumbsDown = tempChats[index].reactions.thumbsDown;
    if (emoji === "thumbsUp") {
      this.socket.emit("editMessage", {
        messageId: this.state.chats[index]._id,
        editedMessage: this.state.chats[index].message.text,
        editedReactions: { thumbsUp: thumbsUp + 1, thumbsDown: thumbsDown },
      });
      tempChats[index].reactions = {
        thumbsUp: thumbsUp + 1,
        thumbsDown: thumbsDown,
      };
    } else if (emoji === "thumbsDown") {
      this.socket.emit("editMessage", {
        messageId: this.state.chats[index]._id,
        editedMessage: this.state.chats[index].message.text,
        editedReactions: { thumbsUp: thumbsUp, thumbsDown: thumbsDown + 1 },
      });
      tempChats[index].reactions = {
        thumbsUp: thumbsUp,
        thumbsDown: thumbsDown + 1,
      };
    }

    this.setState({ chats: tempChats });
  };

  handleSave = () => {
    this.socket.emit("editMessage", {
      messageId: this.state.chats[this.state.editingIndex]._id,
      editedMessage: this.state.editingMessage,
      editedReactions: this.state.chats[this.state.editingIndex].reactions,
    });

    const tempChats = [...this.state.chats];
    tempChats[this.state.editingIndex].message.text = this.state.editingMessage;
    this.setState({ chats: tempChats });

    this.setState({ editingMessage: "" });
    this.setState({ editingIndex: -1 });
  };

  handleEditChange = (event) => {
    this.setState({ editingMessage: event.target.value });
  };

  render() {
    const { chats, newMessage, room, editingMessage, editingIndex } =
      this.state;
    const { username, roomName, user } = this.props;

    //console.log(this.props);
    return (
      <div>
        <Button onClick={this.handleLeave}>Leave</Button>
        <div>
          <h2 className="chatroomName">Chatroom: {roomName}</h2>
        </div>

        <div className="chatContainer flex flex-center">
          <ul className="noBullets messageContainer">
            {chats.map((chat, index) => (
              <div key={index} className="messageBox flex-column">
                <div>
                  <div>
                    <div className="flex-row">
                      <Avatar sx={{ bgcolor: blue[100] }}>
                        <strong>{chat.name}</strong>
                      </Avatar>
                      <strong style={{ padding: 10, alignItems: "center" }}>
                        {chat.name}
                      </strong>
                    </div>
                  </div>
                </div>

                {editingIndex === index ? (
                  <div>
                    <form onSubmit={() => this.handleSave(index)}>
                      <TextField
                        multiline
                        variant="filled"
                        type="text"
                        value={editingMessage}
                        onChange={this.handleEditChange}
                      />
                      <Button type="submit">Save</Button>
                    </form>
                  </div>
                ) : (
                  <div>
                    <div>
                      <p className="messageText flex">{chat.message.text}</p>
                    </div>

                    {user._id === chat.sender ? (
                      <Button onClick={() => this.handleEdit(index)}>
                        Edit
                      </Button>
                    ) : (
                      <div className="reactBox">
                        <Button
                          onClick={() => this.handleReact(index, "thumbsUp")}
                        >
                          {String.fromCodePoint(0x1f44d)}{" "}
                          {/* Thumbs Up emoji */}
                        </Button>
                        <Button
                          onClick={() => this.handleReact(index, "thumbsDown")}
                        >
                          {String.fromCodePoint(0x1f44e)}{" "}
                          {/* Thumbs Down emoji */}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  {String.fromCodePoint(0x1f44d)}
                  {chat.reactions.thumbsUp} {String.fromCodePoint(0x1f44e)}
                  {chat.reactions.thumbsDown}
                </div>
              </div>
            ))}
          </ul>
        </div>

        <form
          onSubmit={this.handleSubmit}
          className="flex-row flex-center messageForm"
        >
          <div>
            <TextField
              sx={{
                fontSize: 20,
                width: 800,
                height: 50,
                margin: 1,
                padding: 1,
              }}
              type="text"
              id="outlined-basic"
              value={newMessage}
              onChange={this.handleChange}
              placeholder="Type a message..."
            />
          </div>
          <div>
            <Button type="submit">
              <span>
                <SendRoundedIcon />
              </span>
            </Button>
          </div>
        </form>
      </div>
    );
  }
}

export default Chatroom;
