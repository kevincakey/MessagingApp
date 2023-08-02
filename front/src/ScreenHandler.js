import React, { useState } from "react";
import Auth from "./Screens/Auth.js";
import Lobby from "./Screens/Lobby.js";
import Chatroom from "./Screens/Chatroom.js";

const server_url = "http://localhost:3001";

class ScreenHandler extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      screen: undefined,
      user: undefined,
      username: "",
      roomName: "ahhhh", // Set an initial value for roomName
    };
  }

  componentDidMount() {
    // checking if the user has an active session
    // if yes, then show the lobby; if no, then show the auth
    fetch(server_url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => {
      res.json().then((data) => {
        if (data.message === "logged in") {
          this.setState({ screen: "lobby" });
        } else {
          this.setState({ screen: "auth" });
        }
      });
    });
  }

  changeScreen = (screen) => {
    this.setState({ screen: screen });
    //console.log(this.state.username);
  };

  changeUser = (user) => {
    this.setState({ user: user });
  };

  changeUserName = (username) => {
    this.setState({ username: username });
  };

  setRoomName = (roomName) => {
    this.setState({ roomName: roomName });
  };

  render() {
    const { screen, roomName, username } = this.state;

    let display = "loading...";
    if (screen === "auth") {
      display = (
        <Auth
          server_url={server_url}
          changeScreen={this.changeScreen}
          setRoomName={this.setRoomName}
          changeUserName={this.changeUserName}
          changeUser={this.changeUser}
        />
      );
    } else if (screen === "lobby") {
      display = (
        <Lobby
          server_url={server_url}
          changeScreen={this.changeScreen}
          roomName={roomName}
          setRoomName={this.setRoomName}
          changeUser={this.changeUser}
          username={username}
          user={this.state.user}
        />
      );
    } else if (screen === "chatroom") {
      display = (
        <Chatroom
          server_url={server_url}
          changeScreen={this.changeScreen}
          roomName={roomName}
          setRoomName={this.setRoomName}
          username={username}
          user={this.state.user}
        />
      );
    }

    return <div>{display}</div>;
  }
}

export default ScreenHandler;
