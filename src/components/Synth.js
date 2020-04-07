import React, { useState, useEffect } from "react";
import Audio from "../res/Audio";
import Instrument from "../res/Instrument";
import Wave from "../res/Wave";
import { Silver } from "react-dial-knob";

var test;

function MIDItoHz(MIDI) {
  return 440 * Math.pow(2, (MIDI - 69) / 12);
}

function HztoMIDI(freq) {
  return Math.round(12 * (Math.log(freq / 440) / Math.log(2)) + 69);
}

function onMIDISuccess(midiAccess) {
  for (var input of midiAccess.inputs.values())
    input.onmidimessage = getMIDIMessage;
}

function getMIDIMessage(midiMessage) {
  if (midiMessage.data[0] === 144) {
    test.play(MIDItoHz(midiMessage.data[1]), midiMessage.data[2] / 127);
  }
  if (midiMessage.data[0] === 128) {
    test.pause(MIDItoHz(midiMessage.data[1]));
  }
  if (midiMessage.data[0] === 176) {
    test.bend((midiMessage.data[2] - 64) / -64);
  }
}

function onMIDIFailure() {
  console.log("Could not access your MIDI devices.");
}

export default function Synth() {
  var waveAnalyser;
  var waveBufferLength;
  var waveDataArray;
  const waveCanvas = React.useRef("wave");
  var wavectx;
  const waveWidth = 190;
  const waveHeight = 100;
  const audioWidth = 512;
  const audioHeight = 512;
  const waveTypes = ["sine", "square", "sawtooth", "triangle"];
  const audioCanvas = React.useRef("audio");
  const freqCanvas = React.useRef("freq");
  var audioAnalyser;
  var audioBufferLength;
  var audioFreqArray;
  var audioDataArray;
  var audioctx;
  var freqctx;

  const [masterGainValue, setMasterGainValue] = useState(1);
  const [value, setValue] = useState(0);
  const [sampleWave, setSampleWave] = useState({});
  const [waveType, setWaveType] = useState(0);
  const [waveIndex, setWaveIndex] = useState(0);
  const [flicker, setFlicker] = useState(false);
  const [updateWave, setUpdateWave] = useState(false);

  const initializeMasterGain = () => {
    audioAnalyser = Audio.context.createAnalyser();
    audioAnalyser.fftSize = 2048;
    Audio.masterGainNode.connect(audioAnalyser);
    audioAnalyser.connect(Audio.context.destination);
    Audio.masterGainNode.gain.setValueAtTime(1, Audio.context.currentTime);
    audioBufferLength = audioAnalyser.frequencyBinCount;
    audioDataArray = new Uint8Array(audioBufferLength);
    audioFreqArray = new Uint8Array(audioBufferLength);

    audioctx = audioCanvas.current.getContext("2d");
    audioctx.clearRect(0, 0, audioWidth, audioHeight);
    freqctx = freqCanvas.current.getContext("2d");
    freqctx.clearRect(0, 0, audioWidth, audioHeight);
    drawAudio();
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
    var drawVisual = requestAnimationFrame(drawAudio);
    audioAnalyser.getByteTimeDomainData(audioDataArray);
    audioctx.fillStyle = "rgb(200, 200, 200)";
    audioctx.fillRect(0, 0, audioWidth, audioHeight);
    audioctx.lineWidth = 2;
    audioctx.strokeStyle = "rgb(0, 0, 0)";
    audioctx.beginPath();
    let indexPerPixel = audioBufferLength / (audioWidth * 4);
    for (var x = 0; x < audioWidth; x++) {
      let v = audioDataArray[Math.round(indexPerPixel * x)] / 128.0;
      let y = (v * audioHeight) / 2.2 + 5;

      if (x === 0) {
        audioctx.moveTo(x, y);
      } else {
        audioctx.lineTo(x, y);
      }
    }
    audioctx.lineTo(audioCanvas.width, audioCanvas.height / 2);
    audioctx.stroke();

    audioAnalyser.getByteFrequencyData(audioFreqArray);
    freqctx.fillStyle = "rgb(0, 0, 0)";
    freqctx.fillRect(0, 0, audioWidth, audioHeight);
    var barWidth = audioWidth / audioBufferLength;
    var barHeight;
    var x = 0;

    for (var i = 0; i < audioBufferLength; i++) {
      barHeight = (audioFreqArray[i] * audioHeight) / 255;

      freqctx.fillStyle = "rgb(255, 0, 0)";
      freqctx.fillRect(x, audioHeight - barHeight / 2, barWidth, barHeight);

      x += barWidth + 1;
    }
  }

  useEffect(() => {
    if (value === 0) {
      initializeMasterGain();
      test = new Instrument();
      test.addWave(Audio);

      waveAnalyser = Audio.context.createAnalyser();
      waveAnalyser.fftSize = 2048;
      let wave = test.waves[waveIndex];
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
      let wave = test.waves[waveIndex];
      if (wave.type !== waveTypes[waveType] || updateWave) {
        setUpdateWave(false);
        for (let i = 0; i < test.instancePlaying.length; i++) {
          test.instancePlaying[i][waveIndex].oscillatorNode.type =
            waveTypes[waveType];
        }
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
        }, 75);
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
          donutColor: "blue",
        }}
        onValueChange={setMasterGainValue}
        className="pad-volume"
      >
        <label id={"label"}>Master Volume</label>
      </Silver>
      <div id="waveController">
        <canvas
          id="waveDisp"
          ref={waveCanvas}
          width={waveWidth}
          height={waveHeight}
        />
        <div id="waveSwitcher">
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
          <div id="waveTypes">
            <p>{waveTypes[waveType]}</p>
          </div>
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
        <div id="waveGainAdd">
          <input
            type="range"
            min="0"
            max="100"
            value={test ? test.waves[waveIndex].gain * 100 : 100}
            onChange={(e) => {
              setFlicker(!flicker);
              test.waves[waveIndex].gain = e.target.value / 100;
              for (let i = 0; i < test.instancePlaying.length; i++) {
                test.instancePlaying[i][
                  waveIndex
                ].oscillatorGainNode.gain.setValueAtTime(
                  test.waves[waveIndex].gain,
                  test.waves[waveIndex].audio.context.currentTime
                );
              }
            }}
          />
          <button
            id="addWave"
            onClick={() => {
              test.addWave(Audio);
              setWaveIndex(test.waves.length - 1);
              for (let i = 0; i < test.instancePlaying.length; i++) {
                let wave = new Wave(
                  test.waves[test.waves.length - 1].audio,
                  test.waves[test.waves.length - 1].gain,
                  test.waves[test.waves.length - 1].type,
                  test.waves[test.waves.length - 1].real,
                  test.waves[test.waves.length - 1].imag,
                  test.pitchBend
                );
                wave.detune = test.waves[test.waves.length - 1].detune;
                wave.detuneType = test.waves[test.waves.length - 1].detuneType;
                wave.play(test.instanceFreq[i], 1);
                test.instancePlaying[i].push(wave);
                setWaveType(
                  waveTypes.indexOf(test.waves[test.waves.length - 1].type)
                );
                setUpdateWave(true);
              }
            }}
          >
            <i id="whiteIcon" class="plus icon"></i>
          </button>
        </div>
        <div id="waveDetuneSub">
          <input
            id="detune"
            type="number"
            value={test ? test.waves[waveIndex].detune : 0}
            onChange={(e) => {
              setFlicker(!flicker);
              test.waves[waveIndex].detune = parseInt(e.target.value);
              let isSemitones =
                test.waves[waveIndex].detuneType === "semitones";
              for (let i = 0; i < test.instancePlaying.length; i++) {
                let wave = test.instancePlaying[i][waveIndex];
                let frequency =
                  wave.oscillatorNode.frequency.value /
                  Math.pow(0.5, wave.pitchBend);
                if (isSemitones) {
                  let MIDI =
                    HztoMIDI(frequency) -
                    wave.detune +
                    parseInt(e.target.value);
                  frequency = MIDItoHz(MIDI);
                } else {
                  frequency -= wave.detune - parseInt(e.target.value);
                }
                wave.oscillatorNode.frequency.setValueAtTime(
                  Math.max(frequency, 0),
                  wave.audio.context.currentTime
                );
                wave.detune = test.waves[waveIndex].detune;
              }
            }}
          />
          <select
            id="detuneType"
            value={test ? test.waves[waveIndex].detuneType : "hz"}
            onChange={(e) => {
              setFlicker(!flicker);
              test.waves[waveIndex].detuneType = e.target.value;
              test.waves[waveIndex].detune = 0;
            }}
          >
            <option value="hz">hz</option>
            <option value="semitones">semitones</option>
          </select>
          <button
            id="subWave"
            onClick={() => {
              let index = waveIndex;
              if (test.waves.length === 1) {
                return;
              }

              for (let i = 0; i < test.instancePlaying.length; i++) {
                let wave = test.instancePlaying[i][index];
                wave.pause();
                wave.remove();
                test.instancePlaying[i].splice(index, 1);
              }

              test.waves.splice(index, 1);
              if (index > 0) {
                index--;
              }
              setWaveType(waveTypes.indexOf(test.waves[index].type));
              setWaveIndex(index);
              setUpdateWave(true);
            }}
          >
            <i id="whiteIcon" class="minus icon"></i>
          </button>
        </div>
        <div id="wavecontainer">
          {test ? (
            test.waves.map((wave, index) => {
              return (
                <div
                  id={index === waveIndex ? "selectedWave" : "wave"}
                  onClick={() => {
                    if (index === waveIndex) {
                      return;
                    }
                    setWaveIndex(index);
                    setUpdateWave(!(waveType === wave.type));
                    setWaveType(waveTypes.indexOf(wave.type));
                  }}
                  className="ui segment"
                >
                  {index +
                    " - " +
                    (waveIndex === index ? waveTypes[waveType] : wave.type)}
                </div>
              );
            })
          ) : (
            <div></div>
          )}
        </div>
      </div>
      <div id="disp">
        <canvas
          id="audioDisp"
          ref={audioCanvas}
          width={audioWidth}
          height={audioHeight}
        />
        <canvas
          id="freqDisp"
          ref={freqCanvas}
          width={audioWidth}
          height={audioHeight}
        />
      </div>
    </div>
  );
}
