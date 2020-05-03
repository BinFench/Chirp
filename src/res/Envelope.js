function isEquivalent(a, b) {
  var aProps = Object.getOwnPropertyNames(a);
  var bProps = Object.getOwnPropertyNames(b);

  if (aProps.length !== bProps.length) {
    return false;
  }

  for (var i = 0; i < aProps.length; i++) {
    var propName = aProps[i];
    if (a[propName] !== b[propName]) {
      return false;
    }
  }

  return true;
}

class Ramp {
  constructor(
    type = "linear",
    value = 1,
    time = 0.33,
    scale = 1,
    hold = false,
    values = []
  ) {
    this.type = type;
    this.value = value;
    this.time = time;
    this.scale = scale;
    this.hold = hold;
    this.values = values;
  }
}

class Tag {
  constructor(type, index, parameter) {
    this.type = type;
    this.index = index;
    this.parameter = parameter;
  }
}

class Envelope {
  constructor(audio, initialValue = 0) {
    this.audio = audio;
    this.ramps = [
      new Ramp(),
      new Ramp("const", 1, 0.34, 1, true),
      new Ramp("linear", 0),
    ];
    this.params = [];
    this.tags = [];
    this.initialValue = initialValue;
  }

  addRamp(
    type = "linear",
    value = 1,
    time = 0.33,
    scale = 1,
    hold = false,
    values = [],
    index = -1
  ) {
    if (index === -1) {
      this.ramps.push(new Ramp(type, value, time, scale, hold, values));
    } else {
      this.ramps.splice(index, 0, new Ramp(type, value, time, scale, hold, values));
    }
  }

  link(type, index, parameter) {
    let newTag = new Tag(type, index, parameter);
    for (let i = 0; i < this.tags.length; i++) {
      if (isEquivalent(newTag, this.tags[i])) {
        return;
      }
    }
    this.tags.push(newTag);
  }

  unlink(type, index, parameter) {
    let compTag = new Tag(type, index, parameter);
    for (let i = 0; i < this.tags.length; i++) {
      if (isEquivalent(compTag, this.tags[i])) {
        this.tags.splice(i, 1);
      }
    }
  }

  play() {
    for (let j = 0; j < this.params.length; j++) {
      let totalTime = 0;
      let param = this.params[j];
      this.param.setValueAtTime(this.initialValue * this.ramps[0].scale);
      for (let i = 0; i < this.ramps.length; i++) {
        let ramp = this.ramps[i];
        switch (ramp.type) {
          case "linear":
            param.linearRampToValueAtTime(
              ramp.value * ramp.scale,
              this.audio.context.currentTime + ramp.time
            );
            break;
          case "exponential":
            param.exponentialRampToValueAtTime(
              ramp.value * ramp.scale,
              this.audio.context.currentTime + ramp.time
            );
            break;
          case "curve":
            param.setValueCurveAtTime(
              ramp.value * ramp.scale,
              this.audio.context.currentTime + totalTime,
              ramp.time
            );
            break;
          case "const":
            param.setValueAtTime(
              ramp.value * ramp.scale,
              this.audio.context.currentTime + totalTime + ramp.time
            );
            break;
          default:
            break;
        }
        totalTime += ramp.time;
        if (ramp.hold) {
          break;
        }
      }
    }

  }

  release() {
    for (let j = 0; j < this.params.length; j++) {
      let param = this.params[j];
      let isRelease = false;
      let totalTime = 0;
      for (let i = 0; i < this.ramps.length; i++) {
        let ramp = this.ramps[i];
        if (ramp.hold) {
          isRelease = true;
          continue;
        }
        if (isRelease) {
          switch (ramp.type) {
            case "linear":
              param.linearRampToValueAtTime(
                ramp.value * ramp.scale,
                this.audio.context.currentTime + ramp.time
              );
              break;
            case "exponential":
              param.exponentialRampToValueAtTime(
                ramp.value * ramp.scale,
                this.audio.context.currentTime + ramp.time
              );
              break;
            case "curve":
              param.setValueCurveAtTime(
                ramp.value * ramp.scale,
                this.audio.context.currentTime + totalTime,
                ramp.time
              );
              break;
            case "const":
              param.setValueAtTime(
                ramp.value * ramp.scale,
                this.audio.context.currentTime + totalTime + ramp.time
              );
              break;
            default:
              break;
          }
          totalTime += ramp.time;
        }
      }
    }
  }

}

export default Envelope;