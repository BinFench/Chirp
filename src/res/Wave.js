class Wave {
  constructor(audio, type = "sine", real = [], imag = []) {
    this.audio = audio;
    this.oscillatorGainNode = audio.context.createGain();
    this.oscillatorGainNode.gain.setValueAtTime(1, audio.context.currentTime);
    this.oscillatorGainNode.connect(audio.masterGainNode);

    this.oscillatorNode = audio.context.createOscillator();

    if (type === "custom") {
      var wave = audio.context.createPeriodicWave(real, imag);
      this.oscillatorNode.setPeriodicWave(wave);
    }

    this.detune = 0;
    this.detuneType = "hz";
    this.type = type;
    this.gain = 1;
    this.oscillatorNode.type = this.type;

    this.oscillatorNode.connect(this.oscillatorGainNode);
    this.oscillatorNode.start();
  }

  play(freq) {
    this.oscillatorNode.frequency.setValueAtTime(
      freq + this.detune,
      this.audio.context.currentTime
    );
    this.audio.masterGainNode.gain.setTargetAtTime(
      this.gain,
      this.audio.context.currentTime,
      0.001
    );
  }

  pause() {
    this.audio.masterGainNode.gain.setTargetAtTime(
      0,
      this.audio.context.currentTime,
      0.001
    );
  }

  stop() {
    this.oscillatorNode.stop();
  }

  remove() {
    this.oscillatorNode.disconnect();
  }
}

export default Wave;
