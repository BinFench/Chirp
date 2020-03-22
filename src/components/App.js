import React, { Component } from "react";
import "../styles/App.css";
import SynthPad from "./SynthPad"

class App extends Component {
  render() {
    return (
      <div className="App">
        <SynthPad />
      </div>
    );
  }
}

export default App;