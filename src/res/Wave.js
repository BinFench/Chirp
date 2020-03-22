class Wave {
  constructor(audio, type = "sine", real = [], imag = []) {
    const oscillatorGainNode = audio.context.createGain();
    oscillatorGainNode.gain.setValueAtTime(1, audio.context.currentTime);
    oscillatorGainNode.connect(audio.masterGainNode);

    const oscillatorNode = Audio.context.createOscillator();

    if (type === "custom") {
      var wave = audio.context.createPeriodicWave(real, imag);
      oscillatorNode.setPeriodicWave(wave);
    }

    this.osc = {
      oscillatorNode: oscillatorNode,
      oscillatorGainNode: oscillatorGainNode,
      detune: 0,
      detuneType: "hz",
      type: type,
      gain: 1
    };

    oscillatorNode.connect(oscillatorGainNode);
  }

  play() {
    this.osc.oscillatorNode.start();
  }

  pause() {
    this.osc.oscillatorNode.stop();
  }

  remove() {
    this.osc.oscillatorNode.disconnect();
  }
}
