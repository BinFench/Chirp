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
  var waveAnalyser;
  var waveBufferLength;
  var waveDataArray;
  const waveCanvas = React.useRef(null);
  var wavectx;
  const waveWidth = 150;
  const waveHeight = 100;
  const audioWidth = 512;
  const audioHeight = 512;
  const waveTypes = ["sine", "square", "sawtooth", "triangle"];
  const audioCanvas = React.useRef(null);

  const [masterGainValue, setMasterGainValue] = useState(1);
  const [value, setValue] = useState(0);
  const [sampleWave, setSampleWave] = useState({});
  const [waveType, setWaveType] = useState(0);

  const initializeMasterGain = () => {
    Audio.masterGainNode.connect(Audio.context.destination);
    Audio.masterGainNode.gain.setValueAtTime(1, Audio.context.currentTime);
  };

  function drawWave() {
    waveAnalyser.getByteTimeDomainData(waveDataArray);
    wavectx.fillStyle = "rgb(200, 200, 200)";
    wavectx.fillRect(0, 0, waveWidth, waveHeight);
    wavectx.lineWidth = 2;
    wavectx.strokeStyle = "rgb(0, 0, 0)";
    wavectx.beginPath();
    let indexPerPixel = waveBufferLength / (waveWidth * 4);
    for (var x = 0; x < waveWidth; x++) {
      let v = waveDataArray[Math.round(indexPerPixel * x)] / 128.0;
      let y = (v * waveHeight) / 2.2 + 5;

      if (x === 0) {
        wavectx.moveTo(x, y);
      } else {
        wavectx.lineTo(x, y);
      }
    }
    wavectx.lineTo(waveCanvas.width, waveCanvas.height / 2);
    wavectx.stroke();
  }

  function drawAudio() {
    waveAnalyser.getByteTimeDomainData(waveDataArray);
    wavectx.fillStyle = "rgb(200, 200, 200)";
    wavectx.fillRect(0, 0, waveWidth, waveHeight);
    wavectx.lineWidth = 2;
    wavectx.strokeStyle = "rgb(0, 0, 0)";
    wavectx.beginPath();
    let indexPerPixel = waveBufferLength / (waveWidth * 4);
    for (var x = 0; x < waveWidth; x++) {
      let v = waveDataArray[Math.round(indexPerPixel * x)] / 128.0;
      let y = (v * waveHeight) / 2.2 + 5;

      if (x === 0) {
        wavectx.moveTo(x, y);
      } else {
        wavectx.lineTo(x, y);
      }
    }
    wavectx.lineTo(waveCanvas.width, waveCanvas.height / 2);
    wavectx.stroke();
  }

  useEffect(() => {
    if (value === 0) {
      initializeMasterGain();
      test = new Instrument();
      test.addWave(Audio);

      waveAnalyser = Audio.context.createAnalyser();
      waveAnalyser.fftSize = 2048;
      let wave = test.waves[0];
      wave.oscillatorNode.connect(waveAnalyser);
      waveBufferLength = waveAnalyser.frequencyBinCount;
      waveDataArray = new Uint8Array(waveBufferLength);

      wavectx = waveCanvas.current.getContext("2d");
      wavectx.clearRect(0, 0, waveWidth, waveHeight);
      setTimeout(() => {
        drawWave();
      }, 50);

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
      let wave = test.waves[0];
      if (wave.type !== waveTypes[waveType]) {
        wave.type = waveTypes[waveType];
        wave.oscillatorNode.type = waveTypes[waveType];
        wave.oscillatorNode.disconnect(waveAnalyser);
        waveAnalyser = Audio.context.createAnalyser();
        waveAnalyser.fftSize = 2048;
        wave.oscillatorNode.connect(waveAnalyser);
        waveBufferLength = waveAnalyser.frequencyBinCount;
        waveDataArray = new Uint8Array(waveBufferLength);
        wavectx = waveCanvas.current.getContext("2d");
        wavectx.clearRect(0, 0, waveWidth, waveHeight);
        setTimeout(() => {
          drawWave();
        }, 50);
      }
    }
  });

  return (
    <div id="synth">
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
        <label id={"label"}>Master Volume</label>
      </Silver>
      <div id="waveController">
        <canvas ref={waveCanvas} width={audioWidth} height={audioHeight} />
        <button
          onClick={() => {
            if (waveType === 0) {
              setWaveType(3);
            } else {
              setWaveType(waveType - 1);
            }
          }}
          className="ui button"
        >
          <i class="angle double left icon"></i>
        </button>
        {waveTypes[waveType]}
        <button
          onClick={() => {
            if (waveType === 3) {
              setWaveType(0);
            } else {
              setWaveType(waveType + 1);
            }
          }}
          className="ui button"
        >
          <i class="angle double right icon"></i>
        </button>
      </div>
      <canvas ref={audioCanvas} width={waveWidth} height={waveHeight} />
    </div>
  );
}
