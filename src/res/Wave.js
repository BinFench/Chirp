import Filter from "./Filter";

function MIDItoHz(MIDI) {
  return 440 * Math.pow(2, (MIDI - 69) / 12);
}

function HztoMIDI(freq) {
  return Math.round(12 * (Math.log(freq / 440) / Math.log(2)) + 69);
}

class Wave {
  constructor(
    audio,
    index,
    gain = 1,
    type = "sine",
    real = [],
    imag = [],
    pitchBend = 0,
    filters = [],
    filtersUsed = []
  ) {
    this.audio = audio;
    this.filters = [];
    this.oscillatorGainNode = audio.context.createGain();
    this.oscillatorGainNode.gain.setValueAtTime(0, audio.context.currentTime);
    this.oscillatorGainNode.connect(audio.masterGainNode);
    this.oscillatorNode = audio.context.createOscillator();

    if (type === "custom") {
      var wave = audio.context.createPeriodicWave(real, imag);
      this.oscillatorNode.setPeriodicWave(wave);
    }

    this.detune = 0;
    this.detuneType = "hz";
    this.type = type;
    this.gain = gain;
    this.real = real;
    this.imag = imag;
    this.oscillatorNode.type = this.type;
    this.pitchBend = pitchBend;
    if (
      filtersUsed.length < index ||
      filtersUsed.length === 0 ||
      filtersUsed[index][0] === -1
    ) {
      this.oscillatorNode.connect(this.oscillatorGainNode);
    } else {
      for (let i = 0; i < filtersUsed[index].length; i++) {
        let filter = filters[filtersUsed[index][i]];
        this.filters.push(
          new Filter(
            audio,
            filter.freq,
            filter.type,
            filter.detune,
            filter.Q,
            filter.gain
          )
        );
        this.oscillatorNode.connect(this.filters[i].filter);
        this.filters[i].filter.connect(this.oscillatorGainNode);
      }
    }

    this.oscillatorNode.start();
  }

  play(freq, velocity) {
    let frequency = freq;
    if (this.detuneType === "cents") {
      let detune = (this.detune / 100) * 12;
      frequency =
        MIDItoHz(HztoMIDI(frequency) + this.detune) *
        Math.pow(0.5, this.pitchBend);
    } else if (this.detuneType === "semitones") {
      frequency =
        MIDItoHz(HztoMIDI(frequency) + this.detune) *
        Math.pow(0.5, this.pitchBend);
    } else {
      frequency = (frequency + this.detune) * Math.pow(0.5, this.pitchBend);
    }
    this.oscillatorNode.frequency.setValueAtTime(
      frequency,
      this.audio.context.currentTime
    );
    this.oscillatorGainNode.gain.setValueAtTime(
      this.gain, // * velocity,
      this.audio.context.currentTime
    );
  }

  pause() {
    this.oscillatorGainNode.gain.setValueAtTime(
      0,
      this.audio.context.currentTime
    );
  }

  stop() {
    this.oscillatorNode.stop();
  }

  remove() {
    this.oscillatorNode.disconnect();
    for (let i = 0; i < this.filters.length; i++) {
      this.filters[i].filter.disconnect();
    }
    this.oscillatorGainNode.disconnect();
  }
}

export default Wave;
