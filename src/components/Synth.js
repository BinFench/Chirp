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
  const waveWidth = 190;
  const waveHeight = 100;
  const filterWidth = 200;
  const filterHeight = 100;
  const audioWidth = 256;
  const audioHeight = 256;
  const waveTypes = ["sine", "square", "sawtooth", "triangle"];
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
  const filterCanvas = React.useRef("filter");
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
  const [waveIndex, setWaveIndex] = useState(0);
  const [filterIndex, setFilterIndex] = useState(0);
  const [flicker, setFlicker] = useState(false);
  const [updateWave, setUpdateWave] = useState(false);
  const [updateFilter, setUpdateFilter] = useState(false);

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
      setTimeout(() => {
        drawWave();
        drawFilter();
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
