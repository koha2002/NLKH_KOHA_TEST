(function initComtradeCore(global) {
  "use strict";

  const FORMATS = new Set(["ASCII", "BINARY", "BINARY32", "FLOAT32"]);

  function number(value, fallback = 0) {
    const parsed = Number.parseFloat(String(value ?? "").trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function integer(value, fallback = 0) {
    const parsed = Number.parseInt(String(value ?? "").replace(/[^0-9+-]/g, ""), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function requiredLine(lines, index, label) {
    if (index >= lines.length) throw new Error(`CFG thiếu dòng ${label}.`);
    return lines[index];
  }

  function decodeCfg(buffer, encoding = "auto") {
    const source = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
    if (!(source instanceof Uint8Array)) throw new Error("Dữ liệu CFG không hợp lệ.");

    if (encoding !== "auto") {
      return new TextDecoder(encoding).decode(source).replace(/^\uFEFF/, "");
    }

    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(source).replace(/^\uFEFF/, "");
    } catch {
      return new TextDecoder("gb18030").decode(source).replace(/^\uFEFF/, "");
    }
  }

  function parseTimestamp(value) {
    const text = String(value || "").trim();
    const [datePart = "", timePart = ""] = text.split(",");
    return { raw: text, date: datePart, time: timePart };
  }

  function parseCfg(text) {
    const lines = String(text)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 6) throw new Error("Tệp CFG quá ngắn hoặc không đúng chuẩn COMTRADE.");

    const header = requiredLine(lines, 0, "thông tin trạm").split(",");
    const counts = requiredLine(lines, 1, "số lượng kênh").split(",");
    const analogCount = integer(counts[1]);
    const digitalCount = integer(counts[2]);
    const totalChannels = integer(counts[0], analogCount + digitalCount);

    if (analogCount < 0 || digitalCount < 0 || analogCount + digitalCount > 10000) {
      throw new Error("Số lượng kênh trong CFG không hợp lệ.");
    }

    const cfg = {
      station: (header[0] || "—").trim(),
      deviceId: (header[1] || "—").trim(),
      revision: (header[2] || "1991").trim(),
      totalChannels,
      analogCount,
      digitalCount,
      analogs: [],
      digitals: [],
      frequency: 0,
      sampleRates: [],
      startTimestamp: { raw: "", date: "", time: "" },
      triggerTimestamp: { raw: "", date: "", time: "" },
      format: "ASCII",
      timeMultiplier: 1,
    };

    let cursor = 2;
    for (let index = 0; index < analogCount; index += 1) {
      const fields = requiredLine(lines, cursor, `kênh analog ${index + 1}`).split(",");
      cfg.analogs.push({
        index,
        id: (fields[0] || String(index + 1)).trim(),
        name: (fields[1] || `A${index + 1}`).trim(),
        phase: (fields[2] || "").trim(),
        circuit: (fields[3] || "").trim(),
        unit: (fields[4] || "").trim(),
        a: number(fields[5], 1),
        b: number(fields[6], 0),
        skew: number(fields[7], 0),
        min: number(fields[8], 0),
        max: number(fields[9], 0),
        primary: number(fields[10], 1),
        secondary: number(fields[11], 1),
        primarySecondary: (fields[12] || "").trim(),
      });
      cursor += 1;
    }

    for (let index = 0; index < digitalCount; index += 1) {
      const fields = requiredLine(lines, cursor, `kênh digital ${index + 1}`).split(",");
      cfg.digitals.push({
        index,
        id: (fields[0] || String(index + 1)).trim(),
        name: (fields[1] || `D${index + 1}`).trim(),
        phase: (fields[2] || "").trim(),
        circuit: (fields[3] || "").trim(),
        normalState: integer(fields[4], 0),
      });
      cursor += 1;
    }

    cfg.frequency = number(requiredLine(lines, cursor, "tần số"), 0);
    cursor += 1;

    const rateCount = integer(requiredLine(lines, cursor, "số dải lấy mẫu"), 0);
    cursor += 1;
    for (let index = 0; index < rateCount; index += 1) {
      const fields = requiredLine(lines, cursor, `dải lấy mẫu ${index + 1}`).split(",");
      cfg.sampleRates.push({ rate: number(fields[0], 0), endSample: integer(fields[1], 0) });
      cursor += 1;
    }

    cfg.startTimestamp = parseTimestamp(requiredLine(lines, cursor, "thời điểm bắt đầu"));
    cursor += 1;
    cfg.triggerTimestamp = parseTimestamp(requiredLine(lines, cursor, "thời điểm sự cố"));
    cursor += 1;

    const format = requiredLine(lines, cursor, "định dạng DAT").toUpperCase().trim();
    cfg.format = FORMATS.has(format) ? format : format.includes("BINARY32") ? "BINARY32" : format.includes("FLOAT32") ? "FLOAT32" : format.includes("BINARY") ? "BINARY" : "ASCII";
    cursor += 1;

    if (cursor < lines.length) cfg.timeMultiplier = number(lines[cursor], 1) || 1;
    return cfg;
  }

  function sampleTime(sampleNumber, cfg) {
    if (!cfg.sampleRates.length) return 0;
    let firstSample = 1;
    let elapsed = 0;
    for (const segment of cfg.sampleRates) {
      if (segment.rate <= 0) continue;
      if (sampleNumber <= segment.endSample) {
        return elapsed + Math.max(0, sampleNumber - firstSample) / segment.rate;
      }
      elapsed += Math.max(0, segment.endSample - firstSample + 1) / segment.rate;
      firstSample = segment.endSample + 1;
    }
    const last = cfg.sampleRates[cfg.sampleRates.length - 1];
    return elapsed + (last.rate > 0 ? Math.max(0, sampleNumber - firstSample) / last.rate : 0);
  }

  function scaledTime(rawTimestamp, sampleNumber, cfg) {
    if (rawTimestamp > 0) return (rawTimestamp * cfg.timeMultiplier) / 1_000_000;
    return sampleTime(sampleNumber, cfg);
  }

  function createDataArrays(cfg) {
    return {
      sampleNumbers: [],
      timestamps: [],
      analogData: Array.from({ length: cfg.analogCount }, () => []),
      digitalData: Array.from({ length: cfg.digitalCount }, () => []),
    };
  }

  function parseAscii(buffer, cfg) {
    const result = createDataArrays(cfg);
    const text = new TextDecoder("utf-8").decode(buffer);
    const lines = text.split(/\r?\n/).filter((line) => line.trim());

    for (const line of lines) {
      const columns = line.split(",");
      const minimum = 2 + cfg.analogCount + cfg.digitalCount;
      if (columns.length < minimum) continue;
      const sampleNumber = integer(columns[0], result.sampleNumbers.length + 1);
      const rawTimestamp = number(columns[1], 0);
      result.sampleNumbers.push(sampleNumber);
      result.timestamps.push(scaledTime(rawTimestamp, sampleNumber, cfg));

      let column = 2;
      for (let index = 0; index < cfg.analogCount; index += 1) {
        const raw = number(columns[column], 0);
        result.analogData[index].push(raw * cfg.analogs[index].a + cfg.analogs[index].b);
        column += 1;
      }
      for (let index = 0; index < cfg.digitalCount; index += 1) {
        result.digitalData[index].push(integer(columns[column], 0) ? 1 : 0);
        column += 1;
      }
    }
    return result;
  }

  function parseBinary(buffer, cfg) {
    const result = createDataArrays(cfg);
    const view = new DataView(buffer);
    const bytesPerAnalog = cfg.format === "BINARY" ? 2 : 4;
    const digitalWords = Math.ceil(cfg.digitalCount / 16);
    const rowSize = 8 + cfg.analogCount * bytesPerAnalog + digitalWords * 2;
    if (rowSize <= 8 || buffer.byteLength < rowSize) throw new Error("Tệp DAT không đủ dữ liệu cho cấu trúc trong CFG.");

    const rowCount = Math.floor(buffer.byteLength / rowSize);
    for (let row = 0; row < rowCount; row += 1) {
      let offset = row * rowSize;
      const sampleNumber = view.getUint32(offset, true);
      offset += 4;
      const rawTimestamp = view.getUint32(offset, true);
      offset += 4;
      result.sampleNumbers.push(sampleNumber);
      result.timestamps.push(scaledTime(rawTimestamp, sampleNumber, cfg));

      for (let index = 0; index < cfg.analogCount; index += 1) {
        let raw;
        if (cfg.format === "BINARY") raw = view.getInt16(offset, true);
        else if (cfg.format === "BINARY32") raw = view.getInt32(offset, true);
        else raw = view.getFloat32(offset, true);
        offset += bytesPerAnalog;
        result.analogData[index].push(raw * cfg.analogs[index].a + cfg.analogs[index].b);
      }

      let digitalIndex = 0;
      for (let wordIndex = 0; wordIndex < digitalWords; wordIndex += 1) {
        const word = view.getUint16(offset, true);
        offset += 2;
        for (let bit = 0; bit < 16 && digitalIndex < cfg.digitalCount; bit += 1) {
          result.digitalData[digitalIndex].push((word >> bit) & 1);
          digitalIndex += 1;
        }
      }
    }
    return result;
  }

  function parseDat(buffer, cfg) {
    if (!(buffer instanceof ArrayBuffer)) throw new Error("Dữ liệu DAT không hợp lệ.");
    const parsed = cfg.format === "ASCII" ? parseAscii(buffer, cfg) : parseBinary(buffer, cfg);
    if (!parsed.timestamps.length) throw new Error("Không tìm thấy mẫu dữ liệu hợp lệ trong DAT.");
    return parsed;
  }

  function duration(timestamps) {
    if (!timestamps.length) return 0;
    let min = timestamps[0];
    let max = timestamps[0];
    for (let index = 1; index < timestamps.length; index += 1) {
      if (timestamps[index] < min) min = timestamps[index];
      if (timestamps[index] > max) max = timestamps[index];
    }
    return max - min;
  }

  global.ComtradeCore = Object.freeze({ decodeCfg, parseCfg, parseDat, duration });
})(typeof window !== "undefined" ? window : globalThis);
