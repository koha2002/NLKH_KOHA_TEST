import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("public/tool-modules/comtrade/comtrade-core.js", "utf8");
vm.runInThisContext(source, { filename: "comtrade-core.js" });

const core = globalThis.ComtradeCore;
assert.ok(core, "COMTRADE core must be exposed on globalThis");

function cfgText(format) {
  return [
    "STATION,DEVICE,2013",
    "2,1A,1D",
    "1,IA,A,CB1,A,0.5,1,0,-32768,32767,1,1,P",
    "1,TRIP,,,0",
    "50",
    "1",
    "1000,2",
    "01/01/2025,00:00:00.000000",
    "01/01/2025,00:00:00.000000",
    format,
    "1",
  ].join("\n");
}

function binaryRecord(format) {
  const analogBytes = format === "BINARY" ? 2 : 4;
  const rowBytes = 8 + analogBytes + 2;
  const buffer = new ArrayBuffer(rowBytes * 2);
  const view = new DataView(buffer);

  [10, 20].forEach((analog, row) => {
    let offset = row * rowBytes;
    view.setUint32(offset, row + 1, true);
    offset += 4;
    view.setUint32(offset, row * 1000, true);
    offset += 4;

    if (format === "BINARY") view.setInt16(offset, analog, true);
    else if (format === "BINARY32") view.setInt32(offset, analog, true);
    else view.setFloat32(offset, analog, true);
    offset += analogBytes;

    view.setUint16(offset, row === 0 ? 1 : 0, true);
  });
  return buffer;
}

const asciiCfg = core.parseCfg(cfgText("ASCII"));
const asciiBytes = new TextEncoder().encode("1,0,10,1\n2,1000,20,0");
const ascii = core.parseDat(asciiBytes.buffer, asciiCfg);
assert.deepEqual(ascii.analogData[0], [6, 11]);
assert.deepEqual(ascii.digitalData[0], [1, 0]);
assert.equal(core.duration(ascii.timestamps), 0.001);

for (const format of ["BINARY", "BINARY32", "FLOAT32"]) {
  const cfg = core.parseCfg(cfgText(format));
  const parsed = core.parseDat(binaryRecord(format), cfg);
  assert.deepEqual(parsed.analogData[0], [6, 11]);
  assert.deepEqual(parsed.digitalData[0], [1, 0]);
  assert.equal(parsed.sampleNumbers.length, 2);
}

console.log("COMTRADE parser tests passed: ASCII, BINARY, BINARY32, FLOAT32");
