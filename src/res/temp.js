let stopPoint = 0;
let average = 0;
let max = 0;
let min = 10;
let maxIndex = 0;
let minIndex = 0;
for (let i = 0; i < 19980; i++) {
  if (max <= freqResp[i]) {
    max = freqResp[i];
    maxIndex = i;
  }
  if (min > freqResp[i]) {
    min = freqResp[i];
    minIndex = 0;
  }
  if (freqResp[i] < 0.1 && stopPoint === 0) {
    stopPoint = i;
  }
}
if (stopPoint === 0) {
  stopPoint = minIndex;
}
minIndex = Math.min(stopPoint, maxIndex);
maxIndex = Math.max(stopPoint, maxIndex);
if (minIndex >= 200) {
  minIndex -= 200;
} else {
  minIndex = 0;
}
if (maxIndex < 19780) {
  maxIndex += 200;
} else {
  maxIndex = 19979;
}
for (let i = 0; i < 19980; i++) {
  average += freqResp[i] / 19980;
}
max = (max / average) * 50;
for (let i = 0; i < 200; i++) {
  if (max <= 100) {
    freqResp[Math.round(((maxIndex - minIndex) / 200) * i + minIndex)] =
      (freqResp[Math.round(((maxIndex - minIndex) / 200) * i + minIndex)] /
        average) *
      50;
  } else {
    freqResp[Math.round(((maxIndex - minIndex) / 200) * i + minIndex)] =
      (((freqResp[Math.round(((maxIndex - minIndex) / 200) * i + minIndex)] /
        average) *
        50) /
        (max + 5)) *
      100;
  }
}

filterctx.fillStyle = "rgb(0, 0, 0)";
filterctx.fillRect(0, 0, filterWidth, filterHeight);
for (var i = 0; i < 200; i++) {
  filterctx.fillStyle = "rgb(255, 0, 0)";
  filterctx.fillRect(
    i,
    100 - freqResp[Math.round(((maxIndex - minIndex) / 200) * i + minIndex)],
    1,
    freqResp[Math.round(((maxIndex - minIndex) / 200) * i + minIndex)]
  );
}
console.log("(" + minIndex + ", " + maxIndex + ")");
