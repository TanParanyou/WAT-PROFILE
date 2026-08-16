/**
 * Strict ISO/IEC 18004:2006 Standard QR Code Generator (Byte Mode, Error Correction Level L)
 * Pure TypeScript implementation, zero external dependencies.
 */

const GF256_EXP = new Array(512);
const GF256_LOG = new Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_LOG[x] = i;
    x <<= 1;
    if (x >= 256) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF256_EXP[i] = GF256_EXP[i - 255];
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

function rsGeneratorPoly(k: number): number[] {
  let poly = [1];
  for (let i = 0; i < k; i++) {
    const root = GF256_EXP[i];
    const nextPoly = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      nextPoly[j] ^= gfMul(poly[j], root);
      nextPoly[j + 1] ^= poly[j];
    }
    poly = nextPoly;
  }
  return poly;
}

function rsEncode(data: number[], k: number): number[] {
  const gen = rsGeneratorPoly(k);
  const rem = new Array(k).fill(0);

  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0];
    for (let j = 0; j < k - 1; j++) {
      rem[j] = rem[j + 1] ^ gfMul(gen[k - 1 - j], factor);
    }
    rem[k - 1] = gfMul(gen[0], factor);
  }
  return rem;
}

interface QRVersionSpec {
  total: number;
  data: number;
  ec: number;
  blocks: number;
  align: number[];
}

const QR_TABLE_L: (QRVersionSpec | null)[] = [
  null,
  { total: 26, data: 19, ec: 7, blocks: 1, align: [] },
  { total: 44, data: 34, ec: 10, blocks: 1, align: [6, 18] },
  { total: 70, data: 55, ec: 15, blocks: 1, align: [6, 22] },
  { total: 100, data: 80, ec: 20, blocks: 1, align: [6, 26] },
  { total: 134, data: 108, ec: 26, blocks: 1, align: [6, 30] },
  { total: 172, data: 136, ec: 18, blocks: 2, align: [6, 34] },
  { total: 196, data: 156, ec: 20, blocks: 2, align: [6, 22, 38] },
  { total: 242, data: 194, ec: 24, blocks: 2, align: [6, 24, 42] },
  { total: 292, data: 232, ec: 30, blocks: 2, align: [6, 26, 46] },
  { total: 346, data: 274, ec: 18, blocks: 4, align: [6, 28, 50] },
];

function getFormatCodeword(ecLevel: number, mask: number): number {
  const data = (ecLevel << 3) | mask;
  let rem = data << 10;
  const gen = 0x537;
  for (let i = 4; i >= 0; i--) {
    if ((rem >> (i + 10)) & 1) {
      rem ^= gen << i;
    }
  }
  return ((data << 10) | rem) ^ 0x5412;
}

export function generateQRCodeMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);

  let version = 1;
  while (version <= 10) {
    const spec = QR_TABLE_L[version];
    if (!spec) break;
    const maxDataBytes = spec.data - 2;
    if (bytes.length <= maxDataBytes) break;
    version++;
  }
  if (version > 10) version = 10;

  const spec = QR_TABLE_L[version]!;
  const size = 17 + 4 * version;

  // 1. Bitstream encoding
  const bits: number[] = [];
  function pushBits(val: number, count: number) {
    for (let i = count - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  pushBits(0b0100, 4); // Byte mode (0100)
  pushBits(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) pushBits(b, 8);

  const totalDataBits = spec.data * 8;
  const termLen = Math.min(4, totalDataBits - bits.length);
  for (let i = 0; i < termLen; i++) bits.push(0);
  while (bits.length % 8 !== 0 && bits.length < totalDataBits) bits.push(0);

  const dataWords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let word = 0;
    for (let j = 0; j < 8; j++) {
      word = (word << 1) | (bits[i + j] || 0);
    }
    dataWords.push(word);
  }

  const padPatterns = [0xec, 0x11];
  let padIdx = 0;
  while (dataWords.length < spec.data) {
    dataWords.push(padPatterns[padIdx % 2]);
    padIdx++;
  }

  // 2. RS error correction
  const numBlocks = spec.blocks;
  const dataPerBlock = Math.floor(spec.data / numBlocks);
  const ecPerBlock = spec.ec;

  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];

  for (let b = 0; b < numBlocks; b++) {
    const blockData = dataWords.slice(b * dataPerBlock, (b + 1) * dataPerBlock);
    dataBlocks.push(blockData);
    ecBlocks.push(rsEncode(blockData, ecPerBlock));
  }

  const finalCodewords: number[] = [];
  for (let i = 0; i < dataPerBlock; i++) {
    for (let b = 0; b < numBlocks; b++) {
      finalCodewords.push(dataBlocks[b][i]);
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < numBlocks; b++) {
      finalCodewords.push(ecBlocks[b][i]);
    }
  }

  const allBits: number[] = [];
  for (const word of finalCodewords) {
    for (let i = 7; i >= 0; i--) {
      allBits.push((word >> i) & 1);
    }
  }

  // 3. Matrix
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null),
  );
  const isReserved: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false),
  );

  function setModule(r: number, c: number, val: boolean, reserved = true) {
    matrix[r][c] = val;
    if (reserved) isReserved[r][c] = true;
  }

  // Finders
  function placeFinder(topRow: number, leftCol: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        setModule(topRow + r, leftCol + c, isBorder || isCenter);
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Separators
  for (let i = 0; i < 8; i++) {
    setModule(7, i, false);
    setModule(i, 7, false);
    setModule(7, size - 8 + i, false);
    setModule(i, size - 8, false);
    setModule(size - 8, i, false);
    setModule(size - 8 + i, 7, false);
  }

  // Timing
  for (let i = 8; i < size - 8; i++) {
    if (!isReserved[6][i]) setModule(6, i, i % 2 === 0);
    if (!isReserved[i][6]) setModule(i, 6, i % 2 === 0);
  }

  // Alignment
  if (spec.align.length > 0) {
    const coords = spec.align;
    for (const r of coords) {
      for (const c of coords) {
        if (
          (r < 9 && c < 9) ||
          (r < 9 && c > size - 9) ||
          (r > size - 9 && c < 9)
        ) {
          continue;
        }

        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
            const isCenter = dr === 0 && dc === 0;
            setModule(r + dr, c + dc, isBorder || isCenter);
          }
        }
      }
    }
  }

  // Dark module is at (size - 8, 8)
  setModule(size - 8, 8, true);

  // Format reservation
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) isReserved[8][i] = true;
    if (i !== 6) isReserved[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    isReserved[8][size - 1 - i] = true;
    isReserved[size - 1 - i][8] = true;
  }

  // 4. Data & Mask 0 ((r+c)%2===0)
  let bitIdx = 0;
  let upwards = true;

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--;
    const cols = [right, right - 1];

    for (let step = 0; step < size; step++) {
      const r = upwards ? size - 1 - step : step;
      for (const c of cols) {
        if (!isReserved[r][c]) {
          const bitVal = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = (bitVal === 1) !== mask;
        }
      }
    }
    upwards = !upwards;
  }

  // 5. Format info bits (EC Level L = 1, Mask 0 = 0)
  // Codeword: 0x77C4 (111011111000100)
  const formatWord = getFormatCodeword(1, 0);
  const f = (bitPos: number) => ((formatWord >> bitPos) & 1) === 1;

  // Around Top-Left: f(14) down to f(0)
  matrix[8][0] = f(14);
  matrix[8][1] = f(13);
  matrix[8][2] = f(12);
  matrix[8][3] = f(11);
  matrix[8][4] = f(10);
  matrix[8][5] = f(9);
  matrix[8][7] = f(8);
  matrix[8][8] = f(7);
  matrix[7][8] = f(6);
  matrix[5][8] = f(5);
  matrix[4][8] = f(4);
  matrix[3][8] = f(3);
  matrix[2][8] = f(2);
  matrix[1][8] = f(1);
  matrix[0][8] = f(0);

  // Bottom-Left (f(0) at bottom up to f(6))
  matrix[size - 1][8] = f(0);
  matrix[size - 2][8] = f(1);
  matrix[size - 3][8] = f(2);
  matrix[size - 4][8] = f(3);
  matrix[size - 5][8] = f(4);
  matrix[size - 6][8] = f(5);
  matrix[size - 7][8] = f(6);

  // Top-Right (f(7) to f(14) from left to right)
  matrix[8][size - 8] = f(7);
  matrix[8][size - 7] = f(8);
  matrix[8][size - 6] = f(9);
  matrix[8][size - 5] = f(10);
  matrix[8][size - 4] = f(11);
  matrix[8][size - 3] = f(12);
  matrix[8][size - 2] = f(13);
  matrix[8][size - 1] = f(14);

  return matrix.map((row) => row.map((cell) => cell === true));
}
