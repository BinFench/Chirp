import React, { PureComponent } from "react";
import Audio from "../res/Audio";
import Wave from "../res/Wave";

var test;

function MIDItoHz(MIDI) {
  return 440 * Math.pow(2, (MIDI - 69) / 12);
}

function onMIDISuccess(midiAccess) {
  console.log(midiAccess);
  for (var input of midiAccess.inputs.values())
    input.onmidimessage = getMIDIMessage;
}

function getMIDIMessage(midiMessage) {
  if (midiMessage.data[0] === 144) {
    test.play(MIDItoHz(midiMessage.data[1]));
  }
  if (midiMessage.data[0] === 128) {
    test.pause();
  }
  console.log(midiMessage.data);
}

function onMIDIFailure() {
  console.log("Could not access your MIDI devices.");
}

class SynthPad extends PureComponent {
  state = {
    masterGainValue: 1,
    oscillatorNodes: [],
    selectedOscillatorNodeIndex: -1
  };

  initializeMasterGain = () => {
    Audio.masterGainNode.connect(Audio.context.destination);
    Audio.masterGainNode.gain.setValueAtTime(0, Audio.context.currentTime);
  };

  changeMasterVolume = e => {
    this.setState({ masterGainValue: e.target.value / 100 });
  };

  addOscillatorNode = () => {
    const oscillatorGainNode = Audio.context.createGain();
    oscillatorGainNode.gain.setValueAtTime(0, Audio.context.currentTime);
    oscillatorGainNode.connect(Audio.masterGainNode);

    const oscillatorNode = Audio.context.createOscillator();
    oscillatorNode.connect(oscillatorGainNode);
    oscillatorNode.start();

    const oscillatorNodeValues = {
      oscillatorNode: oscillatorNode,
      oscillatorGainNode: oscillatorGainNode,
      frequency: oscillatorNode.frequency.value,
      type: oscillatorNode.type,
      gain: 0
    };

    this.setState({
      oscillatorNodes: [...this.state.oscillatorNodes, oscillatorNodeValues],
      selectedOscillatorNodeIndex: this.state.oscillatorNodes.length
    });
  };

  changeSelectedOscillatorNode = e => {
    this.setState({ selectedOscillatorNodeIndex: e.target.value });
  };

  updateSelectedOscillatorFrequency = e => {
    if (this.state.selectedOscillatorNodeIndex >= 0) {
      const oscillatorNodesCopy = [...this.state.oscillatorNodes];
      const selectedOscillatorNode =
        oscillatorNodesCopy[this.state.selectedOscillatorNodeIndex];

      selectedOscillatorNode.oscillatorNode.frequency.setValueAtTime(
        e.target.value,
        Audio.context.currentTime
      );

      selectedOscillatorNode.frequency = e.target.value;
      this.setState({
        oscillatorNodes: oscillatorNodesCopy
      });
    }
  };

  updateSelectedOscillatorType = e => {
    if (this.state.selectedOscillatorNodeIndex >= 0) {
      const oscillatorNodesCopy = [...this.state.oscillatorNodes];
      const selectedOscillatorNode =
        oscillatorNodesCopy[this.state.selectedOscillatorNodeIndex];

      selectedOscillatorNode.oscillatorNode.type = e.target.value;

      selectedOscillatorNode.type = e.target.value;
      this.setState({
        oscillatorNodes: oscillatorNodesCopy
      });
    }
  };

  updateSelectedOscillatorVolume = e => {
    if (this.state.selectedOscillatorNodeIndex >= 0) {
      const oscillatorNodesCopy = [...this.state.oscillatorNodes];
      const selectedOscillatorNode =
        oscillatorNodesCopy[this.state.selectedOscillatorNodeIndex];

      selectedOscillatorNode.oscillatorGainNode.gain.setValueAtTime(
        e.target.value / 100,
        Audio.context.currentTime
      );

      selectedOscillatorNode.gain = e.target.value;
      this.setState({
        oscillatorNodes: oscillatorNodesCopy
      });
    }
  };

  play = () => {
    Audio.masterGainNode.gain.setTargetAtTime(
      this.state.masterGainValue,
      Audio.context.currentTime,
      0.001
    );
  };

  pause = () => {
    Audio.masterGainNode.gain.setTargetAtTime(
      0,
      Audio.context.currentTime,
      0.001
    );
  };

  oscillatorSelectOptions = this.state.oscillatorNodes.map(
    (oscillatorNode, i) => (
      <option key={`oscillator-${i}`} value={i}>
        Oscillator {i}
      </option>
    )
  );

  componentDidMount() {
    this.initializeMasterGain();
    test = new Wave(Audio);
    if (navigator.requestMIDIAccess) {
      console.log("This browser supports WebMIDI!");
    } else {
      console.log("WebMIDI is not supported in this browser.");
    }
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  }

  render() {
    console.log("rendering");
    return (
      <div className="synth">
        <button onClick={this.addOscillatorNode}>Add New Oscillator</button>
        <select
          onChange={this.changeSelectedOscillatorNode}
          value={this.state.selectedOscillatorNodeIndex}
          className="select-oscillator"
        >
          {this.oscillatorSelectOptions}
        </select>
        <input
          type="number"
          value={
            this.state.selectedOscillatorNodeIndex >= 0
              ? this.state.oscillatorNodes[
                  this.state.selectedOscillatorNodeIndex
                ].frequency
              : ""
          }
          onChange={this.updateSelectedOscillatorFrequency}
          className="frequency"
        />
        <select
          value={
            this.state.selectedOscillatorNodeIndex >= 0
              ? this.state.oscillatorNodes[
                  this.state.selectedOscillatorNodeIndex
                ].type
              : ""
          }
          onChange={this.updateSelectedOscillatorType}
          className="wave-type"
        >
          <option value="sine">sine</option>
          <option value="sawtooth">sawtooth</option>
          <option value="square">square</option>
          <option value="triangle">triangle</option>
        </select>
        <p>Oscillator Volume: </p>
        <input
          type="range"
          min="0"
          max="100"
          value={
            this.state.selectedOscillatorNodeIndex >= 0
              ? this.state.oscillatorNodes[
                  this.state.selectedOscillatorNodeIndex
                ].gain
              : 0
          }
          onChange={this.updateSelectedOscillatorVolume}
          className="oscillator-volume"
        />
        <p>Master Volume: </p>
        <input
          type="range"
          min="0"
          max="100"
          value={this.state.masterGainValue * 100}
          onChange={this.changeMasterVolume}
          className="pad-volume"
        />
        <button onMouseDown={this.play} onMouseUp={this.pause} className="play">
          Play
        </button>
      </div>
    );
  }
}

export default SynthPad;
