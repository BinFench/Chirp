import Wave from "../res/Wave";

class Instrument {
  constructor() {
    this.waves = [];
    this.gain = 1;
    this.instancePlaying = [];
    this.instanceFreq = [];
    this.pitchBend = 0;
  }

  addWave(audio, type = "sine", real = [], imag = []) {
    this.waves.push(new Wave(audio, type, real, imag, this.pitchBend));
    this.waves[this.waves.length - 1].remove();
  }

  play(freq) {
    let waves = [];
    for (let i = 0; i < this.waves.length; i++) {
      let wave = new Wave(
        this.waves[i].audio,
        this.waves[i].type,
        this.waves[i].real,
        this.waves[i].imag,
        this.pitchBend
      );
      wave.detune = this.waves[i].detune;
      wave.detuneType = this.waves[i].detuneType;
      wave.play(freq);
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
