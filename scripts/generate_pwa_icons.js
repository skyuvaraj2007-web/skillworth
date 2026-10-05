const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function makeCrcTable() {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return table;
}

const crcTable = makeCrcTable();
function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crcData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const c = crc32(crcData);
  buf.writeUInt32BE(c, 8 + len);
  return buf;
}

function generatePng(width, height, drawFn) {
  const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = createChunk('IHDR', ihdrData);

  const stride = width * 4;
  const rawData = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const idat = createChunk('IDAT', zlib.deflateSync(rawData));
  const iend = createChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([header, ihdr, idat, iend]);
}

// Distance to rounded rectangle
function sdRoundBox(px, py, bx, by, r) {
  const qx = Math.abs(px) - bx + r;
  const qy = Math.abs(py) - by + r;
  return Math.min(Math.max(qx, qy), 0.0) + Math.hypot(Math.max(qx, 0.0), Math.max(qy, 0.0)) - r;
}

// Distance to line segment
function sdSegment(px, py, ax, ay, bx, by) {
  const pax = px - ax;
  const pay = py - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  return Math.hypot(dx, dy);
}

// Draw SkillWorth Brand Icon
function drawSkillWorthIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const nx = (x - cx) / (w / 2);
  const ny = (y - cy) / (h / 2);

  // Background: Deep Institutional Teal (#176B68 -> rgb(23, 107, 104))
  const bgR = 23;
  const bgG = 107;
  const bgB = 104;

  let inBg = false;
  if (isMaskable) {
    inBg = true;
  } else {
    // Rounded container box with smooth corners
    const distBox = sdRoundBox(x - cx, y - cy, (w * 0.44), (h * 0.44), w * 0.18);
    inBg = distBox <= 0;
  }

  if (!inBg) {
    return [0, 0, 0, 0]; // Transparent outside
  }

  // Inner Badge circle / rosette
  const distCircle = Math.hypot(nx, ny);

  // Central Verified Shield / Star Emblem
  // 12-pointed star / scallop emblem
  const angle = Math.atan2(ny, nx);
  const rScale = isMaskable ? 0.52 : 0.62;
  const rStar = rScale * (1.0 + 0.06 * Math.cos(10 * angle));

  const inEmblem = distCircle <= rStar;

  // Inner emblem ring
  const isEmblemBorder = inEmblem && distCircle >= (rStar - 0.04);

  // Checkmark inside emblem
  // Checkmark points: (-0.22, 0.02) -> (-0.06, 0.18) -> (0.24, -0.16)
  const d1 = sdSegment(nx, ny, -0.20, 0.02, -0.05, 0.17);
  const d2 = sdSegment(nx, ny, -0.05, 0.17, 0.22, -0.15);
  const checkDist = Math.min(d1, d2);
  const checkThickness = 0.055;
  const isCheck = checkDist <= checkThickness;

  // Subtitle arc / "SW" stylized lettering or clean checkmark badge
  if (isCheck) {
    return [255, 255, 255, 255]; // Pure white checkmark
  }

  if (isEmblemBorder) {
    return [230, 244, 243, 255]; // Soft light teal border
  }

  if (inEmblem) {
    // Inner badge: rich vibrant teal gradient (#145c59)
    const factor = 1.0 - (distCircle / rStar) * 0.2;
    return [
      Math.round(20 * factor),
      Math.round(92 * factor),
      Math.round(89 * factor),
      255
    ];
  }

  // Background gradient: (#176B68 to #125654)
  const bgFactor = 1.0 - Math.hypot(nx, ny) * 0.15;
  return [
    Math.round(bgR * bgFactor),
    Math.round(bgG * bgFactor),
    Math.round(bgB * bgFactor),
    255
  ];
}

const publicDir = path.resolve(__dirname, '../frontend/public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate Icons
const iconsToGenerate = [
  { name: 'pwa-192x192.png', size: 192, maskable: false },
  { name: 'pwa-512x512.png', size: 512, maskable: false },
  { name: 'maskable-icon-512x512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
  { name: 'apple-touch-icon-180x180.png', size: 180, maskable: false },
  { name: 'pwa-64x64.png', size: 64, maskable: false },
];

for (const icon of iconsToGenerate) {
  const filePath = path.join(publicDir, icon.name);
  const pngBuffer = generatePng(icon.size, icon.size, (x, y, w, h) => {
    return drawSkillWorthIcon(x, y, w, h, icon.maskable);
  });
  fs.writeFileSync(filePath, pngBuffer);
  console.log(`Generated: ${icon.name} (${icon.size}x${icon.size}) -> ${filePath}`);
}

console.log('All PWA icon assets generated successfully.');
