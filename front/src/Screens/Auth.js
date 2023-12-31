import React from "react";
import Form from "../Components/form.js";
import { Button } from "@mui/material";
import "./Auth.css"; // Import the CSS file

class Auth extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showForm: false,
      selectedForm: undefined,
    };
  }

  closeForm = () => {
    this.setState({ showForm: false });
  };

  login = (data) => {
    // TODO: write codes to login
    fetch(this.props.server_url + "/api/auth/login", {
      method: "POST",
      mode: "cors",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    }).then((res) => {
      res.json().then((data) => {
        if (data.msg === "Logged in") {
          this.props.changeUserName(data.username);
          this.props.changeUser(data.user);
          this.props.changeScreen("lobby");
        } else {
          alert(data.msg);
        }
      });
    });
  };

  register = (data) => {
    //fix
    console.log(data);
    // TODO: write codes to register
    fetch(this.props.server_url + "/api/auth/register", {
      method: "POST",
      mode: "cors",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    }).then((res) => {
      res.json().then((data) => {
        if (data.msg === "Registered") {
          this.props.changeScreen("auth");
          this.setState({ showForm: false });
        } else {
          alert(data.msg);
        }
      });
    });
  };

  render() {
    let display = null;
    if (this.state.showForm) {
      let fields = [];
      if (this.state.selectedForm === "login") {
        fields = ["username", "password"];
        display = (
          <Form
            fields={fields}
            close={this.closeForm}
            type="Login"
            submit={this.login}
            key={this.state.selectedForm}
          />
        );
      } else if (this.state.selectedForm === "register") {
        fields = ["username", "password", "name"];
        display = (
          <Form
            fields={fields}
            close={this.closeForm}
            type="Register"
            submit={this.register}
            key={this.state.selectedForm}
          />
        );
      }
    } else {
      display = (
        <div>
          <Button
            onClick={() =>
              this.setState({ showForm: true, selectedForm: "login" })
            }
          >
            Login
          </Button>
          <Button
            onClick={() =>
              this.setState({ showForm: true, selectedForm: "register" })
            }
          >
            Register
          </Button>
        </div>
      );
    }
    return (
      <div className="authContainer">
        <h1 className="authTitle">Welcome to our website!</h1>
        {display}
      </div>
      
    );
  }
}

export default Auth;