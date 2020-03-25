import React, { Component } from "react";
import "../styles/App.css";
import Synth from "./Synth";

class App extends Component {
  render() {
    return (
      <div className="App">
        <Synth />
      </div>
    );
  }
}

export default App;
