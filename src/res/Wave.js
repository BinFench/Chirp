class Wave {
  constructor(audio, type = "sine", real = [], imag = [], pitchBend = 0) {
    this.audio = audio;
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
    this.gain = 1;
    this.real = real;
    this.imag = imag;
    this.oscillatorNode.type = this.type;
    this.pitchBend = pitchBend;

    this.oscillatorNode.connect(this.oscillatorGainNode);
    this.oscillatorNode.start();
  }

  play(freq) {
    this.oscillatorNode.frequency.setValueAtTime(
      (freq + this.detune) * Math.pow(0.5, this.pitchBend),
      this.audio.context.currentTime
    );
    this.oscillatorGainNode.gain.setValueAtTime(
      this.gain,
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
  }
}

export default Wave;
