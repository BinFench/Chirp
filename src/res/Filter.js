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
    this.filter.frequency.value = freq;
    this.freq = freq;
    this.filter.detune.value = detune;
    this.detune = detune;
    this.filter.Q.value = Q;
    this.Q = Q;
    this.filter.gain.value = gain;
    this.gain = gain;
  }

  remove() {
    this.filter.disconnect();
  }
}

export default Filter;
