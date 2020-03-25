import React, { useState, useEffect } from "react";
import Audio from "../res/Audio";
import Instrument from "../res/Instrument";
import { Silver } from "react-dial-knob";

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
    test.pause(MIDItoHz(midiMessage.data[1]));
  }
}

function onMIDIFailure() {
  console.log("Could not access your MIDI devices.");
}

export default function Synth() {
  const [masterGainValue, setMasterGainValue] = useState(100);
  const [value, setValue] = useState(0);

  const initializeMasterGain = () => {
    Audio.masterGainNode.connect(Audio.context.destination);
    Audio.masterGainNode.gain.setValueAtTime(1, Audio.context.currentTime);
  };

  useEffect(() => {
    if (value === 0) {
      initializeMasterGain();
      test = new Instrument();
      test.addWave(Audio);
      if (navigator.requestMIDIAccess) {
        console.log("This browser supports WebMIDI!");
      } else {
        console.log("WebMIDI is not supported in this browser.");
      }
      navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
      setValue(1);
    } else {
      Audio.masterGainNode.gain.setValueAtTime(
        masterGainValue / 100,
        Audio.context.currentTime
      );
    }
  });

  return (
    <Silver
      diameter={70}
      min={0}
      max={100}
      value={masterGainValue}
      step={1}
      theme={{
        donutColor: "blue"
      }}
      onValueChange={setMasterGainValue}
      className="pad-volume"
    >
      <label id={"my-label"}>Master Volume</label>
    </Silver>
  );
}
