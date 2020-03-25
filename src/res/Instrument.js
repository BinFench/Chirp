import Wave from "../res/Wave";

class Instrument {
  constructor() {
    this.waves = [];
    this.gain = 1;
    this.instancePlaying = [];
    this.instanceFreq = [];
  }

  addWave(audio, type = "sine", real = [], imag = []) {
    this.waves.push(new Wave(audio, type, real, imag));
    this.waves[this.waves.length - 1].remove();
  }

  play(freq) {
    let waves = [];
    for (let i = 0; i < this.waves.length; i++) {
      let wave = new Wave(
        this.waves[i].audio,
        this.waves[i].type,
        this.waves[i].real,
        this.waves[i].imag
      );
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
}

export default Instrument;
