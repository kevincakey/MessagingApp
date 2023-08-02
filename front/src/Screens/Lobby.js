import react from "react";
import { Button } from "@mui/material";

import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import SmsOutlinedIcon from "@mui/icons-material/SmsOutlined";
import PortraitOutlinedIcon from "@mui/icons-material/PortraitOutlined";
import DriveFileRenameOutlineOutlinedIcon from "@mui/icons-material/DriveFileRenameOutlineOutlined";
import "./Lobby.css";
import { blue, green } from "@mui/material/colors";

class Lobby extends react.Component {
  constructor(props) {
    super(props);
    this.state = {
      rooms: undefined,
      username: localStorage.getItem("username") || null,
      image: null,
      previewUrl: null,
      newName: "",
    };
  }

  // updateState(newElement) {
  //   this.setState({ rooms: [...this.rooms, newElement] });
  // }

  handleLogout = () => {
    fetch(this.props.server_url + "/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (res.ok) {
          localStorage.removeItem("username"); //maybe here?
          return res.text(); // Return the response as plain text
        } else {
          throw new Error("Failed to logout");
        }
      })
      .then((data) => {
        //console.log(data); // Log the response data (optional)
        this.props.changeScreen("auth"); // Change the screen to "auth"
      })
      .catch((error) => {
        console.error("Logout error:", error);
        alert(error.message);
      });
  };

  addRoom = (event) => {
    event.preventDefault();
    const { rooms } = this.state;
    const name = event.target.createRoomName.value;
    const userName = this.props.username;

    // Send a request to create a new room
    fetch(this.props.server_url + "/api/rooms/create", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, userName }),
    })
      .then((res) => {
        if (res.ok) {
          return res.json(); // Return the response as JSON
        } else {
          throw new Error("Failed to create room");
        }
      })
      .then((data) => {
        // Update the state with the new room
        const updatedArr = [...rooms, data.room];
        this.setState({ rooms: updatedArr });
        event.target.createRoomName.value = ""; // Clear the input field
      })
      .catch((error) => {
        console.error("Add room error:", error);
        alert(error.message);
      });
  };

  componentDidMount() {
    // TODO: write codes to fetch rooms for the current user from the server
    let { username, user } = this.props;
    if (username) {
      localStorage.setItem("username", username); //fix
    }
    username = localStorage.getItem("username");

    // Add the username to the request URL
    fetch(this.props.server_url + "/api/rooms/all?username=" + username, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error("Failed to fetch rooms");
        }
      })
      .then((data) => {
        this.setState({ rooms: data });
      })
      .catch((error) => {
        console.error("Error fetching rooms:", error);
        // Handle the error
      });
  }
  //create rooms here?

  beinRoom = (roomName) => {
    this.props.setRoomName(roomName);
    this.props.changeScreen("chatroom");
  };

  joinRoom = (roomName) => {
    // Send a request to join the specified room
    roomName.preventDefault();
    const { rooms } = this.state;
    const roomToJoin = roomName.target.roomID.value;
    fetch(this.props.server_url + "/api/rooms/join", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomToJoin }),
    })
      .then((res) => {
        if (res.ok) {
          // Handle successful join
          console.log("Joined room:", roomToJoin);
          return res.json(); //fix
        } else {
          throw new Error("Failed to join room");
        }
      }) //work here to change array so that joined rooms show
      .then((data) => {
        const updatedArr = [...rooms, data.room];
        this.setState({ rooms: updatedArr });
        roomName.target.roomID.value = "";
      })
      .catch((error) => {
        console.error("Join room error:", error);
        alert(error.message);
      });
  };

  leaveRoom = (roomName) => {
    roomName.preventDefault();
    //roomName.preventDefault();
    const roomToLeave = roomName.target.leaveRoomID.value;
    const { rooms } = this.state;

    // Send a request to leave the current room
    fetch(this.props.server_url + "/api/rooms/leave", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomToLeave }),
    })
      .then((res) => {
        if (res.ok) {
          // Handle successful leave
          console.log("Left the room");
          return res.json();
        } else {
          throw new Error("Failed to leave room");
        }
      })
      .then((data) => {
        //change to update array to remove the room

        const updatedArr = [];
        for (let i = 0; rooms.length > i; i++) {
          if (rooms[i].name !== roomName.target.leaveRoomID.value) {
            updatedArr.push(rooms[i]);
          }
        }
        //const updatedArr = rooms.filter((room) => room.name !== roomName);
        this.setState({ rooms: updatedArr });
        roomName.target.roomID.value = "";
      })
      .catch((error) => {
        //console.error("Leave room error:", error);
        //alert(error.message);
      });
  };
  handleFileChange = (event) => {
    const file = event.target.files[0];
    this.setState({
      image: file,
      previewUrl: URL.createObjectURL(file),
    });
  };

  handleNameChange = (event) => {
    this.setState({
      newName: event.target.value,
    });
  };

  updateName = () => {
    console.log("updatingUsername");
    const { user } = this.props;
    const newName = this.state.newName;
    if (newName === "") {
      alert("Please enter a new name");
      return;
    }
    // Send the data to the server to update the username
    fetch(this.props.server_url + "/api/rooms/updateName", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user, newName }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        this.props.changeUser(data);
        // Handle the response from the server
        // Display a success message or handle any errors
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  render() {
    return (
      <div>
        <div className="flex flex-row">
          <div className="navbar">
            <div className="flex-center">
              <div className="flex-center profileIcon">
                <Avatar sx={{ width: 100, height: 100 }} />

                <div id="Profile">
                  <div className="flex-center" style={{ padding: 30 }}>
                    {this.state.previewUrl && (
                      <img
                        src={this.state.previewUrl}
                        alt="Profile"
                        style={{ width: "200px" }}
                      />
                    )}
                  </div>
                  <div className="flex-center">
                    <TextField
                      variant="standard"
                      type="text"
                      value={this.state.newName}
                      onChange={this.handleNameChange}
                    />
                    <Button style={{ padding: 15 }} onClick={this.updateName}>
                      <DriveFileRenameOutlineOutlinedIcon />
                      Change Name
                    </Button>
                  </div>
                </div>

                {/* <AccountCircleIcon style={{color: blue[200], fontSize:"100px"}}/> */}
                {/* <strong style={{padding: 15}}>
                {this.props.username}          
              </strong> */}
              </div>
            </div>
            <div className="flex-center">
              <Button onClick={this.handleLogout}>Logout</Button>
            </div>
          </div>

          <div className="roomContainer">
            <h1>Lobby</h1>
            <div>
              {this.state.rooms
                ? this.state.rooms.map((room) => {
                    return (
                      <Button
                        sx={{ backgroundColor: blue[300] }}
                        variant="contained"
                        key={"roomKey" + room._id}
                        onClick={() => this.beinRoom(room.name)} //change this fix
                      >
                        {room.name}
                      </Button>
                    );
                  })
                : "loading..."}
            </div>

            <div>
              {
                /* write codes to join a new room using room id*/
                //----------------------------------------------------------------
                //might have to copy from the code on top instead of making own forms for both join and create

                <form id="createRoom" onSubmit={this.addRoom}>
                  <div className="submitContainer">
                    <div>
                      <label htmlFor="createRoomName">Create a room</label>
                    </div>
                    <div>
                      <TextField
                        variant="standard"
                        type="text"
                        id="createRoomName"
                        name="createRoomName"
                        placeholder="Room Name"
                      ></TextField>
                    </div>
                    <Button type="submit">Submit</Button>
                  </div>
                </form>
                //this.state.rooms
              }
            </div>

            <div>
              {
                /* write codes to enable user to create a new room*/
                <form id="joinRoom" onSubmit={this.joinRoom}>
                  <div className="submitContainer">
                    <div>
                      <label htmlFor="roomID">Join a room</label>
                    </div>
                    <div>
                      <TextField
                        variant="standard"
                        type="text"
                        id="roomID"
                        name="roomID"
                        placeholder="Room ID"
                      ></TextField>
                    </div>
                    <Button type="submit">Submit</Button>
                  </div>
                </form>
              }
            </div>

            <div>
              {
                /* write codes to enable user to create a new room*/
                <form id="leaveRoom" onSubmit={this.leaveRoom}>
                  <div className="submitContainer">
                    <div>
                      <label htmlFor="leaveRoomID">Leave a room</label>
                    </div>
                    <div>
                      <TextField
                        variant="standard"
                        type="text"
                        id="leaveRoomID"
                        name="leaveRoomID"
                        placeholder="Room ID"
                      ></TextField>
                    </div>
                    <Button type="submit">Submit</Button>
                  </div>
                </form>
              }
            </div>
          </div>

          <div></div>
        </div>
      </div>
    );
  }
}

export default Lobby;
