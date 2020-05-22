import Wave from "./Wave";
import Filter from "./Filter";
import Envelope from "./Envelope";

class Instrument {
  constructor() {
    this.waves = [];
    this.filters = [];
    this.filtersUsed = [];
    this.envelopes = [];
    this.envelopesUsedWaves = [];
    this.envelopesUsedFilters = [];
    this.gain = 1;
    this.instancePlaying = [];
    this.instanceFreq = [];
    this.pitchBend = 0;
  }

  addWave(audio, gain = 1, type = "sine", real = [], imag = []) {
    this.waves.push(
      new Wave(audio, this.waves.length, gain, type, real, imag, this.pitchBend)
    );
    this.waves[this.waves.length - 1].remove();
    this.filtersUsed.push([-1]);
    this.envelopesUsedWaves.push([-1]);
  }

  addFilter(
    audio,
    freq = 1000,
    type = "lowpass",
    detune = 0,
    Q = 1,
    gain = 25
  ) {
    this.filters.push(new Filter(audio, freq, type, detune, Q, gain));
    this.filters[this.filters.length - 1].remove();
    this.envelopesUsedFilters.push([-1]);
  }

  addEnvelope(audio) {
    this.envelopes.push(new Envelope(audio));
  }

  play(freq, velocity) {
    let waves = [];
    for (let i = 0; i < this.waves.length; i++) {
      let wave = new Wave(
        this.waves[i].audio,
        i,
        this.waves[i].gain,
        this.waves[i].type,
        this.waves[i].real,
        this.waves[i].imag,
        this.pitchBend,
        this.filters,
        this.filtersUsed
      );
      wave.detune = this.waves[i].detune;
      wave.detuneType = this.waves[i].detuneType;
      wave.play(freq, velocity);
      waves.push(wave);
    }
    this.instancePlaying.push(waves);
    this.instanceFreq.push(freq);
  }

  pause(freq) {
    let index = this.instanceFreq.indexOf(freq);
    let waves = this.instancePlaying[index];
    for (let i = 0; i < waves.length; i++) {
      waves[i].pause();
      waves[i].remove();
    }
    this.instancePlaying.splice(index, 1);
    this.instanceFreq.splice(index, 1);
  }

  bend(freq) {
    this.pitchBend = freq;
    for (let i = 0; i < this.instancePlaying.length; i++) {
      for (let j = 0; j < this.instancePlaying[i].length; j++) {
        let baseFreq =
          this.instancePlaying[i][j].oscillatorNode.frequency.value /
          Math.pow(0.5, this.instancePlaying[i][j].pitchBend) -
          this.instancePlaying[i][j].detune;
        this.instancePlaying[i][j].pitchBend = freq;
        this.instancePlaying[i][j].oscillatorNode.frequency.setValueAtTime(
          (baseFreq + this.instancePlaying[i][j].detune) * Math.pow(0.5, freq),
          this.instancePlaying[i][j].audio.context.currentTime
        );
      }
    }
  }
}

export default Instrument;
