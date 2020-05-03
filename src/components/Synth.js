import React, { useState, useEffect } from "react";
import Audio from "../res/Audio";
import Instrument from "../res/Instrument";
import Wave from "../res/Wave";
import { Silver } from "react-dial-knob";
import Filter from "../res/Filter";

var test;
const freqArray = new Float32Array(19980);
var freqResp = new Float32Array(19980);
var phaseResp = new Float32Array(19980);
var expanded = [true];
var isRemoving = false;

for (let i = 0; i < 19980; i++) {
  freqArray[i] = 20 + i;
}

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
  var filterctx;
  var envelopectx;
  const waveWidth = 200;
  const waveHeight = 100;
  const filterWidth = 200;
  const filterHeight = 100;
  const envelopeWidth = 200;
  const envelopeHeight = 100;
  const audioWidth = 256;
  const audioHeight = 256;
  const waveTypes = ["sine", "square", "sawtooth", "triangle", "custom"];
  const filterTypes = [
    "lowpass",
    "highpass",
    "bandpass",
    "lowshelf",
    "highshelf",
    "peaking",
    "notch",
    "allpass",
  ];
  const rampTypes = [
    "const",
    "linear",
    "exponential",
    "curve"
  ];
  const elemTypes = [
    "wave", "filter", "LFO"
  ];
  const waveParams = [
    "gain", "detune"
  ];
  const filterParams = [
    "gain", "Q", "detune"
  ]
  const LFOParams = [
    "gain", "detune"
  ];
  const filterCanvas = React.useRef("filter");
  const envelopeCanvas = React.useRef("envelope");
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
  const [waveType, setWaveType] = useState(0);
  const [filterType, setFilterType] = useState(0);
  const [rampType, setRampType] = useState(1);
  const [waveIndex, setWaveIndex] = useState(0);
  const [filterIndex, setFilterIndex] = useState(0);
  const [envelopeIndex, setEnvelopeIndex] = useState(0);
  const [rampIndex, setRampIndex] = useState(0);
  const [flicker, setFlicker] = useState(false);
  const [updateWave, setUpdateWave] = useState(false);
  const [updateFilter, setUpdateFilter] = useState(false);
  const [updateEnvelope, setUpdateEnvelope] = useState(false);
  const [elemType, setElemType] = useState(0);
  const [waveParam, setWaveParam] = useState(0);
  const [filterParam, setFilterParam] = useState(0);
  const [LFOParam, setLFOParam] = useState(0);
  const [elemIndex, setElemIndex] = useState(0);

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

  function drawFilter() {
    test.filters[filterIndex].filter.getFrequencyResponse(
      freqArray,
      freqResp,
      phaseResp
    );

    let max = 0;
    for (var i = 0; i < 200; i++) {
      if (max < freqResp[Math.round((19959 / 200) * i)]) {
        max = freqResp[Math.round((19959 / 200) * i)];
      }
    }

    filterctx.fillStyle = "rgb(0, 0, 0)";
    filterctx.fillRect(0, 0, filterWidth, filterHeight);
    for (var i = 0; i < 200; i++) {
      let value = (freqResp[Math.round((19959 / 200) * i)] / max) * 95;
      filterctx.fillStyle = "rgb(255, 0, 0)";
      filterctx.fillRect(i, 100 - value, 1, value);
    }
  }

  function drawEnvelope() {
    var drawVisual = requestAnimationFrame(drawAudio);
    let envelope = test.envelopes[envelopeIndex];
    let totalTime = 0;
    let x = 0;
    let y = envelope.initialValue * 95;
    for (let i = 0; i < envelope.ramps.length; i++) {
      totalTime += envelope.ramps[i].time;
    }
    envelopectx.lineWidth = 2;
    envelopectx.strokeStyle = "rgb(0, 0, 0)";
    envelopectx.beginPath();
    envelopectx.moveTo(x, 100 - y);
    for (let i = 0; i < envelope.ramps.length; i++) {
      let ramp = envelope.ramps[i];
      if (i === rampIndex) {
        envelopectx.fillStyle = "rgb(230, 230, 230)";
      } else {
        envelopectx.fillStyle = "rgb(200, 200, 200)";
      }
      envelopectx.fillRect(x, 0, Math.ceil((ramp.time / totalTime) * 200), 100);
      switch (ramp.type) {
        case "const":
          envelopectx.lineTo(x + Math.round((ramp.time / totalTime) * 200), 100 - y);
          envelopectx.lineTo(x + Math.round((ramp.time / totalTime) * 200), 100 - (ramp.value * 95));
          break;
        case "linear":
          envelopectx.lineTo(x + Math.round((ramp.time / totalTime) * 200), 100 - (ramp.value * 95));
          break;
        case "exponential":
          let constant = 0;
          let exp_y = 0;
          let base = 0;
          if (y < ramp.value * 95) {
            constant = Math.max(y, 1);
            exp_y = ramp.value * 95;
            base = exp_y / constant;
          } else {
            constant = 100 - y;
            exp_y = 100 - ramp.value * 95;
            base = exp_y / constant
          }
          for (let j = 0; j < Math.round((ramp.time / totalTime) * 200); j++) {
            if (y < ramp.value * 95) {
              envelopectx.lineTo(x + j, 100 - ((constant * Math.pow(base, j / Math.round((ramp.time / totalTime) * 200)))));
            } else if (y > ramp.value * 95) {
              envelopectx.lineTo(x + j, (constant * Math.pow(base, j / Math.round((ramp.time / totalTime) * 200))));
            } else {
              envelopectx.lineTo(x + j, 100 - y);
            }
          }
          break;
        case "curve":
          let indexPerPixel = ramp.values.length / Math.round((ramp.time / totalTime) * 200);
          for (let j = 0; j < Math.round((ramp.time / totalTime) * 200); j++) {
            envelopectx.lineTo(x + j, 100 - (ramp.values[Math.round(indexPerPixel * j)] * 95));
          }
          break;
        default:
          break;
      }
      envelopectx.lineTo(x + Math.round((ramp.time / totalTime) * 200), 100 - (ramp.value * 95));
      x += Math.round((ramp.time / totalTime) * 200);
      y = ramp.value * 95;
    }
    envelopectx.stroke();
  }

  function drawAudio() {
    var drawVisual = requestAnimationFrame(drawAudio);
    if (!audioAnalyser) {
      return;
    }
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
      freqctx.fillRect(x, audioHeight - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  }

  useEffect(() => {
    if (value === 0) {
      initializeMasterGain();
      test = new Instrument();
      test.addWave(Audio);
      test.addFilter(Audio);
      test.addEnvelope(Audio);

      waveAnalyser = Audio.context.createAnalyser();
      waveAnalyser.fftSize = 2048;
      let wave = test.waves[waveIndex];
      wave.oscillatorNode.connect(waveAnalyser);
      waveBufferLength = waveAnalyser.frequencyBinCount;
      waveDataArray = new Uint8Array(waveBufferLength);

      wavectx = waveCanvas.current.getContext("2d");
      wavectx.clearRect(0, 0, waveWidth, waveHeight);
      filterctx = filterCanvas.current.getContext("2d");
      filterctx.clearRect(0, 0, filterWidth, filterHeight);
      envelopectx = envelopeCanvas.current.getContext("2d");
      envelopectx.clearRect(0, 0, envelopeWidth, envelopeHeight);
      setTimeout(() => {
        drawWave();
        drawFilter();
        drawEnvelope();
      }, 100);

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
      let filter = test.filters[filterIndex];
      if (filter.type !== filterTypes[filterType] || updateFilter) {
        filter.type = filterTypes[filterType];
        setUpdateFilter(false);
        filter.filter.type = filterTypes[filterType];
        for (let i = 0; i < test.filtersUsed.length; i++) {
          if (test.filtersUsed[i].includes(filterIndex)) {
            let index = test.filtersUsed[i].indexOf(filterIndex);
            for (let j = 0; j < test.instancePlaying.length; j++) {
              test.instancePlaying[j][i].filters[index].filter.type =
                filterTypes[filterType];
            }
          }
        }
        filterctx = filterCanvas.current.getContext("2d");
        filterctx.clearRect(0, 0, filterWidth, filterHeight);
        drawFilter();
      }
      let envelope = test.envelopes[envelopeIndex];
      let ramp = envelope.ramps[rampIndex];
      if (ramp.type !== rampTypes[rampType] || updateEnvelope) {
        ramp.type = rampTypes[rampType];
        setUpdateEnvelope(false);
        envelopectx = envelopeCanvas.current.getContext("2d");
        envelopectx.clearRect(0, 0, envelopeWidth, envelopeHeight);
        drawEnvelope();
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
              for (let i = 0; i < test.instancePlaying.length; i++) {
                let wave = test.instancePlaying[i][waveIndex];
                let frequency =
                  wave.oscillatorNode.frequency.value /
                  Math.pow(0.5, wave.pitchBend);
                if (test.waves[waveIndex].detuneType === "cents") {
                  let detune = (wave.detune / 100) * 12;
                  let MIDI =
                    HztoMIDI(frequency) -
                    detune +
                    (parseInt(e.target.value) / 100) * 12;
                  frequency = MIDItoHz(MIDI);
                } else if (test.waves[waveIndex].detuneType === "semitones") {
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
            <option value="cents">cents</option>
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
                66
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
      <div id="filterController">
        <canvas
          id="filterDisp"
          ref={filterCanvas}
          width={filterWidth}
          height={filterHeight}
        />
        <div id="filterSwitcher">
          <button
            id="filterLeft"
            onClick={() => {
              if (filterType === 0) {
                setFilterType(7);
              } else {
                setFilterType(filterType - 1);
              }
            }}
            className="ui button"
          >
            <i class="angle double left icon"></i>
          </button>
          <div id="filterTypes">
            <p>{filterTypes[filterType]}</p>
          </div>
          <button
            onClick={() => {
              if (filterType === 7) {
                setFilterType(0);
              } else {
                setFilterType(filterType + 1);
              }
            }}
            className="ui button"
          >
            <i class="angle double right icon"></i>
          </button>
        </div>
        <div id="filterAdd">
          <button
            id="filterLink"
            onClick={() => {
              let filters = test.filtersUsed[waveIndex];
              if (filters[0] === -1) {
                filters[0] = filterIndex;
              } else {
                if (filters.includes(filterIndex)) {
                  return;
                }
                filters.push(filterIndex);
              }
              for (let i = 0; i < test.instancePlaying.length; i++) {
                let wave = test.instancePlaying[i][waveIndex];
                let copyFilter = test.filters[filterIndex];
                let newFilter = new Filter(
                  Audio,
                  copyFilter.freq,
                  copyFilter.type,
                  copyFilter.detune,
                  copyFilter.Q,
                  copyFilter.gain
                );
                if (wave.filters.length === 0) {
                  wave.oscillatorNode.disconnect();
                }
                newFilter.filter.connect(wave.oscillatorGainNode);
                wave.filters.push(newFilter);
                wave.oscillatorNode.connect(newFilter.filter);
              }
            }}
            className="ui button"
          >
            <i class="exchange alternate icon" />
          </button>
          <input
            id="filterFreq"
            type="number"
            value={test ? test.filters[filterIndex].freq : 1000}
            onChange={(e) => {
              setUpdateFilter(true);
              let value = parseInt(e.target.value);
              test.filters[filterIndex].freq = value;
              test.filters[filterIndex].filter.frequency.value = value;
              for (let i = 0; i < test.filtersUsed.length; i++) {
                if (test.filtersUsed[i].includes(filterIndex)) {
                  let index = test.filtersUsed[i].indexOf(filterIndex);
                  for (let j = 0; j < test.instancePlaying.length; j++) {
                    test.instancePlaying[j][i].filters[
                      index
                    ].filter.frequency.value = value;
                  }
                }
              }
            }}
          />
          <button
            onClick={() => {
              let filters = test.filtersUsed[waveIndex];
              if (!filters.includes(filterIndex)) {
                return;
              }
              let index = filters.indexOf(filterIndex);
              filters.splice(index, 1);
              if (filters.length === 0) {
                filters.push(-1);
              }
              for (let i = 0; i < test.instancePlaying.length; i++) {
                let wave = test.instancePlaying[i][waveIndex];
                wave.filters[index].filter.disconnect();
                if (wave.filters.length === 1) {
                  wave.oscillatorNode.connect(wave.oscillatorGainNode);
                }
              }
            }}
            className="ui button"
          >
            <i class="unlink icon" />
          </button>
        </div>
        <div id="filterSub">
          {test ? (
            filterTypes[filterType] !== "lowshelf" &&
              filterTypes[filterType] !== "highshelf" ? (
                <div id="container">
                  <h5 id="optionalContainer">{"Q: "}</h5>
                  <input
                    id="filterQ"
                    type="number"
                    value={test ? test.filters[filterIndex].Q : 1}
                    onChange={(e) => {
                      setUpdateFilter(true);
                      let value = parseInt(e.target.value);
                      test.filters[filterIndex].Q = value;
                      test.filters[filterIndex].filter.Q.value = value;
                      for (let i = 0; i < test.filtersUsed.length; i++) {
                        if (test.filtersUsed[i].includes(filterIndex)) {
                          let index = test.filtersUsed[i].indexOf(filterIndex);
                          for (let j = 0; j < test.instancePlaying.length; j++) {
                            test.instancePlaying[j][i].filters[
                              index
                            ].filter.Q.value = value;
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div />
              )
          ) : (
              <div />
            )}
          {test ? (
            filterTypes[filterType] === "lowshelf" ||
              filterTypes[filterType] === "highshelf" ||
              filterTypes[filterType] === "peaking" ? (
                <div id="container">
                  <h5 id="optionalContainer">{"Gain: "}</h5>
                  <input
                    id="filterGain"
                    type="number"
                    value={test ? test.filters[filterIndex].gain : 1}
                    onChange={(e) => {
                      setUpdateFilter(true);
                      let value = parseInt(e.target.value);
                      test.filters[filterIndex].gain = value;
                      test.filters[filterIndex].filter.gain.value = value;
                      for (let i = 0; i < test.filtersUsed.length; i++) {
                        if (test.filtersUsed[i].includes(filterIndex)) {
                          let index = test.filtersUsed[i].indexOf(filterIndex);
                          for (let j = 0; j < test.instancePlaying.length; j++) {
                            test.instancePlaying[j][i].filters[
                              index
                            ].filter.gain.value = value;
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div />
              )
          ) : (
              <div />
            )}
        </div>
        <div id="filterAddSub">
          <button
            id="addFilter"
            onClick={() => {
              test.addFilter(Audio);
              setFilterIndex(test.filters.length - 1);
            }}
          >
            <i id="whiteIcon" class="plus icon"></i>
          </button>
          <button
            id="subFilter"
            onClick={() => {
              setUpdateFilter(true);
              let index = filterIndex;
              if (test.filters.length === 1) {
                return;
              }

              for (let i = 0; i < test.filtersUsed.length; i++) {
                let numDeleted = 0;
                for (let j = 0; j < test.filtersUsed[i].length; j++) {
                  if (test.filtersUsed[i][j] > filterIndex) {
                    test.filtersUsed[i][j]--;
                  } else if (
                    test.filtersUsed[i][j - numDeleted] === filterIndex
                  ) {
                    test.filtersUsed[i].splice(j - numDeleted, 1);
                    numDeleted++;
                    for (let k = 0; k < test.instancePlaying.length; k++) {
                      test.instancePlaying[k][i].filters[j].filter.disconnect();
                      if (test.instancePlaying[k][k].filters.length === 1) {
                        test.instancePlaying[k][i].oscillatorGainNode.connect(
                          Audio.masterGainNode
                        );
                      }
                    }
                  }
                }
              }
              test.filters.splice(filterIndex, 1);
              if (filterIndex > 0) {
                setFilterIndex(filterIndex - 1);
              }
            }}
          >
            <i id="whiteIcon" class="minus icon"></i>
          </button>
        </div>
        <div id="filterContainer">
          {test ? (
            test.filters.map((filter, index) => {
              return (
                <div
                  id={index === filterIndex ? "selectedFilter" : "filter"}
                  onClick={() => {
                    if (index === filterIndex) {
                      return;
                    }
                    setFilterIndex(index);
                    setUpdateFilter(!(filterType === filter.type));
                    setFilterType(filterTypes.indexOf(filter.type));
                  }}
                  className="ui segment"
                >
                  {index +
                    " - " +
                    (filterIndex === index
                      ? filterTypes[filterType]
                      : filter.type)}
                </div>
              );
            })
          ) : (
              <div></div>
            )}
        </div>
      </div>
      <div id="envelopeController">
        <canvas
          id="envelopeDisp"
          ref={envelopeCanvas}
          width={envelopeWidth}
          height={envelopeHeight}
        />
        <div id="envelopeSwitcher">
          <button
            id="envelopeLeft"
            onClick={() => {
              setUpdateWave(true);
              if (rampIndex === 0) {
                if (rampType === 0) {
                  test.envelopes[envelopeIndex].ramps[0].type = rampTypes[2];
                } else {
                  test.envelopes[envelopeIndex].ramps[0].type = rampTypes[rampType - 1];
                }
              }
              if (rampType === 0) {
                setRampType(2);
              } else {
                setRampType(rampType - 1);
              }
            }}
            className="ui button"
          >
            <i class="angle double left icon"></i>
          </button>
          <div id="rampTypes">
            <p>{rampTypes[rampType]}</p>
          </div>
          <button
            onClick={() => {
              setUpdateWave(true);
              if (rampIndex === 0) {
                if (rampType === 2) {
                  test.envelopes[envelopeIndex].ramps[0].type = rampTypes[0];
                } else {
                  test.envelopes[envelopeIndex].ramps[0].type = rampTypes[rampType + 1];
                }
              }
              if (rampType === 2) {
                setRampType(0);
              } else {
                setRampType(rampType + 1);
              }
            }}
            className="ui button"
          >
            <i class="angle double right icon"></i>
          </button>
        </div>
        <div id="envelopeValue">
          <input
            type="range"
            min="0"
            max="100"
            value={test ? test.envelopes[envelopeIndex].ramps[rampIndex].value * 100 : 100}
            onChange={(e) => {
              setUpdateEnvelope(true);
              test.envelopes[envelopeIndex].ramps[rampIndex].value = e.target.value / 100;
            }}
          />
          <button
            id="addEnvelope"
            onClick={() => {
              setUpdateEnvelope(true);
              test.addEnvelope(Audio);
              expanded.push(false);
            }}
          >
            <i id="whiteIcon" class="plus icon"></i>
          </button>
        </div>
        <div>
          <input
            id="envelopeTime"
            type="number"
            value={test ? test.envelopes[envelopeIndex].ramps[rampIndex].time * 1000 : 1000}
            onChange={(e) => {
              setUpdateEnvelope(true);
              test.envelopes[envelopeIndex].ramps[rampIndex].time = parseInt(e.target.value) / 1000;
            }}
          />
          <select id="envElem" value={elemTypes[elemType]} onChange={e => {
            setElemType(elemTypes.indexOf(e.target.value));
            setElemIndex(0);
          }}>
            {elemTypes.map((elem) => {
              return <option value={elem}>{elem}</option>;
            })}
          </select>
          <button
            id="subEnvelope"
            onClick={() => {
              if (test.envelopes.length === 1) {
                return;
              }
              test.envelopes.splice(envelopeIndex, 1);
              expanded.splice(envelopeIndex, 1);
              if (envelopeIndex >= 1) {
                setRampType(rampTypes.indexOf(test.envelopes[envelopeIndex - 1].ramps[0].type))
                setEnvelopeIndex(envelopeIndex - 1);
              } else {
                setRampType(rampTypes.indexOf(test.envelopes[0].ramps[0].type))
              }
              setUpdateEnvelope(true);
            }}
          >
            <i id="whiteIcon" class="minus icon"></i>
          </button>
        </div>
        <div>
          <input
            id="envelopeScale"
            type="number"
            value={test ? test.envelopes[envelopeIndex].ramps[rampIndex].scale : 1}
            onChange={(e) => {
              setUpdateEnvelope(true);
              test.envelopes[envelopeIndex].ramps[rampIndex].scale = parseInt(e.target.value);
            }}
          />
          <select id="envIndex"
            value={elemIndex}
            onChange={(e) => {
              setElemIndex(parseInt(e.target.value));
            }}
          >
            {(elemTypes[elemType] === "wave") && test && (
              test.waves.map((wave, index) => {
                return <option value={index}>{index +
                  " - " +
                  (waveIndex === index ? waveTypes[waveType] : wave.type)}</option>
              })
            )}
            {(elemTypes[elemType] === "filter") && test && (
              test.filters.map((filter, index) => {
                return <option value={index}>{index +
                  " - " +
                  (filterIndex === index ? filterTypes[filterType] : filter.type)}</option>
              })
            )}
          </select>
        </div>
        <div id="envelopeParam">
          <button
            id="envelopeLink"
            onClick={() => {
            }}
            className="ui button"
          >
            <i class="exchange alternate icon" />
          </button>
          <button
            id="envelopeUnlink"
            onClick={() => { }}
            className="ui button"
          >
            <i class="unlink icon" />
          </button>
          {(elemTypes[elemType] === "wave") && (
            <select id="envParam"
              value={waveParams[waveParam]}
              onChange={(e) => {
                setWaveParam(parseInt(e.target.value));
              }}
            >
              {waveParams.map((params, index) => {
                return <option value={index}>{params}</option>
              })}
            </select>
          )}
          {(elemTypes[elemType] === "filter") && (
            <select id="envParam"
              value={filterParams[filterParam]}
              onChange={(e) => {
                setFilterParam(parseInt(e.target.value));
              }}
            >
              {filterParams.map((params, index) => {
                return <option value={index}>{params}</option>
              })}
            </select>
          )}
        </div>
        <div id="envelopeContainer">
          {test ? (
            test.envelopes.map((env, index) => {
              return (
                <div>
                  <div id={index === envelopeIndex ? "selectedEnvelope" : "envelope"}
                    onClick={() => {
                      if (index === envelopeIndex) {
                        return;
                      }
                      setRampType(rampTypes.indexOf(env.ramps[0].type));
                      setEnvelopeIndex(index);
                      setUpdateEnvelope(true);
                    }}
                    className="ui segment"
                  >
                    {(expanded[index] === true) ? (
                      <div id="minimizeButton"
                        onClick={() => {
                          expanded[index] = false;
                          setFlicker(!flicker);
                        }}><i class="angle down large icon"></i></div>) : (
                        <div id="expandButton"
                          onClick={() => {
                            expanded[index] = true;
                            setFlicker(!flicker);
                          }}><i class="angle up large icon"></i></div>
                      )}
                    {index + " - " + env.ramps[0].type}
                    {(expanded[index] === true) ? (
                      <div id="addRampBelow" onClick={() => {
                        env.addRamp("const", env.initialValue, 0.33, 1, false, [], 0);
                        setRampIndex(0);
                        setUpdateEnvelope(true);
                      }}><i class="plus large icon"></i></div>
                    ) : <div></div>}
                  </div>
                  {
                    (expanded[index] === true) ? (env.ramps.map((ramp, rindex) => {
                      return (
                        <div id={ramp.hold ? "holdRamp" : rindex === rampIndex ? "selectedRamp" : "ramp"}
                          onClick={() => {
                            setUpdateEnvelope(true);
                            if (rindex === rampIndex && !isRemoving) {
                              for (let i = 0; i < env.ramps.length; i++) {
                                env.ramps[i].hold = false;
                              }
                              ramp.hold = true;
                              return;
                            }
                            setRampType(rampTypes.indexOf(ramp.type));
                            setRampIndex(Math.min(rindex, env.ramps.length - 1));
                            setEnvelopeIndex(index);
                            if (isRemoving) {
                              isRemoving = false;
                              setRampType(rampTypes.indexOf(env.ramps[Math.min(rindex, env.ramps.length - 1)].type));
                            }
                          }}
                          className="ui segment"
                        >
                          {rindex + " - " + (rampIndex === rindex ? rampTypes[rampType] : ramp.type)}
                          <div id="addRampBelow" onClick={() => {
                            env.addRamp("const", ramp.value, 0.33, 1, false, [], rindex + 1);
                            setUpdateEnvelope(true);
                          }}><i class="plus large icon"></i></div>
                          <div id="removeRamp" onClick={() => {
                            if (env.ramps.length === 1) {
                              return;
                            }
                            env.ramps.splice(rindex, 1);
                            setUpdateEnvelope(true);
                            isRemoving = true;
                          }}><i class="minus large icon"></i></div>
                        </div>
                      );
                    })) : <div></div>
                  }
                </div>
              )
            })) : <div></div>}
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
    </div >
  );
}
