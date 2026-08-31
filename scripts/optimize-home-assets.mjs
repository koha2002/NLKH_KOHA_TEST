import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const logoInputPath = path.join(root, "public", "koha-logo.png");
const logoOutputPath = path.join(root, "public", "koha-logo-320.webp");
const faviconPath = path.join(root, "public", "favicon.png");

function kb(bytes) {
  return (bytes / 1024).toFixed(1);
}

if (!fs.existsSync(logoInputPath)) {
  throw new Error("Missing public/koha-logo.png");
}

const logoInput = fs.readFileSync(logoInputPath);
const logoSourceMeta = await sharp(logoInput).metadata();
const logoOutput = await sharp(logoInput)
  .rotate()
  .resize(320, 320, {
    fit: "cover",
    position: "centre",
    withoutEnlargement: true,
  })
  .webp({
    lossless: true,
    effort: 6,
    alphaQuality: 100,
  })
  .toBuffer();

if (logoOutput.length < 512) {
  throw new Error("Generated logo derivative is unexpectedly small.");
}

fs.writeFileSync(logoOutputPath, logoOutput);
const logoOutputMeta = await sharp(logoOutput).metadata();
const logoReduction = 100 - (logoOutput.length / logoInput.length) * 100;

console.log(
  `[HOME-ASSET] Logo ${logoSourceMeta.width}x${logoSourceMeta.height} ${logoInput.length}B -> ` +
  `${logoOutputMeta.width}x${logoOutputMeta.height} ${logoOutput.length}B (-${logoReduction.toFixed(1)}%)`
);

if ((logoOutputMeta.width || 0) > 320 || (logoOutputMeta.height || 0) > 320) {
  throw new Error("Logo derivative exceeds 320px.");
}

if (logoInput.length > 200000 && logoReduction < 65) {
  throw new Error(`Logo reduction only ${logoReduction.toFixed(1)}%; expected >=65%.`);
}

if (!fs.existsSync(faviconPath)) {
  console.warn("[HOME-ASSET] Favicon skipped: public/favicon.png missing.");
} else {
  const faviconInput = fs.readFileSync(faviconPath);
  const faviconSourceMeta = await sharp(faviconInput).metadata();

  const candidate = await sharp(faviconInput, {
    animated: false,
    density: 192,
  })
    .rotate()
    .resize(128, 128, {
      fit: "contain",
      position: "centre",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      withoutEnlargement: true,
    })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
    })
    .toBuffer();

  const faviconOutput =
    candidate.length >= 256 && candidate.length < faviconInput.length
      ? candidate
      : faviconInput;

  fs.writeFileSync(faviconPath, faviconOutput);

  const faviconOutputMeta = await sharp(faviconOutput).metadata();
  const faviconReduction = faviconInput.length
    ? 100 - (faviconOutput.length / faviconInput.length) * 100
    : 0;

  console.log(
    `[HOME-ASSET] Favicon ${faviconSourceMeta.width}x${faviconSourceMeta.height} ${faviconInput.length}B -> ` +
    `${faviconOutputMeta.width}x${faviconOutputMeta.height} ${faviconOutput.length}B (-${faviconReduction.toFixed(1)}%)`
  );

  if ((faviconOutputMeta.width || 0) > 128 || (faviconOutputMeta.height || 0) > 128) {
    throw new Error("Favicon output exceeds 128px.");
  }

  if (faviconInput.length > 80000 && faviconReduction < 60) {
    throw new Error(
      `Favicon reduction only ${faviconReduction.toFixed(1)}%; expected >=60%.`
    );
  }
}

console.log(
  `[HOME-ASSET] PASS logo=${kb(logoOutput.length)}KB favicon=` +
  `${fs.existsSync(faviconPath) ? kb(fs.statSync(faviconPath).size) + "KB" : "missing"}`
);
