class Filter {
  constructor(
    audio,
    freq = 1000,
    type = "lowpass",
    detune = 0,
    Q = 1,
    gain = 25
  ) {
    this.audio = audio;
    this.filter = audio.context.createBiquadFilter();
    this.filter.type = type;
    this.type = type;
    this.filter.frequency.setValueAtTime(freq, audio.context.currentTime);
    this.freq = freq;
    this.filter.detune.setValueAtTime(detune, audio.context.currentTime);
    this.detune = detune;
    this.filter.Q.setValueAtTime(Q, audio.context.currentTime);
    this.Q = Q;
    this.filter.gain.setValueAtTime(gain, audio.context.currentTime);
    this.gain = gain;
  }

  remove() {
    this.filter.disconnect();
  }
}

export default Filter;
